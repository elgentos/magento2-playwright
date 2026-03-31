// @ts-check

/**
 * Copyright Elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileoverview Test to ensure order history remains functional.
 */

import { test } from '@playwright/test';

import LoginPage from '@poms/frontend/login.page';
import ProductPage from '@poms/frontend/product.page';
import CheckoutPage from '@poms/frontend/checkout.page';
import OrderHistoryPage from '@poms/frontend/orderhistory.page';

import { requireEnv } from '@utils/env.utils';
import { UIReference, slugs } from '@config';

/**
 * Test: User places an order, then verifies it's in their order history
 * @param page - Playwright page instance used to interact with the website.
 */
test('Recent_order_is_visible_in_history', async ({ page }) => {
	const parallelIndex = test.info().parallelIndex;
	const email = `playwright_user_${parallelIndex}@elgentos.nl`;
	const password = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');

	const loginPage = new LoginPage(page);
	const productPage = new ProductPage(page);
	const checkoutPage = new CheckoutPage(page);
	const orderHistoryPage = new OrderHistoryPage(page);

	await loginPage.login(email, password);

	await page.goto(slugs.productPage.simpleProductSlug);
	await productPage.addSimpleProductToCart(UIReference.productPage.simpleProductTitle, slugs.productPage.simpleProductSlug);
	await page.goto(slugs.checkout.checkoutSlug);

	const orderNumberLocator = await checkoutPage.placeOrder();
	const orderNumberText = await orderNumberLocator.innerText();
	const orderNumber = orderNumberText.replace(/\D/g, '');

	await orderHistoryPage.open();
	await orderHistoryPage.verifyOrderPresent(orderNumber);
});
