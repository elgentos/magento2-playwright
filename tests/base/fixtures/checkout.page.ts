import {expect, type Locator, type Page} from '@playwright/test';
import {faker} from '@faker-js/faker';
import BasePage from './base.page';

import UIReference from '../config/element-identifiers/element-identifiers.json';
import outcomeMarker from '../config/outcome-markers/outcome-markers.json';
import slugs from '../config/slugs.json';
import inputvalues from '../config/input-values/input-values.json';

class CheckoutPage extends BasePage {

  readonly shippingMethodOptionFixed: Locator;
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

  constructor(page: Page){
    super(page);
    this.shippingMethodOptionFixed = this.page.getByLabel(UIReference.checkout.shippingMethodFixedLabel);
    this.paymentMethodOptionCheck = this.page.getByLabel(UIReference.checkout.paymentOptionCheckLabel);
    this.showDiscountFormButton = this.page.getByRole('button', {name: UIReference.checkout.openDiscountFormLabel});
    this.placeOrderButton = this.page.getByRole('button', { name: UIReference.checkout.placeOrderButtonLabel });
    this.continueShoppingButton = this.page.getByRole('link', { name: UIReference.checkout.continueShoppingLabel });
    this.subtotalElement = page.getByText('Subtotal $');
    this.shippingElement = page.getByText('Shipping & Handling (Flat Rate - Fixed) $');
    this.taxElement = page.getByText('Tax $');
    this.grandTotalElement = page.getByText('Grand Total $');
    this.paymentMethodOptionCreditCard = this.page.getByLabel(UIReference.checkout.paymentOptionCreditCardLabel);
    this.paymentMethodOptionPaypal = this.page.getByLabel(UIReference.checkout.paymentOptionPaypalLabel);
    this.creditCardNumberField = this.page.getByLabel(UIReference.checkout.creditCardNumberLabel);
    this.creditCardExpiryField = this.page.getByLabel(UIReference.checkout.creditCardExpiryLabel);
    this.creditCardCVVField = this.page.getByLabel(UIReference.checkout.creditCardCVVLabel);
    this.creditCardNameField = this.page.getByLabel(UIReference.checkout.creditCardNameLabel);
  }

  // ==============================================
  // Order-related methods
  // ==============================================

  async placeOrder(){
    let orderPlacedNotification = outcomeMarker.checkout.orderPlacedNotification;

    // If we're not already on the checkout page, go there
    if (!this.page.url().includes(slugs.checkout.checkoutSlug)) {
      await this.page.goto(slugs.checkout.checkoutSlug);
    }

    // If shipping method is not selected, select it
    if (!(await this.shippingMethodOptionFixed.isChecked())) {
      await this.shippingMethodOptionFixed.check();
      await this.waitForMagewireRequests();
    }

    await this.paymentMethodOptionCheck.check();
    await this.waitForMagewireRequests();

    await this.placeOrderButton.click();
    await this.waitForMagewireRequests();

    await expect.soft(this.page.getByText(orderPlacedNotification)).toBeVisible();
    let orderNumber = await this.page.locator('p').filter({ hasText: outcomeMarker.checkout.orderPlacedNumberText });

    await expect(this.continueShoppingButton, `${outcomeMarker.checkout.orderPlacedNumberText} ${orderNumber}`).toBeVisible();
    return orderNumber;
  }


  // ==============================================
  // Discount-related methods
  // ==============================================

  async applyDiscountCodeCheckout(code: string){
    if(await this.page.getByPlaceholder(UIReference.cart.discountInputFieldLabel).isHidden()){
      // discount field is not open.
      await this.showDiscountFormButton.click();
      await this.waitForMagewireRequests();
    }

    if(await this.page.getByText(outcomeMarker.cart.priceReducedSymbols).isVisible()){
      // discount is already active.
      let cancelCouponButton = this.page.getByRole('button', { name: UIReference.checkout.cancelDiscountButtonLabel });
      await cancelCouponButton.click();
      await this.waitForMagewireRequests();
    }

    let applyCouponCheckoutButton = this.page.getByRole('button', { name: UIReference.checkout.applyDiscountButtonLabel });
    let checkoutDiscountField = this.page.getByPlaceholder(UIReference.checkout.discountInputFieldLabel);

    await checkoutDiscountField.fill(code);
    await applyCouponCheckoutButton.click();
    await this.waitForMagewireRequests();

    await expect.soft(this.page.getByText(`${outcomeMarker.checkout.couponAppliedNotification}`),`Notification that discount code ${code} has been applied`).toBeVisible({timeout: 30000});
    await expect(this.page.getByText(outcomeMarker.checkout.checkoutPriceReducedSymbol),`'-$' should be visible on the page`).toBeVisible();
  }

  async enterWrongCouponCode(code: string){
    if(await this.page.getByPlaceholder(UIReference.cart.discountInputFieldLabel).isHidden()){
      // discount field is not open.
      await this.showDiscountFormButton.click();
      await this.waitForMagewireRequests();
    }

    let applyCouponCheckoutButton = this.page.getByRole('button', { name: UIReference.checkout.applyDiscountButtonLabel });
    let checkoutDiscountField = this.page.getByPlaceholder(UIReference.checkout.discountInputFieldLabel);
    await checkoutDiscountField.fill(code);
    await applyCouponCheckoutButton.click();
    await this.waitForMagewireRequests();

    await expect.soft(this.page.getByText(outcomeMarker.checkout.incorrectDiscountNotification), `Code should not work`).toBeVisible();
    await expect(checkoutDiscountField).toBeEditable();
  }

  async removeDiscountCode(){
    if(await this.page.getByPlaceholder(UIReference.cart.discountInputFieldLabel).isHidden()){
      // discount field is not open.
      await this.showDiscountFormButton.click();
      await this.waitForMagewireRequests();
    }

    let cancelCouponButton = this.page.getByRole('button', {name: UIReference.cart.cancelCouponButtonLabel});
    await cancelCouponButton.click();
    await this.waitForMagewireRequests();

    await expect.soft(this.page.getByText(outcomeMarker.checkout.couponRemovedNotification),`Notification should be visible`).toBeVisible();
    await expect(this.page.getByText(outcomeMarker.checkout.checkoutPriceReducedSymbol),`'-$' should not be on the page`).toBeHidden();

    let checkoutDiscountField = this.page.getByPlaceholder(UIReference.checkout.discountInputFieldLabel);
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
        await this.creditCardNumberField.fill(inputvalues.payment?.creditCard?.number || '4111111111111111');
        await this.creditCardExpiryField.fill(inputvalues.payment?.creditCard?.expiry || '12/25');
        await this.creditCardCVVField.fill(inputvalues.payment?.creditCard?.cvv || '123');
        await this.creditCardNameField.fill(inputvalues.payment?.creditCard?.name || 'Test User');
        break;
      case 'paypal':
        await this.paymentMethodOptionPaypal.check();
        break;
    }

    await this.waitForMagewireRequests();
  }

  async fillShippingAddress() {
    // Fill required shipping address fields
    await this.page.getByLabel(UIReference.credentials.emailCheckoutFieldLabel, { exact: true }).fill(faker.internet.email());
    await this.page.getByLabel(UIReference.personalInformation.firstNameLabel).fill(faker.person.firstName());
    await this.page.getByLabel(UIReference.personalInformation.lastNameLabel).fill(faker.person.lastName());
    await this.page.getByLabel(UIReference.newAddress.streetAddressLabel).first().fill(faker.location.streetAddress());
    await this.page.getByLabel(UIReference.newAddress.zipCodeLabel).fill(faker.location.zipCode());
    await this.page.getByLabel(UIReference.newAddress.cityNameLabel).fill(faker.location.city());
    await this.page.getByLabel(UIReference.newAddress.phoneNumberLabel).fill(faker.phone.number());

    // Select country (if needed)
    // await this.page.getByLabel('Country').selectOption('US');

    // Select state
    await this.page.getByLabel('State/Province').selectOption(faker.location.state());

    // Wait for any Magewire updates
    await this.waitForMagewireRequests();
  }
}

export default CheckoutPage;
