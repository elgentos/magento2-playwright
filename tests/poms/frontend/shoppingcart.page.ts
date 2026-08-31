// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, outcomeMarker } from '@config';
import NotificationValidatorUtils from '@utils/notificationValidator.utils';

export class BaseCartPage {
	constructor(public readonly page: Page) { };


	// ==============================================
	// Element getters
	// ==============================================

	/**
	 * get cartInteraction
	 * Returns locators for cart interaction elements:
	 * updateCartButton, showDiscountButton
	 */
	get cartInteraction() {
		return {
			openDiscountForm : this.page.locator('summary').filter({ hasText: UIReference.text.frontend.common.applyDiscountCode }),
			updateCartButton : this.page.getByRole('button', { name: UIReference.text.frontend.cart.updateCart })
		}
	}

	/**
	 * get discountFormFields
	 * Returns locators from the discount form in the checkout
	 */
	get discountFormFields() {
		return {
			applyDiscountButton : this.page.getByRole('button', { name: UIReference.text.frontend.cart.applyDiscount, exact: true }),
			cancelDiscountButton : this.page.getByRole('button', { name: UIReference.text.frontend.common.cancelCoupon }),
			codeInputField : this.page.getByPlaceholder(UIReference.text.frontend.common.discountInput)
		}
	}


	// ==============================================
	// Product-related methods
	// ==============================================

	/**
	 * method to change the quantity of a product in the cart
	 * @param amount {string} - amount to update to.
	 */
	async changeProductQuantity(amount: string) {
		// Define the row the product is in to retrieve values from.
		const productRow = this.page.getByRole('listitem').filter({ hasText: UIReference.text.frontend.product.simpleProduct });

		// If the amount to update to is the same as the current amount in cart, update the amount to change to.
		let currentQuantity = await productRow.getByRole('spinbutton', { name: UIReference.text.frontend.common.quantityAbbr }).inputValue();
		if (currentQuantity == amount) { amount = '3'; }

		let subTotalBeforeUpdate = await productRow.getByText(UIReference.text.frontend.common.priceSymbol).last().innerText();

		await productRow.getByLabel(UIReference.text.frontend.common.quantityAbbr).fill(amount);
		await this.cartInteraction.updateCartButton.click();

		// Checkpoint: wait until the subtotal changed
		await expect(async () => {
			let subTotalAfterUpdate = await productRow.getByText(UIReference.text.frontend.common.priceSymbol).last().innerText();
			expect(subTotalBeforeUpdate, `Checkpoint: listed subtotal should change`).not.toEqual(subTotalAfterUpdate);
		}).toPass();

		let updatedQuantity = await productRow.getByLabel(UIReference.text.frontend.common.quantityAbbr).inputValue();

		// Final assertion: the quantity of the product in the cart has updated.
		expect(updatedQuantity, `updated quantity (${updatedQuantity}) should equal amount we've requested (${amount})`).toEqual(amount);
	}

	/**
	 * Method to remove a product from the cart
	 * @param productTitle {string} - name of the product to remove
	 */
	async removeProduct(productTitle: string) {
		// Define the delete button here because it depends on the name of the product.
		let removeButton = this.page.getByLabel(`${UIReference.text.shared.buttons.remove} ${productTitle}`);
		await removeButton.click();
		await this.page.waitForLoadState();

		// Assertions: product has been removed.
		await expect(removeButton, `Button to remove specified product is not visible in the cart`).toBeHidden();
		await expect(this.page.getByRole('cell', { name: productTitle }), `Product is not visible in cart`).toBeHidden();
	}


	// ==============================================
	// Discount-related methods
	// ==============================================

	/**
	 * Method to apply a discount code in the shopping cart.
	 * @param code {string} - discount code to apply
	 */
	async applyDiscountCode(code: string) {
		// Ensure the discount form field is available
		if (await this.discountFormFields.codeInputField.isHidden()) {
			await this.cartInteraction.openDiscountForm.click();
		}

		await this.discountFormFields.codeInputField.fill(code);
		await this.discountFormFields.applyDiscountButton.click();
		await this.page.waitForLoadState();

		// Final assertions: check for notification, and the presence of a discount amount
		const notification = await new NotificationValidatorUtils(this.page).validate(
			`${outcomeMarker.cart.discountAppliedNotification} "${code}"`
		);
		// WORKAROUND: hardcoded '-' symbol because the space between - and $ is not always present.
		await expect(this.page.getByText(`- ${outcomeMarker.cart.priceReducedSymbols}`), `'- $' should be visible on the page`).toBeVisible();
		// Close message to prevent difficulties with other tests.
		await notification.getByLabel(UIReference.text.shared.buttons.closeMessage).click();
	}

	/**
	 * Method to remove the discount code that has been applied in the cart.
	 */
	async removeDiscountCode() {
		// Ensure the discount form field is available
		if (await this.discountFormFields.codeInputField.isHidden()) {
			await this.cartInteraction.openDiscountForm.click();
		}

		await this.discountFormFields.cancelDiscountButton.click()
		await this.page.waitForLoadState();

		// Final assertions: check for notification and confirm the discount text is no longer visible.
		await new NotificationValidatorUtils(this.page).validate(outcomeMarker.cart.discountRemovedNotification);
		await expect(this.page.getByText(`-${outcomeMarker.cart.priceReducedSymbols}`), `'- $' should not be on the page`).toBeHidden();
	}

	/**
	 * Method to enter an incorrect coupon code
	 * @param code {String} - incorrect code to use
	 */
	async enterWrongCouponCode(code: string) {
		// Ensure the discount form field is available
		if (await this.discountFormFields.codeInputField.isHidden()) {
			await this.cartInteraction.openDiscountForm.click();
		}

		await this.discountFormFields.codeInputField.fill(code);
		await this.discountFormFields.applyDiscountButton.click();
		await this.page.waitForLoadState();


		let incorrectNotification = `${outcomeMarker.cart.incorrectCouponCodeNotificationOne} "${code}" ${outcomeMarker.cart.incorrectCouponCodeNotificationTwo}`;

		// Final assertions: notification that code was incorrect & discount code field is still editable
		await new NotificationValidatorUtils(this.page).validate(incorrectNotification);
		await expect(this.discountFormFields.codeInputField).toBeEditable();
	}


	// ==============================================
	// Additional methods
	// ==============================================

	/**
	 * Method to retrieve the product quantity and price in the checkout.
	 * Used in the tests 'Simple_product_cart_data_consistent_from_PDP_to_checkout'
	 * and 'Configurable_product_cart_data_consistent_from_PDP_to_checkout'
	 * @param productName {string} - name of the product to retrieve values for.
	 */
	async getCheckoutValues(productName: string) {
		// Ensure the cart details are visible in the checkout
		const checkoutCartDetails = this.page.locator(UIReference.selectors.frontend.checkout.cartDetailsContainer);
		const openCartDetailsButton = this.page.locator(UIReference.selectors.frontend.checkout.openCartDetails);

		if (await checkoutCartDetails.isHidden()) {
			await openCartDetailsButton.click();
		}

		// Get product details section in checkout and retrieve values
		let productInCheckout = this.page.locator(UIReference.selectors.frontend.checkout.cartDetails).filter({ hasText: productName }).nth(1);
		let productPriceInCheckout = (await productInCheckout.getByText(UIReference.text.frontend.common.priceSymbol).last().innerText()).trim();
		let productQuantityInCheckout = (await productInCheckout.locator('.product-price').getByText('x').innerText()).substring(0, 1);

		// Return price and quantity values
		return [productPriceInCheckout, productQuantityInCheckout];
	}

	/**
	 * Method to calculate price in the cart and checkout to confirm they're the same.
	 * Uses quantity and price from both cart and checkout.
	 * @param pricePDP {string} - price of product on product page
	 * @param amountPDP {string} - amount of product on product page
	 * @param priceCheckout {string} - price of product in the checkout
	 * @param amountCheckout {string} - amount of product in the checkout
	 */
	async calculateProductPricesAndCompare(pricePDP: string, amountPDP: string, priceCheckout: string, amountCheckout: string) {
		// perform magic to calculate price * amount and mold it into the correct form again
		pricePDP = pricePDP.replace(UIReference.text.frontend.common.priceSymbol, '');
		let pricePDPInt = Number(pricePDP);
		let quantityPDPInt = parseInt(amountPDP);
		let calculatedPricePDP = `${UIReference.text.frontend.common.priceSymbol}` + (pricePDPInt * quantityPDPInt).toFixed(2);

		// Final assertions: confirm the quantities are the same in cart and checkout,
		// then confirm the price listed in the checkout equals our calculcated price.
		expect(amountPDP, `Amount on PDP (${amountPDP}) equals amount in checkout (${amountCheckout})`).toEqual(amountCheckout);
		expect(calculatedPricePDP, `Price * qty on PDP (${calculatedPricePDP}) equals price * qty in checkout (${priceCheckout})`).toEqual(priceCheckout);
	}
}
