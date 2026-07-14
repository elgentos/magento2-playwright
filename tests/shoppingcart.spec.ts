// @ts-check

/**
 * Copyright Elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileoverview Various tests to ensure shopping-cart functions remain working.
 */

import { test, expect } from '@playwright/test';

import CartPage from '@poms/frontend/shoppingcart.page';
import LoginPage from '@poms/frontend/login.page';
import ProductPage from '@poms/frontend/product.page';

import { requireEnv, getCouponCode } from '@utils/env.utils';
import NotificationValidatorUtils from '@utils/notificationValidator.utils';
import { UIReference, slugs, outcomeMarker, inputValues } from '@config';

/**
 * Test Group: Cart functionalities for guests
 */
test.describe('Cart functionalities (guest)', () => {
	/**
	 * Before each test: add a product to the cart, navigate to the cart.
	 * @param page - Playwright page instance used to interact with the website.
	 * @param testInfo -  Playwright class that allows interaction with the report.
	 */
	test.beforeEach(async ({ page }, testInfo) => {
		const productPage = new ProductPage(page);
		await productPage.addSimpleProductToCart(UIReference.text.frontend.product.simpleProduct, slugs.frontend.product.simple);

		const productAddedNotification = `${outcomeMarker.productPage.simpleProductAddedNotification} ${UIReference.text.frontend.product.simpleProduct}`;
		const notificationValidator = new NotificationValidatorUtils(page, testInfo);
		await notificationValidator.validate(productAddedNotification);

		await page.goto(slugs.frontend.cart.index);
	});

	/**
	 * Test: A guest adds a product to their cart
	 * @assume we have already added a product to the cart.
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Add_product_to_cart',{ tag: ['@cart', '@cold'],}, async ({page}) => {
		await expect(page.getByRole('heading')
			.getByRole('link', {name: UIReference.text.frontend.product.simpleProduct}), `Product is visible in cart`).toBeVisible();
	});

	/**
	 * Test: a guest's cart remains after they log in.
	 * @assume we have already added a product to the cart.
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Product_remains_in_cart_after_login',{ tag: ['@cart', '@account', '@hot']}, async ({page}) => {
		await test.step('Add another product to cart', async () =>{
			const productpage = new ProductPage(page);
			await page.goto(slugs.frontend.product.secondSimple);
			await productpage.addSimpleProductToCart(UIReference.text.frontend.product.secondSimpleProduct, slugs.frontend.product.secondSimple);
		});

		await test.step('Log in with account', async () =>{
			const loginPage = new LoginPage(page);

			const parallelIndex = test.info().parallelIndex;
			const email = `playwright+${parallelIndex}@elgentos.nl`;
			const password = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');

			await loginPage.login(email, password);
		});

		await page.goto(slugs.frontend.cart.index);

		await expect(page.getByRole('heading').getByRole('link', { name: UIReference.text.frontend.product.simpleProduct }),
			`${UIReference.text.frontend.product.simpleProduct} should still be in cart`).toBeVisible();
		await expect(page.getByRole('heading').getByRole('link', { name: UIReference.text.frontend.product.secondSimpleProduct }),
			`${UIReference.text.frontend.product.secondSimpleProduct} should still be in cart`).toBeVisible();
	});

	/**
	 * Test: Remove the product that was added to the cart in beforeEach().
	 * @assume there's already a product in the cart.
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Remove_product_from_cart',{ tag: ['@cart','@cold'],}, async ({page}) => {
		const cart = new CartPage(page);
		await cart.removeProduct(UIReference.text.frontend.product.simpleProduct);
	});

	/**
	 * Test: A guest changes the quantity of a product in their cart
	 * @assume there's already a product in the cart.
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Change_product_quantity_in_cart',{ tag: ['@cart', '@cold'],}, async ({page}) => {
		const cart = new CartPage(page);
		await cart.changeProductQuantity('2');
	});

	/**
	 * Test: A guest adds a coupon code in the cart.
	 * @param page - Playwright page instance used to interact with the website.
	 * @param browserName - Name of browser running tests. Used to retrieve coupon code.
	 */
	test('Add_coupon_code_in_cart',{ tag: ['@cart', '@coupon-code', '@cold']}, async ({page, browserName}) => {
		const cart = new CartPage(page);
		const discountCode = getCouponCode(browserName);

		await cart.applyDiscountCode(discountCode);
	});

	/**
	 * Test: A guest removes a coupon code from their cart.
	 * @param page - Playwright page instance used to interact with the website.
	 * @param browserName - Name of browser running tests. Used to retrieve coupon code.
	 */
	test('Remove_coupon_code_from_cart',{ tag: ['@cart', '@coupon-code', '@cold'] }, async ({page, browserName}) => {
		const cart = new CartPage(page);
		const discountCode = getCouponCode(browserName);

		await cart.applyDiscountCode(discountCode);
		await cart.removeDiscountCode();
	});

	/**
	 * Test: If a guest uses an invalid coupon code, it should not work.
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Invalid_coupon_code_is_rejected',{ tag: ['@cart', '@coupon-code', '@cold'] }, async ({page}) => {
		const cart = new CartPage(page);
		await cart.enterWrongCouponCode("Incorrect Coupon Code");
	});
});

/**
 * Test Group: Tests that check prices are consistent and correct.
 */
test.describe('Price checking tests', () => {
	/**
	 * Test: the data of a simple product in cart is consistent through the checkout
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Simple_product_cart_data_consistent_from_PDP_to_checkout',{ tag: ['@cart-price-check', '@cold']}, async ({page}) => {
		let productPagePrice: string;
		let productPageAmount: string;
		let checkoutProductDetails: string[];

		const cart = new CartPage(page);

		await test.step('Step: Add simple product to cart', async () =>{
			const productPage = new ProductPage(page);
			await page.goto(slugs.frontend.product.simple);
			// set quantity to 2 so we can see that the math works
			await page.getByLabel(UIReference.text.shared.forms.quantity).fill('2');

			productPagePrice = await page.locator(UIReference.selectors.frontend.product.price).innerText();
			productPageAmount = await page.getByLabel(UIReference.text.shared.forms.quantity).inputValue();
			await productPage.addSimpleProductToCart(UIReference.text.frontend.product.simpleProduct, slugs.frontend.product.simple, '2');
		});

		await test.step('Step: go to checkout, get values', async () =>{
			await page.goto(slugs.frontend.checkout.index);
			await page.waitForLoadState();

			// returns productPriceInCheckout and productQuantityInCheckout
			checkoutProductDetails = await cart.getCheckoutValues(UIReference.text.frontend.product.simpleProduct, productPagePrice, productPageAmount);
		});

		await test.step('Step: Calculate and check expectations', async () =>{
			await cart.calculateProductPricesAndCompare(productPagePrice, productPageAmount, checkoutProductDetails[0], checkoutProductDetails[1]);
		});
	});

	/**
	 * Test: the data of a configurable product in cart is consistent through the checkout
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Configurable_product_cart_data_consistent_from_PDP_to_checkout',{ tag: ['@cart-price-check', '@cold']}, async ({page}) => {
		var productPagePrice: string;
		var productPageAmount: string;
		var checkoutProductDetails: string[];

		const cart = new CartPage(page);

		await test.step('Step: Add configurable product to cart', async () =>{
			const productPage = new ProductPage(page);
			// Navigate to the configurable product page so we can retrieve price and amount before adding it to cart
			await page.goto(slugs.frontend.product.configurable);
			// set quantity to 2 so we can see that the math works
			await page.getByLabel('Quantity').fill('2');

			productPagePrice = await page.locator(UIReference.selectors.frontend.product.price).innerText();
			productPageAmount = await page.getByLabel(UIReference.text.shared.forms.quantity).inputValue();

			await productPage.addConfigurableProductToCart(
				UIReference.text.frontend.product.configurableProduct, slugs.frontend.product.configurable, '2'
			);
		});

		await test.step('Step: go to checkout, get values', async () =>{
			await page.goto(slugs.frontend.checkout.index);
			await page.waitForLoadState();

			// returns productPriceInCheckout and productQuantityInCheckout
			checkoutProductDetails = await cart.getCheckoutValues(
				UIReference.text.frontend.product.configurableProduct, productPagePrice, productPageAmount
			);
		});

		await test.step('Step: Calculate and check expectations', async () =>{
			await cart.calculateProductPricesAndCompare(
				productPagePrice, productPageAmount, checkoutProductDetails[0], checkoutProductDetails[1]
			);
		});
	});
});
