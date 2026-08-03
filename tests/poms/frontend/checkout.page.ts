// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { UIReference, outcomeMarker, slugs, inputValues } from '@config';
import { slugToRegex } from '@utils/url.utils';
import MagewireUtils from '@utils/magewire.utils';


export class BaseCheckoutPage extends MagewireUtils {
	constructor(public readonly page: Page) { super(page) };

	// ==============================================
	// Element getters
	// ==============================================


	/**
	 * get contactInfoFields
	 * Returns the form fields associated with the
	 * 'contact information' section of the checkout.
	 */
	get contactInfoFields() {
		return {
			newAddressButton : this.page.getByRole('button', { name: 'New Address' }),
			firstNameField : this.page.getByRole('textbox', { name: UIReference.text.shared.forms.firstName }),
			lastNameField : this.page.getByRole('textbox', { name: UIReference.text.shared.forms.lastName }),
			streetAddressField : this.page.getByLabel(UIReference.text.shared.forms.streetAddress, { exact: true }),
			stateDropDown : this.page.getByLabel(UIReference.text.shared.forms.province),
			phoneNumberField : this.page.getByLabel(UIReference.text.shared.forms.phone),
		}
	}

	/**
	 * get shippingFields
	 * Returns the elements from the shipping section of the checkout.
	 */
	get shippingFields() {
		return {
			shippingMethodOptionFixed : this.page.getByLabel(UIReference.text.frontend.checkout.shippingFixed),
			shippingMethodTableRateFixed : this.page.getByLabel(UIReference.text.frontend.checkout.shippingTableRate),
		}
	}

	/**
	 * get paymentFields
	 * Returns the elements from the payment section of the checkout.
	 */
	get paymentFields() {
		return {
			paymentMethodOptionCheck : this.page.getByRole('radio', { name: UIReference.text.frontend.checkout.paymentCheck }),
			paymentMethodOptionCreditCard : this.page.getByLabel(UIReference.text.frontend.checkout.paymentCreditCard),
			paymentMethodOptionPaypal : this.page.getByLabel(UIReference.text.frontend.checkout.paymentPaypal),
			creditCardNumberField : this.page.getByLabel(UIReference.text.frontend.checkout.creditCardNumber),
			creditCardExpiryField : this.page.getByLabel(UIReference.text.frontend.checkout.creditCardExpiry),
			creditCardCVVField : this.page.getByLabel(UIReference.text.frontend.checkout.creditCardCVV),
			creditCardNameField : this.page.getByLabel(UIReference.text.frontend.checkout.creditCardName),
		}
	}

	/**
	 * get orderSummaryFields
	 * Returns the elements from the summary section of the checkout.
	 */
	get orderSummaryFields() {
		return {
			subtotalElement : this.page.getByText(`${UIReference.text.frontend.common.subtotal} ${UIReference.text.frontend.common.priceSymbol}`),
			shippingElement : this.page.getByText(`${UIReference.text.frontend.checkout.shippingPrice} ${UIReference.text.frontend.common.priceSymbol}`),
			taxElement : this.page.getByText(`${UIReference.text.frontend.checkout.tax} ${UIReference.text.frontend.common.priceSymbol}`),
			grandTotalElement : this.page.getByText(`${UIReference.text.frontend.common.grandTotal} ${UIReference.text.frontend.common.priceSymbol}`),
			placeOrderButton : this.page.getByRole('button', { name: UIReference.text.frontend.checkout.placeOrder }),
		}
	}

	/**
	 * get discountFormFields
	 * Returns locators from the discount form in the checkout
	 */
	get discountFormFields() {
		return {
			openFormButton : this.page.getByRole('button', { name: UIReference.text.frontend.common.applyDiscountCode }),
			codeInputField : this.page.getByPlaceholder(UIReference.text.frontend.common.discountInput),
			applyCodeButton : this.page.getByRole('button', { name: UIReference.text.frontend.checkout.applyCoupon }),
			discountBox : this.page.getByRole('textbox', { name: UIReference.text.frontend.cart.discountBox }),
			cancelCouponButton: this.page.getByRole('button', { name: UIReference.text.frontend.common.cancelCoupon })
		}
	}

	/**
	 * get continueShoppingButton
	 * Returns locator for the link element to continue shopping.
	 * This is visible after an order has been placed.
	 */
	get continueShoppingButton() {
		return this.page.getByRole('link', { name: UIReference.text.frontend.checkout.continueShopping });
	}


	// ==============================================
	// Order-related methods
	// ==============================================

	/**
	 * Function to place order for a test user.
	 * @returns {string} Ordernumber - the order to confirm the test with
	 */
	async placeOrder() {
		let orderPlacedNotification = outcomeMarker.checkout.orderPlacedNotification;

		// If we're not already on the checkout page, go there
		if (!this.page.url().includes(slugs.frontend.checkout.index)) {
			await this.page.goto(slugs.frontend.checkout.index);
			await expect(this.orderSummaryFields.placeOrderButton).toBeVisible();
		}

		// If shipping method is not selected, select it
		if (!(await this.shippingFields.shippingMethodOptionFixed.isChecked())) {
			await this.shippingFields.shippingMethodOptionFixed.check();
			await this.waitForMagewireRequests();
		}

		await this.paymentFields.paymentMethodOptionCheck.check();
		await this.waitForMagewireRequests();

		await expect(this.paymentFields.paymentMethodOptionCheck, 'payment method is selected').toBeChecked();

		// wait for placeOrderbutton to be actionable, tie the click to the resulting navigation.
		await expect(this.orderSummaryFields.placeOrderButton).toBeEnabled();
		await Promise.all([
			this.page.waitForURL(slugToRegex(slugs.frontend.checkout.success)),
			this.orderSummaryFields.placeOrderButton.click(),
		]);
		await this.waitForMagewireRequests();


		await expect.soft(this.page.getByText(orderPlacedNotification)).toBeVisible();
		let orderNumber = this.page.locator('p').filter({ hasText: outcomeMarker.checkout.orderPlacedNumberText });

		await expect(this.continueShoppingButton, `${outcomeMarker.checkout.orderPlacedNumberText} ${orderNumber}`).toBeVisible();
		return orderNumber;
	}



	// ==============================================
	// Discount-related methods
	// ==============================================

	/**
	 * Method to apply a discount code in the checkout
	 * @param code {string} - the discount code to use
	 */
	async applyDiscountCodeCheckout(code: string) {
		// Shorten discount form elements
		const { openFormButton, codeInputField, applyCodeButton, discountBox, cancelCouponButton } = this.discountFormFields;

		// Ensure the discount code form is visible.
		if (await codeInputField.isHidden()) {
			await openFormButton.click();
			await this.waitForMagewireRequests();
		}

		// If a coupon code has been applied already, remove.
		if (await this.page.getByText(`-${outcomeMarker.cart.priceReducedSymbols}`).isVisible()) {
			// discount is already active.
			await cancelCouponButton.click();
			await this.waitForMagewireRequests();
		}

		// fill in discount code form
		await codeInputField.fill(code);
		await applyCodeButton.click();
		await this.waitForMagewireRequests();

		// Final assertions: notification visible, 'cancel coupon' button is visible, discountfield has code filled in.
		await expect.soft(this.page.getByText(`${outcomeMarker.checkout.couponAppliedNotification}`), `Notification that discount code ${code} has been applied`).toBeVisible({ timeout: 30000 });
		await expect(cancelCouponButton, `cancel coupon button is visible`).toBeVisible();
		await expect(async () => {
			await expect(discountBox, `discount code is filled in`).toHaveValue(code);
		}).toPass();
	}

	/**
	 * Method to fill in an incorrect discount code to confirm that does not work
	 * Used in the test 'Invalid_coupon_code_in_checkout_is_rejected'.
	 * @param code {string} - incorrect code to use.
	 */
	async enterWrongCouponCode(code: string) {
		// Shorten discount form elements
		const { openFormButton, codeInputField, applyCodeButton } = this.discountFormFields;

		// Ensure the discount code form is visible.
		if (await codeInputField.isHidden()) {
			await openFormButton.click();
			await this.waitForMagewireRequests();
		}

		// fill in the incorrect code
		await codeInputField.fill(code);
		await applyCodeButton.click();
		await this.waitForMagewireRequests();

		// Final assertions: notification that code is incorrect shows up, the input field is still editable.
		await expect.soft(this.page.getByText(outcomeMarker.checkout.incorrectDiscountNotification), `Code should not work`).toBeVisible();
		await expect(codeInputField).toBeEditable();
	}

	/**
	 * Method to remove discount code in checkout.
	 * Used in the test Remove_coupon_code_from_checkout
	 */
	async removeDiscountCode() {
		// Shorten discount form elements
		const { openFormButton, codeInputField, applyCodeButton } = this.discountFormFields;

		// Ensure the discount code form is visible.
		if (await codeInputField.isHidden()) {
			await openFormButton.click();
			await this.waitForMagewireRequests();
		}

		let cancelCouponButton = this.page.getByRole('button', { name: UIReference.text.frontend.common.cancelCoupon });
		await cancelCouponButton.click();
		await this.waitForMagewireRequests();

		await expect.soft(this.page.getByText(outcomeMarker.checkout.couponRemovedNotification), `Notification should be visible`).toBeVisible();
		await expect(this.page.getByText(outcomeMarker.checkout.checkoutPriceReducedSymbol), `'-$' should not be on the page`).toBeHidden();
		// await expect(this.page.locator('#quote-summary div').
		//   getByText(`Discount`),`The word 'Discount (' should not be on the page anymore`).toBeHidden();

		let checkoutDiscountField = this.page.getByPlaceholder(UIReference.text.frontend.common.discountInput);
		await expect(checkoutDiscountField).toBeEditable();
	}

	// ==============================================
	// Price summary methods
	// ==============================================

	async getPriceValue(element: Locator): Promise<number> {
		const priceText = await element.innerText();
		// Extract just the price part after the $ symbol
		const match = priceText.match(/\$\s*([\d.]+)/);
		return match ? parseFloat(match[1]) : 0;
	}

	async verifyPriceCalculations() {
		const subtotal = await this.getPriceValue(this.subtotalElement);
		const shipping = await this.getPriceValue(this.shippingElement);
		const tax = await this.getPriceValue(this.taxElement);
		const grandTotal = await this.getPriceValue(this.grandTotalElement);

		const calculatedTotal = +(subtotal + shipping + tax).toFixed(2);

		expect(subtotal, `Subtotal (${subtotal}) should be greater than 0`).toBeGreaterThan(0);
		expect(shipping, `Shipping cost (${shipping}) should be greater than 0`).toBeGreaterThan(0);
		// Enable when tax settings are set.
		//expect(tax, `Tax (${tax}) should be greater than 0`).toBeGreaterThan(0);
		expect(grandTotal, `Grand total (${grandTotal}) should equal calculated total (${calculatedTotal})`).toBe(calculatedTotal);
	}

	async selectPaymentMethod(method: 'check' | 'creditcard' | 'paypal'): Promise<void> {
		switch (method) {
			case 'check':
				await this.paymentMethodOptionCheck.check();
				break;
			case 'creditcard':
				await this.paymentMethodOptionCreditCard.check();
				// Fill credit card details
				await this.creditCardNumberField.fill(inputValues.payment?.creditCard?.number || '4111111111111111');
				await this.creditCardExpiryField.fill(inputValues.payment?.creditCard?.expiry || '12/25');
				await this.creditCardCVVField.fill(inputValues.payment?.creditCard?.cvv || '123');
				await this.creditCardNameField.fill(inputValues.payment?.creditCard?.name || 'Test User');
				break;
			case 'paypal':
				await this.paymentMethodOptionPaypal.check();
				break;
		}

		await this.waitForMagewireRequests();
	}

	async selectShippingMethod(method: 'fixed' | 'table rate'): Promise<void> {
		switch (method) {
			case 'fixed':
				await this.shippingMethodOptionFixed.check();
				break;
			case 'table rate':
				await this.shippingMethodTableRateFixed.check();
				break;
		}

		await this.waitForMagewireRequests();
	}

	async fillShippingAddress() {
		// Fill required shipping address fields
		await this.page.getByLabel(UIReference.text.shared.forms.emailCheckout, { exact: true }).fill(faker.internet.email());
		await this.page.getByLabel(UIReference.text.shared.forms.firstName).fill(faker.person.firstName());
		await this.page.getByLabel(UIReference.text.shared.forms.lastName).fill(faker.person.lastName());
		await this.page.getByLabel(UIReference.text.shared.forms.streetAddress).first().fill(faker.location.streetAddress());
		await this.page.getByLabel(UIReference.text.shared.forms.zipCode).fill(faker.location.zipCode());
		await this.page.getByLabel(UIReference.text.shared.forms.city).fill(faker.location.city().replace(/[^A-Za-z0-9\-' ]/g, ''));
		await this.page.getByLabel(UIReference.text.shared.forms.phone).fill(faker.phone.number({ style: 'national' }));

		// Select country (if needed)
		// await this.page.getByLabel('Country').selectOption('US');
		const country: string = faker.helpers.arrayElement(inputValues.addressCountries);
		const countrySelectorField = this.page.getByLabel(UIReference.text.shared.forms.country);
		const stateInputField = this.page.getByRole('textbox', { name: UIReference.text.shared.forms.province });
		const stateSelectorField = stateInputField.filter({ hasText: UIReference.text.shared.forms.provinceFilter });


		// If default selected country == country we want to use for the test,
		// don't re-select it.
		const defaultSelectedCountry = await countrySelectorField.evaluate(
			(select: HTMLSelectElement) => select.options[select.selectedIndex]?.text
		);

		if (country !== defaultSelectedCountry) {
			await countrySelectorField.selectOption({ label: country });
			// Add a 5 second wait to allow the region dropdown/field to update.
			await this.page.waitForTimeout(5000);
		}

		const regionDropdown = this.page.getByLabel(UIReference.text.shared.forms.province);
		const regionInputField = this.page.getByRole('textbox', { name: UIReference.text.shared.forms.province });

		// Select state
		if (country !== 'United States') {
			// await expect(regionDropdown, `Dropdown should not be visible`).toBeHidden();
			await expect(regionInputField, `State input field should be editable`).toBeEditable();
			await regionInputField.fill(faker.location.state());
		} else {
			await expect(regionInputField, `Dropdown should not be visible`).toBeHidden();
			// await expect(regionDropdown, `State input field should be editable`).toBeEditable();
			await regionDropdown.selectOption(faker.location.state());
			// Timeout because Alpine uses an @input.debounce to delay the activation of the event
			// Standard debounce is 250ms.
			await this.page.waitForTimeout(1000);
		}

		// Wait for any Magewire updates
		await this.waitForMagewireRequests();
	}
}
