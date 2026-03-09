// @ts-check

/**
 * Copyright Elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileoverview Smoke tests for important pages.
 * This file also checks the HTTP authentication headers are sent.
 */

import { test, expect } from '@playwright/test';

import { requireEnv, getHttpCredentials } from '@utils/env.utils';
import { UIReference, slugs } from '@config';

/**
 * Test: Ensure HTTP authentication headers are sent when configured.
 * Skipped when HTTP_AUTH_USERNAME and HTTP_AUTH_PASSWORD are not set.
 * @param page - Playwright page instance used for interacting with the website.
 */
test('HTTP_auth_headers_are_sent', async ({ page }) => {
	test.skip(!getHttpCredentials(), 'HTTP_AUTH_USERNAME and HTTP_AUTH_PASSWORD are not set');

	const [request] = await Promise.all([
		page.waitForRequest('**/*'),
		page.goto('/'),
	]);

	const authHeader = request.headers()['authorization'];
	expect(authHeader, 'Authorization header should contain Basic credentials').toContain('Basic');
});

/**
 * Test Group: Smoke tests for critical pages
 */
test.describe('Page health checks', () => {

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
