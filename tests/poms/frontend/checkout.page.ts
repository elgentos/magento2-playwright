// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { UIReference, outcomeMarker, slugs, inputValues } from '@config';
import { slugToRegex } from '@utils/url.utils';
import MagewireUtils from '@utils/magewire.utils';

class CheckoutPage extends MagewireUtils {

	readonly shippingMethodOptionFixed: Locator;
	readonly shippingMethodTableRateFixed: Locator;
	readonly paymentMethodOptionCheck: Locator;
	readonly showDiscountFormButton: Locator;
	readonly placeOrderButton: Locator;
	readonly continueShoppingButton: Locator;
	readonly subtotalElement: Locator;
	readonly shippingElement: Locator;
	readonly taxElement: Locator;
	readonly grandTotalElement: Locator;
	readonly paymentMethodOptionCreditCard: Locator;
	readonly paymentMethodOptionPaypal: Locator;
	readonly creditCardNumberField: Locator;
	readonly creditCardExpiryField: Locator;
	readonly creditCardCVVField: Locator;
	readonly creditCardNameField: Locator;
	// Customer name and address
	readonly newAddressButton: Locator;
	readonly firstNameField: Locator;
	readonly lastNameField: Locator;
	readonly streetAddressField: Locator;
	readonly stateDropDown: Locator;
	readonly phoneNumberField: Locator;

	constructor(
			page: Page
	){
		super(page);
		this.shippingMethodOptionFixed = this.page.getByLabel(UIReference.text.frontend.checkout.shippingFixed);
		this.shippingMethodTableRateFixed = this.page.getByLabel(UIReference.text.frontend.checkout.shippingTableRate);
		this.paymentMethodOptionCheck = this.page.getByRole('radio', {name: UIReference.text.frontend.checkout.paymentCheck});
		this.showDiscountFormButton = this.page.getByRole('button', {name: UIReference.text.frontend.common.applyDiscountCode});
		this.placeOrderButton = this.page.getByRole('button', { name: UIReference.text.frontend.checkout.placeOrder });
		this.continueShoppingButton = this.page.getByRole('link', { name: UIReference.text.frontend.checkout.continueShopping });
		// this.subtotalElement = page.getByText('Subtotal $');
		this.subtotalElement = page.getByText(`${UIReference.text.frontend.common.subtotal} ${UIReference.text.frontend.common.priceSymbol}`);
		// this.shippingElement = page.getByText('Shipping & Handling (Flat Rate - Fixed) $');
		this.shippingElement = page.getByText(`${UIReference.text.frontend.checkout.shippingPrice} ${UIReference.text.frontend.common.priceSymbol}`);
		// this.taxElement = page.getByText('Tax $');
		this.taxElement = page.getByText(`${UIReference.text.frontend.checkout.tax} ${UIReference.text.frontend.common.priceSymbol}`);
		// this.grandTotalElement = page.getByText('Grand Total $');
		this.grandTotalElement = page.getByText(`${UIReference.text.frontend.common.grandTotal} ${UIReference.text.frontend.common.priceSymbol}`);
		this.paymentMethodOptionCreditCard = this.page.getByLabel(UIReference.text.frontend.checkout.paymentCreditCard);
		this.paymentMethodOptionPaypal = this.page.getByLabel(UIReference.text.frontend.checkout.paymentPaypal);
		this.creditCardNumberField = this.page.getByLabel(UIReference.text.frontend.checkout.creditCardNumber);
		this.creditCardExpiryField = this.page.getByLabel(UIReference.text.frontend.checkout.creditCardExpiry);
		this.creditCardCVVField = this.page.getByLabel(UIReference.text.frontend.checkout.creditCardCVV);
		this.creditCardNameField = this.page.getByLabel(UIReference.text.frontend.checkout.creditCardName);
		// Customer name and address
		this.newAddressButton = this.page.getByRole('button', { name: 'New Address' });
		this.firstNameField = page.getByRole('textbox', {name: UIReference.text.shared.forms.firstName});
		this.lastNameField = page.getByRole('textbox', {name: UIReference.text.shared.forms.lastName});
		this.streetAddressField = page.getByLabel(UIReference.text.shared.forms.streetAddress, { exact: true });
		this.stateDropDown = page.getByLabel(UIReference.text.shared.forms.province);
		this.phoneNumberField = page.getByLabel(UIReference.text.shared.forms.phone);
	}

	// ==============================================
	// Order-related methods
	// ==============================================

	/**
	 * Function to place order for a test user.
	 * @returns {string} Ordernumber - the order to confirm the test with
	 */
	async placeOrder(){
		let orderPlacedNotification = outcomeMarker.checkout.orderPlacedNotification;

		// If we're not already on the checkout page, go there
		if (!this.page.url().includes(slugs.frontend.checkout.index)) {
			await this.page.goto(slugs.frontend.checkout.index);
		}

		// If shipping method is not selected, select it
		if (!(await this.shippingMethodOptionFixed.isChecked())) {
			await this.shippingMethodOptionFixed.check();
			await this.waitForMagewireRequests();
		}

		await this.paymentMethodOptionCheck.check();
		await this.waitForMagewireRequests();

		await expect(async() => {
			// Ensure the payment method is now checked.
			expect(this.paymentMethodOptionCheck).toBeChecked();
		}).toPass();

		await this.placeOrderButton.click();
		await this.waitForMagewireRequests();

		await this.page.waitForURL(slugToRegex(slugs.frontend.checkout.success));

		await expect.soft(this.page.getByText(orderPlacedNotification)).toBeVisible();
		let orderNumber = await this.page.locator('p').filter({ hasText: outcomeMarker.checkout.orderPlacedNumberText });

		await expect(this.continueShoppingButton, `${outcomeMarker.checkout.orderPlacedNumberText} ${orderNumber}`).toBeVisible();
		return orderNumber;
	}



	// ==============================================
	// Discount-related methods
	// ==============================================

	async applyDiscountCodeCheckout(code: string){
		if(await this.page.getByPlaceholder(UIReference.text.frontend.common.discountInput).isHidden()){
			// discount field is not open.
			await this.showDiscountFormButton.click();
			await this.waitForMagewireRequests();
		}

		if(await this.page.getByText(`-${outcomeMarker.cart.priceReducedSymbols}`).isVisible()){
			// discount is already active.
			let cancelCouponButton = this.page.getByRole('button', { name: UIReference.text.frontend.common.cancelCoupon });
			await cancelCouponButton.click();
			await this.waitForMagewireRequests();
		}

		let applyCouponCheckoutButton = this.page.getByRole('button', { name: UIReference.text.frontend.checkout.applyCoupon });
		let checkoutDiscountField = this.page.getByPlaceholder(UIReference.text.frontend.common.discountInput);

		await checkoutDiscountField.fill(code);
		await applyCouponCheckoutButton.click();
		await this.waitForMagewireRequests();

		await expect.soft(this.page.getByText(`${outcomeMarker.checkout.couponAppliedNotification}`),`Notification that discount code ${code} has been applied`).toBeVisible({timeout: 30000});
		const discountString = `Discount (${code})`;
		// await expect(this.page.getByText(`-${outcomeMarker.checkout.checkoutPriceReducedSymbol}`),`'-$' should be visible on the page`).toBeVisible();

		// Alternate checking method: the button 'Cancel Coupon' should become visible.
		await expect(this.page.getByRole('button', {name: UIReference.text.frontend.common.cancelCoupon})).toBeVisible();

		const discountBox = this.page.getByRole('textbox', {name: UIReference.text.frontend.cart.discountBox});

		await expect(async() => {
			await expect(discountBox, `discount code is filled in`).toHaveValue(code);
		}).toPass();
	}

	async enterWrongCouponCode(code: string){
		if(await this.page.getByPlaceholder(UIReference.text.frontend.common.discountInput).isHidden()){
			// discount field is not open.
			await this.showDiscountFormButton.click();
			await this.waitForMagewireRequests();
		}

		let applyCouponCheckoutButton = this.page.getByRole('button', { name: UIReference.text.frontend.checkout.applyCoupon });
		let checkoutDiscountField = this.page.getByPlaceholder(UIReference.text.frontend.common.discountInput);
		await checkoutDiscountField.fill(code);
		await applyCouponCheckoutButton.click();
		await this.waitForMagewireRequests();

		await expect.soft(this.page.getByText(outcomeMarker.checkout.incorrectDiscountNotification), `Code should not work`).toBeVisible();
		await expect(checkoutDiscountField).toBeEditable();
	}

	async removeDiscountCode(){
		if(await this.page.getByPlaceholder(UIReference.text.frontend.common.discountInput).isHidden()){
			// discount field is not open.
			await this.showDiscountFormButton.click();
			await this.waitForMagewireRequests();
		}

		let cancelCouponButton = this.page.getByRole('button', {name: UIReference.text.frontend.common.cancelCoupon});
		await cancelCouponButton.click();
		await this.waitForMagewireRequests();

		await expect.soft(this.page.getByText(outcomeMarker.checkout.couponRemovedNotification),`Notification should be visible`).toBeVisible();
		await expect(this.page.getByText(outcomeMarker.checkout.checkoutPriceReducedSymbol),`'-$' should not be on the page`).toBeHidden();
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
		switch(method) {
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
		switch(method) {
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
		await this.page.getByLabel(UIReference.text.shared.forms.phone).fill(faker.phone.number({style: 'national'}));

		// Select country (if needed)
		// await this.page.getByLabel('Country').selectOption('US');
		const country : string = faker.helpers.arrayElement(inputValues.addressCountries);
		const countrySelectorField = this.page.getByLabel(UIReference.text.shared.forms.country);
		const stateInputField = this.page.getByRole('textbox', { name: UIReference.text.shared.forms.province });
		const stateSelectorField = stateInputField.filter({ hasText: UIReference.text.shared.forms.provinceFilter });


		// If default selected country == country we want to use for the test,
		// don't re-select it.
		const defaultSelectedCountry = await countrySelectorField.evaluate(
			(select: HTMLSelectElement) => select.options[select.selectedIndex]?.text
		);

		if(country !== defaultSelectedCountry) {
			await countrySelectorField.selectOption({label: country});
			// Add a 5 second wait to allow the region dropdown/field to update.
			await this.page.waitForTimeout(5000);
		}

		const regionDropdown = this.page.getByLabel(UIReference.text.shared.forms.province);
		const regionInputField = this.page.getByRole('textbox', {name: UIReference.text.shared.forms.province});

		// Select state
		if(country !== 'United States') {
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

export default CheckoutPage;
