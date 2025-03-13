import {expect, type Locator, type Page} from '@playwright/test';
import { faker } from '@faker-js/faker';

import UIReference from '../config/element-identifiers/element-identifiers.json';
import outcomeMarker from '../config/outcome-markers/outcome-markers.json';
import slugs from '../config/slugs.json';

export class CheckoutPage {

  readonly page: Page;
  readonly shippingMethodOptionFixed: Locator;
  readonly paymentMethodOptionCheck: Locator;
  readonly showDiscountFormButton: Locator;
  readonly placeOrderButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page){
    this.page = page;
    this.shippingMethodOptionFixed = this.page.getByLabel(UIReference.checkout.shippingMethodFixedLabel);
    this.paymentMethodOptionCheck = this.page.getByLabel(UIReference.checkout.paymentOptionCheckLabel);
    this.showDiscountFormButton = this.page.getByRole('button', {name: UIReference.checkout.openDiscountFormLabel});
    this.placeOrderButton = this.page.getByRole('button', { name: UIReference.checkout.placeOrderButtonLabel });
    this.continueShoppingButton = this.page.getByRole('link', { name: UIReference.checkout.continueShoppingLabel });
  }

  async waitForHyvaToasts() {
    // Wait for toast to appear and disappear
    await this.page.waitForFunction(() => {
      const elements = document.querySelectorAll('.magewire\\.messenger');
      return Array.from(elements).every(element =>
        !element || getComputedStyle(element).height === '0px' || element.classList.contains('hidden')
      );
    }, { timeout: 10000 });

    // Additional safety delay
    await this.page.waitForTimeout(500);
  }

  // ==============================================
  // Order-related methods
  // ==============================================

  async placeOrder(){
    let orderPlacedNotification = outcomeMarker.checkout.orderPlacedNotification;
    await this.page.goto(slugs.checkoutSlug);

    await this.selectShipmentMethod();

    await this.selectPaymentMethod('check');
    // Loader pops up, wait for this to be done.
    await this.waitForHyvaToasts();

    await this.placeOrderButton.click();
    // Loader pops up, wait for this to be done.
    await this.waitForHyvaToasts();

    await expect.soft(this.page.getByText(orderPlacedNotification)).toBeVisible();
    let orderNumber = await this.page.locator('p').filter({ hasText: outcomeMarker.checkout.orderPlacedNumberText }).getByRole('link').innerText();

    await expect(this.continueShoppingButton, `${outcomeMarker.checkout.orderPlacedNumberText} ${orderNumber}`).toBeVisible();
    return orderNumber;
  }

  async selectShipmentMethod() {
    await this.shippingMethodOptionFixed.check();
    // Wait for shipping method to be applied
    await this.waitForHyvaToasts();
  }

  async selectPaymentMethod(method: 'check') {
    switch (method) {
      case 'check':
        await this.paymentMethodOptionCheck.check();
        break;
      default:
        throw new Error(`Payment method ${method} is not supported`);
    }

    // Wait for payment method to be applied
    await this.waitForHyvaToasts();
  }

  // ==============================================
  // Discount-related methods
  // ==============================================

  async applyDiscountCodeCheckout(code: string){
    if(await this.page.getByPlaceholder(UIReference.cart.discountInputFieldLabel).isHidden()){
      // discount field is not open.
      await this.showDiscountFormButton.click();
    }

    if(await this.page.getByText(outcomeMarker.cart.priceReducedSymbols).isVisible()){
      // discount is already active.
      let cancelCouponButton = this.page.getByRole('button', { name: UIReference.checkout.cancelDiscountButtonLabel });
      await cancelCouponButton.click();
    }

    let applyCouponCheckoutButton = this.page.getByRole('button', { name: UIReference.checkout.applyDiscountButtonLabel });
    let checkoutDiscountField = this.page.getByPlaceholder(UIReference.checkout.discountInputFieldLabel);

    await checkoutDiscountField.fill(code);
    await applyCouponCheckoutButton.click();

    await expect.soft(this.page.getByText(`${outcomeMarker.checkout.couponAppliedNotification}`),`Notification that discount code ${code} has been applied`).toBeVisible({timeout: 30000});
    await expect(this.page.getByText(outcomeMarker.checkout.checkoutPriceReducedSymbol),`'-$' should be visible on the page`).toBeVisible();
  }

  async enterWrongCouponCode(code: string){
    if(await this.page.getByPlaceholder(UIReference.cart.discountInputFieldLabel).isHidden()){
      // discount field is not open.
      await this.showDiscountFormButton.click();
    }

    let applyCouponCheckoutButton = this.page.getByRole('button', { name: UIReference.checkout.applyDiscountButtonLabel });
    let checkoutDiscountField = this.page.getByPlaceholder(UIReference.checkout.discountInputFieldLabel);
    await checkoutDiscountField.fill(code);
    await applyCouponCheckoutButton.click();

    await expect.soft(this.page.getByText(outcomeMarker.checkout.incorrectDiscountNotification), `Code should not work`).toBeVisible();
    await expect(checkoutDiscountField).toBeEditable();
  }

  async removeDiscountCode(){
    if(await this.page.getByPlaceholder(UIReference.cart.discountInputFieldLabel).isHidden()){
      // discount field is not open.
      await this.showDiscountFormButton.click();
    }

    let cancelCouponButton = this.page.getByRole('button', {name: UIReference.cart.cancelCouponButtonLabel});
    await cancelCouponButton.click();

    await expect.soft(this.page.getByText(outcomeMarker.checkout.couponRemovedNotification),`Notification should be visible`).toBeVisible();
    await expect(this.page.getByText(outcomeMarker.checkout.checkoutPriceReducedSymbol),`'-$' should not be on the page`).toBeHidden();

    let checkoutDiscountField = this.page.getByPlaceholder(UIReference.checkout.discountInputFieldLabel);
    await expect(checkoutDiscountField).toBeEditable();
  }

  // ==============================================
  // Address-related methods
  // ==============================================

  async fillGuestAddress() {
    // Fill in guest information
    await this.page.getByLabel('Email address', { exact: true }).fill(faker.internet.email());
    await this.page.getByLabel(UIReference.personalInformation.firstNameLabel).fill(faker.person.firstName());
    await this.page.getByLabel(UIReference.personalInformation.lastNameLabel).fill(faker.person.lastName());

    // Fill in address information
    await this.page.getByLabel(UIReference.newAddress.streetAddressLabel).fill(`${faker.location.streetAddress()} Street`);
    await this.page.getByLabel(UIReference.newAddress.countryLabel).selectOption('US');
    await this.waitForHyvaToasts();
    await this.page.getByLabel(UIReference.newAddress.provinceSelectLabel).selectOption('Alabama');
    await this.waitForHyvaToasts();
    await this.page.getByLabel(UIReference.newAddress.zipCodeLabel).fill(faker.location.zipCode('#####'));
    await this.page.getByLabel(UIReference.newAddress.cityNameLabel).fill(faker.location.city());
    await this.page.getByLabel(UIReference.newAddress.phoneNumberLabel).fill(faker.phone.number('##########'));
    await this.waitForHyvaToasts();
  }

  // ==============================================
  // Price-related methods
  // ==============================================

  async getPriceValue(element: Locator): Promise<number> {
    const priceText = await element.innerText();
    // Extract just the price part after the $ symbol
    const match = priceText.match(/\$\s*([\d.]+)/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    throw new Error(`Could not extract price from text: ${priceText}`);
  }
}
