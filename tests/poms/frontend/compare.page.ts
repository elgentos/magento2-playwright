// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, outcomeMarker, slugs } from '@config';
import NotificationValidatorUtils from '@utils/notificationValidator.utils';

export class BaseComparePage {
	constructor(public readonly page: Page) {}

	// ==============================================
	// Element getters
	// ==============================================

	// get comparePageTitle: returns title locator for comparison page.
	protected get comparePageTitle(): Locator {
		return this.page.getByRole('heading', { name: UIReference.text.frontend.compare.title });
	}

	// get compareActionButtons: returns action buttons on comparison page.
	get compareActionButtons() {
		return {
			removeFromCompareButton: (product: string): Locator =>
				this.page.getByLabel(
					`${UIReference.text.frontend.compare.removeProduct} ${product}`,
				),
			addToCartButton: (product: string): Locator =>
				this.page
					.getByRole('cell', { name: product })
					.getByRole('button', { name: UIReference.text.shared.buttons.addToCart }),
			addToWishListButton: (product: string): Locator =>
				this.page.getByLabel(`${UIReference.text.shared.buttons.addToWishlist} ${product}`),
		};
	}

	// ==============================================
	// Navigation methods
	// ==============================================

	/**
	 * Method to navigate to comparison page
	 */
	async goToComparePage() {
		await this.page.goto(slugs.frontend.product.comparison);
		await this.page.waitForLoadState();

		await expect(
			this.comparePageTitle,
			'Checkpoint: comparison page title is visible',
		).toBeVisible();
	}

	// ==============================================
	// Product interaction methods
	// ==============================================

	/**
	 * Method: remove provided product from the comparison list.
	 * @param product {string} - product title that should be removed
	 * @returns {empty} - returns early if comparison page is empty
	 */
	async removeProductFromCompare(product: string) {
		const comparisonPageEmptyText = this.page.getByText(
			UIReference.text.frontend.compare.empty,
		);
		// if the comparison page is empty, we can't remove anything
		if (await comparisonPageEmptyText.isVisible()) {
			return;
		}

		const comparisonPageProductTitle = this.page.getByRole('link', { name: product });

		await this.compareActionButtons.removeFromCompareButton(product).click();
		const notification = await new NotificationValidatorUtils(this.page).validate(
			`${outcomeMarker.comparePage.productRemovedNotificationTextOne} ${product} ${outcomeMarker.comparePage.productRemovedNotificationTextTwo}`
		);
		await notification.getByRole('button', { name: UIReference.text.shared.buttons.closeMessage }).click();

		// Assertions to confirm test ran correctly.
		await expect(notification, `notification toast should be hidden`).toBeHidden();
		await expect(comparisonPageProductTitle, `Link to product is no longer visible`).toBeHidden();
	}

	/**
	 * Method: add product to cart from the comparison page.
	 * Used in test "Add_product_to_cart_from_comparison_page"
	 * @param product {string} - name of the product used in the test.
	 */
	async addToCart(product: string) {
		await this.compareActionButtons.addToCartButton(product).click();
		await new NotificationValidatorUtils(this.page).validate(
			`${outcomeMarker.productPage.simpleProductAddedNotification} ${product} ${outcomeMarker.productPage.productAddedNotificationSuffix}`
		);
	}

	/**
	 * Method: add product to wishlist from comparison page.
	 * Used in the test "Add_product_to_wishlist_from_comparison_page"
	 * @param product {string} - name of the product used in the test.
	 */
	async addToWishList(product: string) {
		await this.compareActionButtons.addToWishListButton(product).click();
		await new NotificationValidatorUtils(this.page).validate(
			`${product} ${outcomeMarker.wishListPage.wishListAddedNotification}`
		);
	}
}
