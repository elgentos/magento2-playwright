// @ts-check

import { type Page, type Locator, expect } from '@playwright/test';
import { outcomeMarker, UIReference } from '@config';
import NotificationValidatorUtils from '@utils/notificationValidator.utils';

export class BaseHomePage {
	constructor(public readonly page: Page) { }

	// ==============================================
	// Element getters
	// ==============================================

	// get comparePageTitle: returns title locator for comparison page.
	protected get homePageTitle(): Locator {
		return this.page.getByRole('heading', { name: UIReference.text.frontend.home.title , level:1});
	}

	// ==============================================
	// Navigation methods
	// ==============================================

	/**
	 * Method to navigate to the home page.
	 */
	async goToHomePage() {
		await this.page.goto('');
		await this.page.waitForLoadState();

		await expect(this.homePageTitle, 'Checkpoint: homepage title is visible').toBeVisible();
	}

	/**
	 * Method to add a product to the cart from the homepage.
	 * Used for the test "Add_product_on_homepage_to_cart"
	 */
	async addHomepageProductToCart() {
		let buyProductButton = this.page.getByRole('button').filter({ hasText: UIReference.text.shared.buttons.addToCart }).first();

		if (await buyProductButton.isVisible()) {
			await buyProductButton.click();
			await new NotificationValidatorUtils(this.page).validate(
				`${outcomeMarker.productPage.simpleProductAddedNotification} ${outcomeMarker.homePage.firstProductName} ${outcomeMarker.productPage.productAddedNotificationSuffix}`
			);
		} else {
			throw new Error(`No 'Add to Cart' button found on homepage`);
		}
	}
}
