// @ts-check

/**
 * Copyright Elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileoverview Smoke tests for important pages.
 * This file also checks the HTTP authentication headers are sent.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import { requireEnv, getHttpCredentials } from '@utils/env.utils';
import { UIReference, slugs } from '@config';

function regressionSnapshotName(label: string, browser: string, extension: 'png' | 'yml'): string {
	const now = new Date();
	const day = String(now.getDate()).padStart(2, '0');
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const date = `${day}${month}${now.getFullYear()}`;
	return `production_${label}_${date}_${browser}.${extension}`;
}

/**
 * Test: Validate HTTP authentication configuration and site access.
 * Skipped when HTTP_AUTH_USERNAME and HTTP_AUTH_PASSWORD are not set.
 * Reports whether the site requires authentication and whether credentials work.
 * @param page - Playwright page instance used for interacting with the website.
 * @param playwright - Playwright instance we can use to create a browser without HTTP authentication
 */
test('HTTP_auth_headers_are_sent', async ({ page, playwright }) => {
	const httpAuth = getHttpCredentials();
	test.skip(!httpAuth, 'HTTP_AUTH_USERNAME and HTTP_AUTH_PASSWORD are not set.');

	// 1. Verify httpAuth contains both a username and password.
	expect(httpAuth!.username, 'HTTP_AUTH_USERNAME should not be empty').toBeTruthy();
	expect(httpAuth!.password, 'HTTP_AUTH_PASSWORD should not be empty').toBeTruthy();

	// 2. Determine if the site actually requires authentication
	//    by making an unauthenticated request (without credentials).
	const unauthContext = await playwright.request.newContext();
	const unauthResponse = await unauthContext.head(requireEnv('PLAYWRIGHT_BASE_URL'));
	await unauthContext.dispose();
	const siteRequiresAuth = unauthResponse.status() === 401;

	if (!siteRequiresAuth) {
		// 3. Site does not require auth — report status.
		test.info().annotations.push({
			type: 'HTTP Auth',
			description: `Site does not require authentication (status ${unauthResponse.status()}). httpAuth is set with username "${httpAuth!.username}".`,
		});
		return;
	}

	// 4. Site requires auth — verify we can visit the page with the provided credentials.
	const response = await page.goto('/');
	expect(response, 'Navigation should return a response').not.toBeNull();
	expect(response!.ok(), `Authenticated request should succeed but got ${response!.status()}`).toBeTruthy();

	test.info().annotations.push({
		type: 'HTTP Auth',
		description: 'Site requires authentication — successfully accessed with provided credentials.',
	});
});

/**
 * Test Group: Smoke tests for critical pages
 *
 * Note that test groups below loop through the pages, but not here.
 * This is because we need to be able to check for different elements on different pages,
 * making it more benificial to write each test separately.
 */
test.describe('Smoke tests for critical pages', () => {

	/**
	 * Test: Confirm the homepage can be reached.
	 * @param page - Playwright page instance used for interacting with the website.
	 */
	test('Homepage_returns_200', { tag: ['@smoke', '@cold'] }, async ({page}) => {
		const homepageURL = requireEnv(`PLAYWRIGHT_BASE_URL`);
		const homepageResponsePromise = page.waitForResponse(homepageURL);

		await page.goto(homepageURL);
		const homepageResponse = await homepageResponsePromise;
		expect(homepageResponse.status(), 'Homepage should return 200').toBe(200);

		await expect(page.getByRole('heading', {name: UIReference.homePage.homePageTitleText, level: 1}),
		'Homepage has a visible title').toBeVisible();
	});

	/**
	 * Test: Confirm a product listing (category) page can be reached.
	 * @param page - Playwright page instance used for interacting with the website.
	 */
	test('Plp_returns_200', { tag: ['@smoke', '@cold'] }, async ({page}) => {
		const plpResponsePromise = page.waitForResponse(slugs.categoryPage.categorySlug);

		await page.goto(slugs.categoryPage.categorySlug);
		const plpResponse = await plpResponsePromise;
		expect(plpResponse.status(), 'PLP should return 200').toBe(200);

		await expect( page.getByRole('heading', {name: UIReference.categoryPage.categoryPageTitleText}),
		'PLP has a visible title').toBeVisible();
	});

	/**
	 * Test: Confirm a product detail page can be reached.
	 * @param page - Playwright page instance used for interacting with the website.
	 */
	test('Pdp_returns_200', { tag: ['@smoke', '@cold'] }, async ({page}) => {
		const pdpResponsePromise = page.waitForResponse(slugs.productPage.simpleProductSlug);

		await page.goto(slugs.productPage.simpleProductSlug);
		const pdpResponse = await pdpResponsePromise;
		expect(pdpResponse.status(), 'PDP should return 200').toBe(200);

		await expect(page.getByRole('heading', {level: 1, name: UIReference.productPage.simpleProductTitle}),
		'PDP has a visible title').toBeVisible();
	});

	/**
	 * Test: Confirm the checkout can be reached and returns a 302.
	 * Then, the checkout should redirect the user - often to the cart.
	 * @param page - Playwright page instance used for interacting with the website.
	 */
	test('Checkout_returns_302_then_redirects', { tag: ['@smoke', '@cold'] }, async ({page}) => {
		const responsePromise = page.waitForResponse(slugs.checkout.checkoutSlug);

		await page.goto(slugs.checkout.checkoutSlug);
		const response = await responsePromise;

		expect(response.status(), 'Cart empty, checkout should return 302').toBe(302);
		expect(page.url(), 'Cart empty, checkout should redirect to cart').toContain(slugs.cart.cartSlug);

		await expect(page.getByRole('heading', {name: UIReference.cart.cartTitleText}),
		'Cart has a visible title').toBeVisible();

		expect((await page.request.head(page.url())).status(), `Current page (${page.url()}) should return 200`).toBe(200);
	});
});

/**
 * Test Group: Visual regression tests
 *
 * For each listed page, the production site is captured fresh on every run,
 * written to tests/utils/snapshots/ as production_<page>_<DDMMYYYY>_<browser>.png,
 * and used as the baseline that the base URL is compared against.
 */
test.describe('Visual Regression Tests', () => {

	// Pin the viewport and DPR so screenshots are byte-comparable regardless of
	// the project's device profile. Desktop Safari defaults deviceScaleFactor
	// to 2, which would otherwise produce a 2560×1440 bitmap on webkit while
	// chromium/firefox produce 1280×720.
	test.use({
		viewport: { width: 1280, height: 720 },
		deviceScaleFactor: 1,
	});

	// Per-page mask selectors hide elements that legitimately differ between
	// production and the base URL (e.g. images served at different sizes by a
	// CDN). Selectors apply to BOTH the production capture and the base URL
	// comparison, so any element matched is painted over on both sides.
	const visualRegressionPages: { label: string; slug: string; maskSelectors?: string[] }[] = [
		{ label: 'homepage', slug: '/' },
		{ label: 'plp', slug: slugs.categoryPage.categorySlug, maskSelectors: ['.product-item-photo'] },
		{ label: 'pdp', slug: slugs.productPage.simpleProductSlug },
		{ label: 'cart', slug: slugs.cart.cartSlug },
	];

	for (const { label, slug, maskSelectors } of visualRegressionPages) {
		/**
		 * Test: Compare the base URL page against a freshly captured production baseline.
		 * @param page - Playwright page instance used for interacting with the website.
		 * @param testInfo - Test metadata, used to resolve artifact and snapshot paths.
		 */
		test(`${label}_matches_visual_baseline`, { tag: ['@smoke', '@visual', '@cold']}, async ({ page }, testInfo) => {
			const snapshotName = regressionSnapshotName(label, testInfo.project.name, 'png');
			const masks = (maskSelectors ?? []).map(selector => page.locator(selector));

			// 1. Navigate to the slug on the production URL.
			const productionUrl = new URL(slug, requireEnv('PLAYWRIGHT_PRODUCTION_URL')).toString();
			await page.goto(productionUrl);
			await page.waitForLoadState('load');
			// TODO: add an element.waitFor(); here so we can confirm the page is done loading.

			// 2. Capture production and write it to the snapshot path that step 4's
			//    assertion reads. One file per page/browser/day — re-running on the
			//    same day overwrites it with the latest production state.
			const productionBuffer = await page.screenshot({ mask: masks });
			const baselinePath = testInfo.snapshotPath(snapshotName);
			fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
			fs.writeFileSync(baselinePath, productionBuffer);

			// 3. Navigate to the same slug on the base URL.
			await page.goto(slug);
			await page.waitForLoadState('load');
			// TODO: add an element.waitFor(); here so we can confirm the page is done loading.

			// 4. Compare the base URL page against the production baseline from step 2.
			await expect(page).toHaveScreenshot(snapshotName, { mask: masks });
		});
	}
});


/**
 * Test Group: Aria regression tests (WORK IN PROGRESS)
 * ----------------------------------------------------------------------------
 * 		THESE TESTS ARE WORK IN PROGRESS AND CURRENTLY DON'T WORK.
 * 		When comparing aria snapshots, the URLs of a review-env and the
 * 		production-site will always be different.
 * ----------------------------------------------------------------------------
 *
 * For each listed page, the accessibility tree of the production site is
 * captured fresh on every run, written to tests/utils/snapshots/ as
 * production_<page>_<DDMMYYYY>_<browser>.yml, and used as the expected snapshot
 * that the base URL is compared against.
 */
// test.describe('Aria Regression Tests', () => {

// 	const ariaRegressionPages: { label: string; slug: string }[] = [
// 		{ label: 'homepage', slug: '/' },
// 		{ label: 'plp', slug: slugs.categoryPage.categorySlug },
// 		{ label: 'pdp', slug: slugs.productPage.simpleProductSlug },
// 		{ label: 'cart', slug: slugs.cart.cartSlug },
// 	];

// 	for (const { label, slug } of ariaRegressionPages) {
// 		/**
// 		 * Test: Compare the base URL accessibility tree against a freshly captured production tree.
// 		 * @param page - Playwright page instance used for interacting with the website.
// 		 * @param testInfo - Test metadata, used to resolve artifact paths.
// 		 */
// 		test(`${label}_matches_aria_baseline`, async ({ page }, testInfo) => {
// 			const snapshotName = regressionSnapshotName(label, testInfo.project.name, 'yml');

// 			// 1. Navigate to the slug on the production URL.
// 			const productionUrl = new URL(slug, requireEnv('PLAYWRIGHT_PRODUCTION_URL')).toString();
// 			await page.goto(productionUrl);
// 			await page.waitForLoadState('networkidle');

// 			// 2. Capture the production accessibility tree and persist it.
// 			const productionAriaSnapshot = await page.locator('body').ariaSnapshot();
// 			const artifactPath = testInfo.snapshotPath(snapshotName);
// 			fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
// 			fs.writeFileSync(artifactPath, productionAriaSnapshot);

// 			// 3. Navigate to the same slug on the base URL.
// 			await page.goto(slug);
// 			await page.waitForLoadState('networkidle');

// 			// 4. Compare the base URL accessibility tree against the production tree from step 2.
// 			await expect(page.locator('body')).toMatchAriaSnapshot(productionAriaSnapshot);
// 		});
// 	}
// });
