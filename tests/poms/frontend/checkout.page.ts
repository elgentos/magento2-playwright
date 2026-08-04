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
			emailField : this.page.getByLabel(UIReference.text.shared.forms.emailCheckout, { exact: true }),
			firstNameField : this.page.getByRole('textbox', { name: UIReference.text.shared.forms.firstName }),
			lastNameField : this.page.getByRole('textbox', { name: UIReference.text.shared.forms.lastName }),
			streetAddressField : this.page.getByLabel(UIReference.text.shared.forms.streetAddress, { exact: true }),
			zipCodeField : this.page.getByLabel(UIReference.text.shared.forms.zipCode),
			cityField : this.page.getByLabel(UIReference.text.shared.forms.city),
			phoneField : this.page.getByLabel(UIReference.text.shared.forms.phone),
			countrySelector : this.page.getByLabel(UIReference.text.shared.forms.country),
			stateDropDown : this.page.getByLabel(UIReference.text.shared.forms.province),
			regionInputField : this.page.getByRole('textbox', { name: UIReference.text.shared.forms.province })
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
		const orderPlacedNotification = outcomeMarker.checkout.orderPlacedNotification;

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

		// wait for placeOrderbutton to be actionable, then submit the order.
		await expect(this.orderSummaryFields.placeOrderButton).toBeEnabled();
		await this.submitOrder();

		await expect.soft(this.page.getByText(orderPlacedNotification)).toBeVisible();
		const orderNumber = this.page.locator('p').filter({ hasText: outcomeMarker.checkout.orderPlacedNumberText });

		await expect(this.continueShoppingButton, `${outcomeMarker.checkout.orderPlacedNumberText} ${orderNumber}`).toBeVisible();
		return orderNumber;
	}

	/**
	 * Clicks 'Place Order' and waits for the success page.
	 *
	 * Magewire can swallow the click: while it re-renders the summary block the
	 * button node is replaced, no order request is sent and the page never
	 * navigates. That is invisible in the DOM - no error message, button still
	 * enabled - so detect it by the missing navigation, let the cascade settle
	 * and click again.
	 * @param attempts {number} - how many times to submit before giving up.
	 */
	private async submitOrder(attempts: number = 3) {
		const requestWindow = 2000; // a registered click posts well inside this
		const successUrl = slugToRegex(slugs.frontend.checkout.success);

		for (let attempt = 1; attempt <= attempts; attempt++) {
			// Start watching before the click, so a fast post cannot be missed.
			const orderRequest = this.page.waitForRequest(/\/magewire\//, { timeout: requestWindow }).catch(() => null);
			await this.orderSummaryFields.placeOrderButton.click();

			// A click that registered always posts to Magewire. Once it has, the
			// order is on its way: wait it out rather than risk a second order.
			if (await orderRequest || successUrl.test(this.page.url())) {
				await this.page.waitForURL(successUrl);
				return;
			}

			// No post at all - the click was swallowed by a Magewire re-render.
			await this.waitForMagewireRequests();
		}

		throw new Error(`[Checkout] 'Place Order' produced no order request after ${attempts} attempts`);
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

		const cancelCouponButton = this.page.getByRole('button', { name: UIReference.text.frontend.common.cancelCoupon });
		await cancelCouponButton.click();
		await this.waitForMagewireRequests();

		await expect.soft(this.page.getByText(outcomeMarker.checkout.couponRemovedNotification), `Notification should be visible`).toBeVisible();
		await expect(this.page.getByText(outcomeMarker.checkout.checkoutPriceReducedSymbol), `'-$' should not be on the page`).toBeHidden();
		// await expect(this.page.locator('#quote-summary div').
		//   getByText(`Discount`),`The word 'Discount (' should not be on the page anymore`).toBeHidden();

		const checkoutDiscountField = this.page.getByPlaceholder(UIReference.text.frontend.common.discountInput);
		await expect(checkoutDiscountField).toBeEditable();
	}

	// ==============================================
	// Price summary methods
	// ==============================================

	/**
	 * Helper method to retrieve the value from a field
	 * @param element {locator} - the element to retieve the price from
	 * @returns match {float} - a float variable from what was originally text.
	 */
	async getPriceValue(element: Locator): Promise<number> {
		const priceText = await element.innerText();
		// Extract just the price part after the $ symbol
		const match = priceText.match(/\$\s*([\d.]+)/);
		return match ? parseFloat(match[1]) : 0;
	}

	/**
	 * Method to verify the price calculations the checkout has made.
	 * Checks the separate values and performs calculations,
	 * then confoirms the calculated total equals the total shown on page.
	 */
	async verifyPriceCalculations() {
		// Retrieve prices
		const subtotal = await this.getPriceValue(this.orderSummaryFields.subtotalElement);
		const shipping = await this.getPriceValue(this.orderSummaryFields.shippingElement);
		const tax = await this.getPriceValue(this.orderSummaryFields.taxElement);
		const grandTotal = await this.getPriceValue(this.orderSummaryFields.grandTotalElement);

		// Calculate total
		const calculatedTotal = +(subtotal + shipping + tax).toFixed(2);

		// Final assertions: check values are greater than 0.
		// Also check displayed grand total equals calculated total.
		expect(subtotal, `Subtotal (${subtotal}) should be greater than 0`).toBeGreaterThan(0);
		expect(shipping, `Shipping cost (${shipping}) should be greater than 0`).toBeGreaterThan(0);
		expect(grandTotal, `Grand total (${grandTotal}) should equal calculated total (${calculatedTotal})`).toBe(calculatedTotal);
	}


	/**
	 * Method to select a payment method in the checkout
	 * @param method  {string} - the payment method a guest/user can select.
	 */
	async selectPaymentMethod(method: 'check' | 'creditcard' | 'paypal'): Promise<void> {
		// Simplify paymentField variables
		const { paymentMethodOptionCheck, paymentMethodOptionCreditCard, paymentMethodOptionPaypal,
				creditCardNumberField,creditCardExpiryField,creditCardCVVField,creditCardNameField } = this.paymentFields;

		// switch based on the payment method that was used as input.
		switch (method) {
			case 'check':
				await paymentMethodOptionCheck.check();
				break;
			case 'creditcard':
				await paymentMethodOptionCreditCard.check();
				// Fill credit card details
				await creditCardNumberField.fill(inputValues.payment?.creditCard?.number || '4111111111111111');
				await creditCardExpiryField.fill(inputValues.payment?.creditCard?.expiry || '12/25');
				await creditCardCVVField.fill(inputValues.payment?.creditCard?.cvv || '123');
				await creditCardNameField.fill(inputValues.payment?.creditCard?.name || 'Test User');
				break;
			case 'paypal':
				await paymentMethodOptionPaypal.check();
				break;
		}

		await this.waitForMagewireRequests();
	}

	/**
	 * Method to select a shipping method in the checkout
	 * @param method  {string} - the payment method a guest/user can select.
	 */
	async selectShippingMethod(method: 'fixed' | 'table rate'): Promise<void> {
		switch (method) {
			case 'fixed':
				await this.shippingFields.shippingMethodOptionFixed.check();
				break;
			case 'table rate':
				await this.shippingFields.shippingMethodTableRateFixed.check();
				break;
		}

		await this.waitForMagewireRequests();
	}


	/**
	 * Method to fill in the shipping address.
	 * Fills in all fields, then selects a country from a pre made list (3, see input-values.json)
	 * If that country is USA, then the state field is a dropdown.
	 * If it's a different country, then the state field is an input field.
	 */
	async fillShippingAddress() {
		// Simplify the shipping address fields locators
		const { emailField, firstNameField, lastNameField, streetAddressField, zipCodeField, cityField, phoneField,
				countrySelector, regionInputField, stateDropDown} = this.contactInfoFields;

		// Fill required shipping address fields
		await emailField.fill(faker.internet.email());
		await firstNameField.fill(faker.person.firstName());
		await lastNameField.fill(faker.person.lastName());
		await streetAddressField.first().fill(faker.location.streetAddress());
		await zipCodeField.fill(faker.location.zipCode());
		await cityField.fill(faker.location.city().replace(/[^A-Za-z0-9\-' ]/g, ''));
		await phoneField.fill(faker.phone.number({ style: 'national' }));

		// Set up variables that depend on the type of state field
		const country: string = faker.helpers.arrayElement(inputValues.addressCountries);

		// get the currently selected country (default)
		const defaultSelectedCountry = await countrySelector.evaluate(
			(select: HTMLSelectElement) => select.options[select.selectedIndex]?.text
		);

		// If the default country !== the country we're using in this test, select our country of choice.
		if (country !== defaultSelectedCountry) {
			await countrySelector.selectOption({ label: country });
			// Add a 5 second wait to allow the region dropdown/field to update.
			await this.page.waitForTimeout(5000);
		}

		// Select state of region based on the country used in the test
		if (country !== 'United States') {
			await expect(regionInputField, `State input field should be editable`).toBeEditable();
			await regionInputField.fill(faker.location.state());
		} else {
			await expect(regionInputField, `Dropdown should not be visible`).toBeHidden();
			await stateDropDown.selectOption(faker.location.state());
			// Timeout because Alpine uses an @input.debounce to delay the activation of the event
			// Standard debounce is 250ms.
			await this.page.waitForTimeout(1000);
		}

		// Wait for any Magewire updates
		await this.waitForMagewireRequests();
	}
}
