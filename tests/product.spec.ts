// @ts-check

import { test } from '@playwright/test';
import { UIReference, slugs, toggles } from '@config';

import { ProductPage } from '@poms/frontend/product.page';
import { LoginPage } from '@poms/frontend/login.page';
import { requireEnv } from '@utils/env.utils';

test.describe('Product page tests', { tag: '@product', }, () => {
	test('Add_product_to_compare', { tag: '@cold' }, async ({ page }) => {
		test.skip(toggles.compare === false, 'Disabled by test toggle: compare');
		const productPage = new ProductPage(page);
		await productPage.addProductToCompare(UIReference.text.frontend.product.simpleProduct, slugs.frontend.product.simple);
	});

	test('Add_product_to_wishlist', { tag: '@hot' }, async ({ page, browserName }) => {
		test.skip(toggles.wishlist === false, 'Disabled by test toggle: wishlist');
		/**
		 * This test is currently (October 2025) set to be fixed, since it causes regular timeouts.
		 * Various fixes have been tried, unsuccessfully.
		 */
		await test.step('Log in with account', async () => {
			const id = test.info().parallelIndex;
			let user = `playwright+${id}@elgentos.nl`;
			let password = requireEnv(`MAGENTO_EXISTING_ACCOUNT_PASSWORD`);

			const loginPage = new LoginPage(page);
			await loginPage.goToLoginPage();
			await loginPage.login(user, password);
		});

		await test.step('Add product to wishlist', async () => {
			const productPage = new ProductPage(page);
			await productPage.addProductToWishlist(UIReference.text.frontend.product.simpleProduct, slugs.frontend.product.simple);
		});
	});

	/**
	 * Test: a guest leaves a review for a product
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Leave_a_product_review', { tag: '@cold' }, async ({ page }) => {
		test.skip(toggles.reviews === false, 'Disabled by test toggle: reviews');
		const productPage = new ProductPage(page);
		await productPage.leaveProductReview(UIReference.text.frontend.product.simpleProduct, slugs.frontend.product.simple);
	});

	/**
	 * Test: open the pictures of a product page and scroll through them
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Open_pictures_in_lightbox_and_scroll', async ({ page }) => {
		const productPage = new ProductPage(page);
		await productPage.openLightboxAndScrollThrough(UIReference.text.frontend.product.configurableProduct, slugs.frontend.product.configurable);
	});

	/**
	 * Test: change the number of reviews shwon on the product page
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Change_number_of_reviews_shown_on_product_page', async ({ page }) => {
		test.skip(toggles.reviews === false, 'Disabled by test toggle: reviews');
		const productPage = new ProductPage(page);
		await productPage.changeReviewCountAndVerify(UIReference.text.frontend.product.simpleProduct, slugs.frontend.product.simple);
	});
});
