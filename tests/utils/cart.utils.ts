// @ts-check

/**
 * Copyright elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileOverview Puts a known cart in place over HTTP, for tests that need a
 * filled cart as a precondition rather than as the thing under test.
 *
 * `page.request` shares the browser context's cookie jar, so a POST issued from
 * here lands on the same Magento session (PHPSESSID) the test then browses
 * with. That is what makes this a substitute for clicking through the PDP and
 * not merely a faster way to talk to Magento — and it is why the masked-quote
 * REST endpoints (/rest/V1/guest-carts) are no use for this: their quote is
 * bound to no session, so the browser would never see it.
 *
 * Seeding itself performs no navigation and leaves the browser wherever the
 * test put it. The one exception is bootstrapping a form key for a context that
 * has none - see getFormKey.
 */

import type { Page } from '@playwright/test';

/**
 * One line to put in the cart. A configurable product needs its chosen options
 * posted alongside the product ID, so that variant will extend this type rather
 * than replace it.
 */
export interface CartSeedItem {
	/** PDP slug of the product, e.g. `slugs.frontend.product.simple`. */
	slug: string;
	quantity: number;
}

/**
 * A product as the cart routes need it: the entity ID that goes in the URL and,
 * for a configurable, the option choice that turns that parent into a
 * purchasable variant. Simple products carry an empty choice.
 */
interface ResolvedProduct {
	productId: string;
	/** attribute id => option value id */
	superAttributes: Record<string, string>;
}

interface ConfigurableOption {
	id: string;
	label: string;
	products: string[];
}

interface ConfigurableAttribute {
	id: string;
	code: string;
	label: string;
	options: ConfigurableOption[];
}

interface CartSectionItem {
	item_id: string | number;
	product_id: string | number;
	qty: number;
	product_name?: string;
}

interface CartSection {
	summary_count?: number;
	items?: CartSectionItem[];
}

/**
 * Magento entity IDs differ per store, so they cannot be kept in config the way
 * SKUs and slugs are; they are read off the PDP's add-to-cart form instead.
 * Cached for the lifetime of the process, which means a worker resolves each
 * product once however many of its tests seed that product.
 */
const productCache = new Map<string, ResolvedProduct>();

/** How long to wait for the form-key script to run after the bootstrap load. */
const FORM_KEY_TIMEOUT_MS = 5_000;

/**
 * Pulls a balanced JSON object out of embedded markup. A lazy regex would have
 * to be anchored on whichever key happens to follow, which differs between
 * Magento and Hyvä versions; counting braces does not care what comes next.
 */
function extractJsonObject(html: string, from: number): string | null {
	const braceStart = html.indexOf('{', from);
	if (braceStart === -1) {
		return null;
	}

	let depth = 0;
	let inString = false;
	let escaped = false;

	for (let i = braceStart; i < html.length; i++) {
		const character = html[i];

		if (escaped) {
			escaped = false;
		} else if (character === '\\') {
			escaped = true;
		} else if (character === '"') {
			inString = !inString;
		} else if (!inString && character === '{') {
			depth++;
		} else if (!inString && character === '}') {
			depth--;
			if (depth === 0) {
				return html.slice(braceStart, i + 1);
			}
		}
	}

	return null;
}

/**
 * `"attributes"` can occur in more than one embedded blob, so every occurrence
 * is tried and the first one shaped like a configurable's option map wins.
 */
function findConfigurableAttributes(html: string): ConfigurableAttribute[] | null {
	const marker = '"attributes"';

	for (let at = html.indexOf(marker); at !== -1; at = html.indexOf(marker, at + 1)) {
		const json = extractJsonObject(html, at + marker.length);
		if (!json) {
			continue;
		}

		try {
			const parsed = JSON.parse(json) as Record<string, ConfigurableAttribute>;
			const attributes = Object.values(parsed);

			if (
				attributes.length > 0 &&
				attributes.every((attribute) => attribute?.id && Array.isArray(attribute.options))
			) {
				return attributes;
			}
		} catch {
			// Not the blob we are after; keep looking.
		}
	}

	return null;
}

/**
 * Chooses one option per attribute for a configurable product.
 *
 * Every option in the PDP's embedded config lists the simple products carrying
 * it, and intersecting those lists is how the storefront's own script decides
 * which swatches to enable. Doing the same here picks a combination that really
 * exists rather than one that merely looks plausible. Walking the attributes in
 * order and taking the first still-compatible option mirrors the "first enabled
 * option per group" that ProductPage.addConfigurableProductToCart clicks.
 */
function pickConfigurableOptions(html: string, slug: string): Record<string, string> {
	const attributes = findConfigurableAttributes(html);

	if (!attributes) {
		// A configurable always renders super_attribute inputs, so their presence
		// without a readable option map means the markup moved, not that this is a
		// simple product - worth failing on rather than posting a parent ID alone.
		if (html.includes('super_attribute')) {
			throw new Error(
				`Cart seeding: ${slug} renders super_attribute inputs but no readable ` +
					`options JSON, so no variant could be chosen.`,
			);
		}
		return {};
	}

	const chosen: Record<string, string> = {};

	// Simple products that every choice so far is compatible with. Starts empty
	// with `unconstrained` true, because the first attribute rules nothing out.
	let candidates: string[] = [];
	let unconstrained = true;

	for (const attribute of attributes) {
		const compatible = candidates;
		const noConstraint = unconstrained;

		const option = (attribute.options ?? []).find(
			(candidate) =>
				(candidate.products?.length ?? 0) > 0 &&
				(noConstraint || candidate.products.some((id) => compatible.includes(id))),
		);

		if (!option) {
			throw new Error(
				`Cart seeding: no purchasable combination on ${slug} - ran out of options ` +
					`at "${attribute.label}" with candidates ` +
					`[${noConstraint ? 'none yet' : candidates.join(', ')}].`,
			);
		}

		chosen[attribute.id] = option.id;
		candidates = noConstraint
			? option.products
			: candidates.filter((id) => option.products.includes(id));
		unconstrained = false;
	}

	return chosen;
}

/**
 * The `product` hidden input in the add-to-cart form is the only place the
 * entity ID appears in the markup. Attribute order is not guaranteed, hence the
 * two patterns.
 */
async function resolveProduct(page: Page, slug: string): Promise<ResolvedProduct> {
	const cached = productCache.get(slug);
	if (cached) {
		return cached;
	}

	const response = await page.request.get(slug);
	if (!response.ok()) {
		throw new Error(
			`Cart seeding: could not load the product page at ${slug} ` +
				`(HTTP ${response.status()}) to read its product ID.`,
		);
	}

	const html = await response.text();
	const match =
		html.match(/<input[^>]*\bname=["']product["'][^>]*\bvalue=["'](\d+)["']/i) ??
		html.match(/<input[^>]*\bvalue=["'](\d+)["'][^>]*\bname=["']product["']/i);

	if (!match) {
		throw new Error(
			`Cart seeding: no add-to-cart form found on ${slug}. Either the slug in ` +
				`slugs.json no longer resolves to a purchasable product, or the product ` +
				`is out of stock.`,
		);
	}

	const resolved: ResolvedProduct = {
		productId: match[1],
		superAttributes: pickConfigurableOptions(html, slug),
	};

	productCache.set(slug, resolved);
	return resolved;
}

/**
 * The cart section is the cheapest structured read of the current cart, and it
 * carries `item_id` per line, so it doubles as the input for clearing.
 */
async function readCart(page: Page): Promise<CartSection> {
	const response = await page.request.get('/customer/section/load?sections=cart');
	if (!response.ok()) {
		throw new Error(
			`Cart seeding: could not read the cart section (HTTP ${response.status()}).`,
		);
	}

	const body = (await response.json()) as { cart?: CartSection };
	return body.cart ?? {};
}

/**
 * Magento sets the form key from JavaScript (Magento_PageCache's
 * form-key-provider), never through a Set-Cookie header — fetching a page over
 * HTTP hands back PHPSESSID and nothing else. So a context without a form key
 * has to be bootstrapped with a real navigation, and the cookie has to be
 * waited for afterwards: it appears when the script runs, not when the document
 * arrives.
 */
async function getFormKey(page: Page): Promise<string> {
	const readCookie = async (): Promise<string | undefined> =>
		(await page.context().cookies()).find((cookie) => cookie.name === 'form_key')?.value;

	// An authenticated context inherits a form key from its stored state, so this
	// costs a page load only for guests.
	const existing = await readCookie();
	if (existing) {
		return existing;
	}

	await page.goto('/', { waitUntil: 'domcontentloaded' });

	// Wait on the cookie appearing rather than on a duration: the script sets it
	// whenever it runs, and form_key is not httpOnly precisely because JavaScript
	// is what writes it. A timeout here is not fatal on its own - the read below
	// decides - so the rejection is swallowed.
	await page
		.waitForFunction(() => document.cookie.includes('form_key='), null, {
			timeout: FORM_KEY_TIMEOUT_MS,
		})
		.catch(() => undefined);

	const formKey = await readCookie();
	if (formKey) {
		return formKey;
	}

	throw new Error(
		`Cart seeding: no form_key cookie ${FORM_KEY_TIMEOUT_MS}ms after loading the ` +
			`homepage. Magento sets it from JavaScript, so the page's scripts either did ` +
			`not run or are blocked.`,
	);
}

/**
 * `checkout/cart/updatePost` with a quantity of 0 removes a line (see
 * Magento\Checkout\Model\Cart::updateItems), which empties the whole cart in
 * one request and needs no per-item delete route.
 */
async function clearCart(page: Page, items: CartSectionItem[], formKey: string): Promise<void> {
	if (items.length === 0) {
		return;
	}

	const form: Record<string, string> = { form_key: formKey };
	for (const item of items) {
		form[`cart[${item.item_id}][qty]`] = '0';
	}

	await page.request.post('/checkout/cart/updatePost', {
		form,
		maxRedirects: 0,
		failOnStatusCode: false,
	});
}

async function addToCart(
	page: Page,
	product: ResolvedProduct,
	quantity: number,
	formKey: string,
): Promise<void> {
	const form: Record<string, string> = {
		product: product.productId,
		qty: String(quantity),
		form_key: formKey,
	};

	// A configurable is added by its parent ID plus the chosen options; without
	// them Magento rejects the add rather than picking a variant for you.
	for (const [attributeId, optionId] of Object.entries(product.superAttributes)) {
		form[`super_attribute[${attributeId}]`] = optionId;
	}

	await page.request.post(`/checkout/cart/add/product/${product.productId}/`, {
		form,
		// The redirect target is the page the customer came from; following it
		// would fetch a full HTML document for nothing.
		maxRedirects: 0,
		failOnStatusCode: false,
	});
}

/**
 * The cart section reports a configurable under its parent's ID, which is the
 * same ID that was posted, so simple and configurable items verify alike.
 *
 * Magento answers `checkout/cart/add` with a redirect whether or not the item
 * was accepted — a stale form key, an out-of-stock product and a success are
 * indistinguishable by status code — so the cart contents are the only
 * trustworthy signal that seeding worked.
 */
async function verifyCart(page: Page, expected: Map<string, number>): Promise<void> {
	const cart = await readCart(page);

	const actual = new Map<string, number>();
	for (const item of cart.items ?? []) {
		const key = String(item.product_id);
		actual.set(key, (actual.get(key) ?? 0) + Number(item.qty));
	}

	const matches =
		actual.size === expected.size &&
		[...expected].every(([productId, quantity]) => actual.get(productId) === quantity);

	if (matches) {
		return;
	}

	// The raw payload goes into the message because an unexpected shape (rather
	// than an unexpected quantity) is the other thing that lands here, and it is
	// the only thing that explains it.
	throw new Error(
		`Cart seeding did not produce the expected cart.\n` +
			`  expected (product_id => qty): ${JSON.stringify([...expected])}\n` +
			`  actual   (product_id => qty): ${JSON.stringify([...actual])}\n` +
			`  cart section payload: ${JSON.stringify(cart)}`,
	);
}

/**
 * Makes the cart hold exactly `items` — anything already in it is removed
 * first. Clearing is not only for tidiness: authenticated specs reuse one
 * Magento account for every test in the worker, and a customer's quote is
 * persistent server-side, so without it a cart seeded by one test is still
 * there in the next. Guests get a fresh context and are empty already, but the
 * same path serves both.
 */
export async function seedCart(page: Page, items: CartSeedItem[]): Promise<void> {
	const formKey = await getFormKey(page);

	const existing = await readCart(page);
	await clearCart(page, existing.items ?? [], formKey);

	const expected = new Map<string, number>();

	for (const item of items) {
		const product = await resolveProduct(page, item.slug);
		await addToCart(page, product, item.quantity, formKey);
		expected.set(product.productId, (expected.get(product.productId) ?? 0) + item.quantity);
	}

	await verifyCart(page, expected);
}
