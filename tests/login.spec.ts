// @ts-check

/**
 * Copyright Elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileoverview various tests to ensure authentication is possible on the webshop.
 */

import { test, expect } from '@playwright/test';

import LoginPage  from '@poms/frontend/login.page';
import { requireEnv } from '@utils/env.utils';

import { outcomeMarker, inputValues } from '@config';

/**
 * Test: a guest logs in using correct credentials.
 * @assume the necessary account(s) have been created through setup.spec
 * @param page - Playwright page instance used for interacting with the website.
 */
test('User_logs_in_with_valid_credentials', {tag: '@hot'}, async ({page, browserName}) => {
	const id = test.info().parallelIndex;
	let user = `playwright_user_${id}@elgentos.nl`;
	let password = requireEnv(`MAGENTO_EXISTING_ACCOUNT_PASSWORD`);

	const loginPage = new LoginPage(page);
	await loginPage.login(user, password);
	// Wait for network idle to ensure cache storage is updated.
	await page.waitForLoadState('networkidle');

	const customerData = await page.evaluate(() => {
		const data = localStorage.getItem('mage-cache-storage');
		return data ? JSON.parse(data) : null;
	});

	// Confirm user is logged in
	expect(customerData, `Customer data should exist in localStorage`).toBeTruthy();
	expect(customerData,`Customer data should contain customer information`).toHaveProperty('customer');

	// Soft expects below (not required to pass)
	expect.soft(customerData.customer.fullname, `Customer firstname should match`).toContain(inputValues.account.firstName);
	expect.soft(customerData.customer.fullname, `Customer lastname should match`).toContain(inputValues.account.lastName);
});

/**
 * Test: a guest can't log in with invalid credentials
 * @param page - Playwright page instance used for interacting with the website.
 */
test('Invalid_credentials_are_rejected', async ({page}) => {
	const loginPage = new LoginPage(page);
	await loginPage.loginExpectError('invalid@example.com', 'wrongpassword', outcomeMarker.login.invalidCredentialsMessage);
});

/**
 * Test: a login attempt fails if the guest does not provide a password
 * @param page - Playwright page instance used for interacting with the website.
 */
test('Login_fails_with_missing_password', async ({page}) => {
	const loginPage = new LoginPage(page);
	await loginPage.loginExpectError('invalid@example.com', '', '');
});
