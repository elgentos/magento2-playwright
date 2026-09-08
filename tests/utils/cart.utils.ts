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
const productIdCache = new Map<string, string>();

/** How long to wait for the form-key script to run after the bootstrap load. */
const FORM_KEY_TIMEOUT_MS = 5_000;

/**
 * The `product` hidden input in the add-to-cart form is the only place the
 * entity ID appears in the markup. Attribute order is not guaranteed, hence the
 * two patterns.
 */
async function resolveProductId(page: Page, slug: string): Promise<string> {
	const cached = productIdCache.get(slug);
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

	productIdCache.set(slug, match[1]);
	return match[1];
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

	const deadline = Date.now() + FORM_KEY_TIMEOUT_MS;
	for (;;) {
		const formKey = await readCookie();
		if (formKey) {
			return formKey;
		}
		if (Date.now() >= deadline) {
			break;
		}
		await page.waitForTimeout(100);
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
	productId: string,
	quantity: number,
	formKey: string,
): Promise<void> {
	await page.request.post(`/checkout/cart/add/product/${productId}/`, {
		form: { product: productId, qty: String(quantity), form_key: formKey },
		// The redirect target is the page the customer came from; following it
		// would fetch a full HTML document for nothing.
		maxRedirects: 0,
		failOnStatusCode: false,
	});
}

/**
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
		const productId = await resolveProductId(page, item.slug);
		await addToCart(page, productId, item.quantity, formKey);
		expected.set(productId, (expected.get(productId) ?? 0) + item.quantity);
	}

	await verifyCart(page, expected);
}
