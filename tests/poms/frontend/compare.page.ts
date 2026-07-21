// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, outcomeMarker, slugs } from '@config';

export class BaseComparePage {
	constructor(public readonly page: Page) { }

	// ==============================================
	// Element getters
	// ==============================================

	// get comparePageTitle: returns title locator for comparison page.
	protected get comparePageTitle(): Locator {
		return this.page.getByRole('heading', { name: UIReference.text.frontend.compare.title });
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

		await expect(this.comparePageTitle, 'Checkpoint: comparison page title is visible').toBeVisible();
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
		let comparisonPageEmptyText = this.page.getByText(UIReference.text.frontend.compare.empty);
		// if the comparison page is empty, we can't remove anything
		if (await comparisonPageEmptyText.isVisible()) {
			return;
		}

		const comparisonPageProductTitle = this.page.getByRole('link', { name: product });
		let removeFromCompareButton = this.page.getByLabel(`${UIReference.text.frontend.compare.removeProduct} ${product}`);
		await removeFromCompareButton.click();
		const messageLocator = this.page.locator(UIReference.selectors.shared.message);
		await messageLocator.waitFor();
		await this.page.getByRole('button', { name: UIReference.text.shared.buttons.closeMessage }).click();
		await expect(messageLocator, `notification toast should be hidden`).toBeHidden();
		await expect(comparisonPageProductTitle, `Link to product is no longer visible`).toBeHidden();
	}

	async addToCart(product: string) {
		const successMessage = this.page.locator(UIReference.selectors.shared.successMessage);
		let productAddedNotification = this.page.getByText(`${outcomeMarker.productPage.simpleProductAddedNotification} ${product}`);

		const productCell = this.page.getByRole('cell', { name: product });
		const addToCartButton = productCell.getByRole('button', { name: UIReference.text.shared.buttons.addToCart });

		await addToCartButton.click();
		await successMessage.waitFor();
		await expect(productAddedNotification).toBeVisible();
	}

	async addToWishList(product: string) {
		const successMessage = this.page.locator(UIReference.selectors.shared.successMessage);
		let addToWishlistButton = this.page.getByLabel(`${UIReference.text.shared.buttons.addToWishlist} ${product}`);
		let productAddedNotification = this.page.getByText(`${product} ${outcomeMarker.wishListPage.wishListAddedNotification}`);

		await addToWishlistButton.click();
		await successMessage.waitFor();
	}
}
