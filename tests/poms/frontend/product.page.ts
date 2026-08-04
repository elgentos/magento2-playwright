// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, outcomeMarker, slugs } from '@config';
import { slugToRegex } from '@utils/url.utils';


export class BaseProductPage {
	constructor(public readonly page: Page) { }

	// ==============================================
	// Element getters
	// ==============================================

	/**
	 * get productPageTitle method
	 * Returns a function that returns locator for product page title.
	 * Required since the page title depends on the product we're navigating to.
	 * @param product {string} - name of the product
	 */
	protected get productPageTitle() {
		return (product: string) => this.page.getByLabel('Product Info').getByText(product, { exact: true });
	}

	/**
	 * get productInteraction
	 * Returns elements needed to add product to cart, wishlist, or compare
	 */
	get productInteraction() {
		return {
			addToCartButton: this.page.getByRole('button', { name: UIReference.text.shared.buttons.addToCart, exact: true }),
			addToCompareButton: this.page.getByLabel(UIReference.text.frontend.product.addToCompare, { exact: true }),
			addToWishlistButton: this.page.getByLabel(UIReference.text.shared.buttons.addToWishlist, { exact: true }),
			quantityField: this.page.getByRole('spinbutton', { name: UIReference.text.shared.forms.quantity })

		}
	}

	/**
	 * get configurableProductOptions
	 * Returns locator for the product options
	 */
	get configurableProductOptions() {
		const field = this.page.locator(UIReference.selectors.frontend.product.optionForm);
		return {
			options: field.getByRole('radiogroup')
		}
	}

	/**
	 * get reviewFormFields
	 * Returns the elements of the product review form
	 */
	get reviewFormFields() {
		return {
			stars: this.page.getByRole('radio', { name: '5 stars' }),
			nickname: this.page.getByPlaceholder('Nickname*'),
			summary: this.page.getByPlaceholder('Summary*'),
			review: this.page.getByPlaceholder('Review*'),
			submitButton: this.page.getByRole('button', { name: 'Submit Review' }),
			loader: this.page.getByRole('img', { name: 'loader' })
		}
	}

	/**
	 * get reviewsPerPage
	 * Returns locator that determines the amount of reviews shown on the page
	 */
	get reviewsPerPageDropdown() {
		return this.page.locator('#limiter');
	}

	/**
	 * get lightboxElements
	 * Returns the various elements related to the lightbox:
	 * a tool to show the product pictures in a larger box.
	 */
	get lightboxElements() {
		return {
			fullScreenOpener: this.page.getByLabel(UIReference.text.frontend.product.fullScreenOpen),
			fullScreenCloser: this.page.getByLabel(UIReference.text.frontend.product.fullScreenClose),
			thumbnails: this.page.getByRole('button', { name: UIReference.text.frontend.product.thumbnail }).all()
		}
	}

	// ==============================================
	// Navigation methods
	// ==============================================

	/**
	 * method to navigate to a product page.
	 * @param product {string} - name of the product
	 * @param slug {string} - the slug to navigate to
	 */
	async goToProductPage(product: string, slug: string) {
		await this.page.goto(slug);
		await this.page.waitForLoadState();

		await expect(this.productPageTitle(product)).toBeVisible();
	}

	// ==============================================
	// Cart-related methods
	// ==============================================

	/**
	 * Method to add a simple product to the user's/guest's cart.
	 * @param product {string} - name of the product
	 * @param slug {slug} - slug where the product is located
	 * @param quantity {string} - optional: if provided,
	 * the amount of the product to add to the cart.
	 */
	async addSimpleProductToCart(product: string, slug: string, quantity?: string) {
		await this.goToProductPage(product, slug);

		if (quantity) { await this.productInteraction.quantityField.fill(quantity) };
		await this.productInteraction.addToCartButton.click();

		// Final assertion to confirm product has been added to cart
		await expect(this.page.getByRole('alert'),
			`${product} has been added to cart`).toContainText(
				`${outcomeMarker.productPage.simpleProductAddedNotification} ${product}`);
	}

	/**
	 * Method to add a configurable product to the user's/guest's cart.
	 * @param product {string} - name of the product
	 * @param slug {string} - slug where the product is located
	 * @param quantity {string} - optional: if provided,
	 * the amount of the product to add to the cart.
	 */
	async addConfigurableProductToCart(product: string, url: string, quantity?: string) {
		await this.page.goto(url);
		await expect(this.productPageTitle(product), `Checkpoint: title is visible`).toBeVisible();

		let productAddedNotification = `${outcomeMarker.productPage.simpleProductAddedNotification} ${product}`;
		const productOptions = this.page.locator(UIReference.selectors.frontend.product.optionForm);

		// each product option (size, color) is a fieldset, which maps to the 'group' role
		const productOptionGroups = productOptions.getByRole('group');

		// wait for the color and size selectors are actually visible
		await expect(productOptionGroups.first(), `Checkpoint: first product option is visible`).toBeVisible();
		await expect(productOptionGroups.last(), `Checkpoint: last product option is visible`).toBeVisible();

		// loop through each product option within the form
		for (const option of await productOptionGroups.all()) {
			// option values that do not exist for the current selection stay in the DOM but are disabled
			const optionValue = option.locator(`${UIReference.selectors.frontend.product.optionValue}:enabled`).first();
			await optionValue.check();
			await expect(optionValue, `Checkpoint: product option is selected`).toBeChecked();
		}

		if (quantity) {
			// set quantity
			await this.page.getByLabel(UIReference.text.shared.forms.quantity).fill(quantity);
		}

		await this.productInteraction.addToCartButton.click();
		let successMessage = this.page.locator(UIReference.selectors.shared.successMessage);
		await successMessage.waitFor();
		await expect(this.page.getByText(productAddedNotification)).toBeVisible();
	}

	// ==============================================
	// Product list-related methods
	// ==============================================

	/**
	 * Method to add a product to the comparison list.
	 * Adds product, then confirms product is present in list.
	 * @param product {string} - name of the product
	 * @param slug {string} - slug where the product is located
	 */
	async addProductToCompare(product: string, slug: string) {
		await this.goToProductPage(product, slug);

		await this.productInteraction.addToCompareButton.click();

		// Checkpoint: notification confirms the product was added.
		// Message text is split across nodes (text, link, period), so assert containment.
		await expect(this.page.getByRole('alert'),
			`${product} has been added to comparison`).toContainText(
				`${outcomeMarker.comparePage.productAddedNotificationTextOne} ${product}`);

		await this.page.goto(slugs.frontend.product.comparison);

		// Final assertions: page should load and title should be visible.
		// Additionally, name of the product we added should in the list.
		await expect(this.page.getByRole('heading', { name: UIReference.text.frontend.compare.title }),
			`Checkpoint: comparison page title is visible`).toBeVisible();
		await expect(this.page.getByRole('cell', { name: product }).getByText(product, { exact: true })).toBeVisible();
	}

	/**
	 * NOTE: THE TEST 'ADD_PRODUCT_TO_WISHLIST' IS CURRENTLY SET TO FIXME.
	 * Method to add a product to the wishlist.
	 * @param product {string} - name of the product
	 * @param slug {string} - slug where the product is located
	 */
	async addProductToWishlist(product: string, slug: string) {
		await this.goToProductPage(product, slug);

		await this.productInteraction.addToWishlistButton.click();
		await this.page.waitForURL(slugToRegex(slugs.frontend.wishlist.index));

		// Final assertions: success notification shown to user, product in wishlist.
		await expect(
			this.page.getByText(`${product} ${outcomeMarker.wishListPage.wishListAddedNotification}`),
			`Product has been added to wishlist notification`
		).toBeVisible();

		await expect(
			this.page.locator(UIReference.selectors.frontend.wishlist.itemGrid).getByText(product, { exact: true }),
			`Product name is shown in wishlist item overview`
		).toBeVisible();

	}

	// ==============================================
	// Review-related methods
	// ==============================================

	/**
	 * NOTE: THE TEST 'LEAVE_A_PRODUCT_REVIEW' IS CURRENTLY SET TO FIXME.
	 * Method to leave a review for a product.
	 * @param product {string} - name of the product
	 * @param slug {string} - slug where the product is located
	 */
	async leaveProductReview(product: string, slug: string) {
		await this.goToProductPage(product, slug);

		await this.reviewFormFields.stars.scrollIntoViewIfNeeded();

		await this.reviewFormFields.stars.click();
		await this.reviewFormFields.nickname.fill('John');
		await this.reviewFormFields.summary.fill('Summary of my review');
		await this.reviewFormFields.review.fill('A longer paragraph containing details of my opinions of the product');
		await this.reviewFormFields.submitButton.click();

		await this.reviewFormFields.loader.waitFor({ state: 'hidden' });

		// Final assertion: confirm the message "review submitted for moderation" is visible.
		await expect(this.page.getByText('You submitted your review for moderation')).toBeVisible();
	}

	/**
	 * Method to update the amount of reviews shown on the product page.
	 * @param product {string} - name of the product
	 * @param slug {string} - slug where the product is located
	 */
	async changeReviewCountAndVerify(product: string, slug: string) {
		await this.goToProductPage(product, slug);

		await this.reviewsPerPageDropdown.scrollIntoViewIfNeeded();
		// get the actual number shown on 'Show' dropdown on the page
		let initialReviewAmount = await this.reviewsPerPageDropdown.evaluate(
			(el: HTMLSelectElement) => el.selectedOptions[0].textContent?.trim()
		);

		// Select a new amount of reviews that's different from the current amount.
		let newValue;
		initialReviewAmount == '20' ? newValue = '50' : newValue = '20';
		await this.reviewsPerPageDropdown.selectOption({ label: newValue });
		newValue == '20' ? await this.page.waitForURL(/[?&]limit=20/) : await this.page.waitForURL(/[?&]limit=50/);

		// Retrieve new value shown on page
		await this.reviewsPerPageDropdown.scrollIntoViewIfNeeded();
		let newReviewAmount = await this.reviewsPerPageDropdown.evaluate(
			(el: HTMLSelectElement) => el.selectedOptions[0].textContent?.trim()
		);

		// Final assertions: confirm the reviewAmount on the page is updated
		expect(initialReviewAmount,
			`initial amount of reviews (${initialReviewAmount}) does not equal new amount (${newReviewAmount})`
		).not.toEqual(newReviewAmount);
	}


	// ==============================================
	// Media gallery-related methods
	// ==============================================

	/**
	 * Method to open the lightbox (product picture views) and scroll through images.
	 * Used in the test 'Open_pictures_in_lightbox_and_scroll'.
	 * @param product {string} - name of the product
	 * @param slug {string} - slug where the product is located
	 */
	async openLightboxAndScrollThrough(product: string, slug: string) {
		await this.goToProductPage(product, slug);

		await this.lightboxElements.fullScreenOpener.click();
		await expect(this.lightboxElements.fullScreenCloser).toBeVisible();

		for (const img of await this.lightboxElements.thumbnails) {
			await img.click();
			// wait for transition animation
			await this.page.waitForTimeout(500);
			await expect(img, `CSS class 'border-primary' appended to button`)
				.toHaveClass(new RegExp(outcomeMarker.productPage.borderClassRegex)
				);
		}

		await this.lightboxElements.fullScreenCloser.click();

		// Final assertion: after closing the lightbox, the 'close lightbox' button should be hidden
		await expect(this.lightboxElements.fullScreenCloser, `'close lightbox' button should be hidden`).toBeHidden();
	}

}
