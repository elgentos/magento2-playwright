// @ts-check

/**
 * Copyright Elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileoverview Test to ensure order history remains functional.
 */

import { test } from '@playwright/test';

import { BaseLoginPage } from '@poms/frontend/login.page';
import { BaseProductPage } from '@poms/frontend/product.page';
import { BaseCheckoutPage } from '@poms/frontend/checkout.page';
import { BaseOrderHistoryPage } from '@poms/frontend/orderhistory.page';

import { requireEnv } from '@utils/env.utils';
import { UIReference, slugs, toggles } from '@config';

/**
 * Test: User places an order, then verifies it's in their order history
 * @param page - Playwright page instance used to interact with the website.
 */
test('Recent_order_is_visible_in_history', async ({ page }) => {
	test.skip(
		toggles.fixedRateShipping === false || toggles.checkMoneyOrder === false,
		'Requires enabled test toggles: fixedRateShipping and checkMoneyOrder',
	);
	const parallelIndex = test.info().parallelIndex;
	const email = `playwright+${parallelIndex}@elgentos.nl`;
	const password = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');

	const loginPage = new BaseLoginPage(page);
	const productPage = new BaseProductPage(page);
	const checkoutPage = new BaseCheckoutPage(page);
	const orderHistoryPage = new BaseOrderHistoryPage(page);

	await loginPage.goToLoginPage();
	await loginPage.login(email, password);

	await productPage.addSimpleProductToCart(
		UIReference.text.frontend.product.simpleProduct,
		slugs.frontend.product.simple,
	);
	await page.goto(slugs.frontend.checkout.index);

	const orderNumberLocator = await checkoutPage.placeOrder();
	const orderNumberText = await orderNumberLocator.innerText();
	const orderNumber = orderNumberText.replace(/\D/g, '');

	await orderHistoryPage.open();
	await orderHistoryPage.verifyOrderPresent(orderNumber);
});
