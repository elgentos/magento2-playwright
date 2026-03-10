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
