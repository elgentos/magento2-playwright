import {expect, type Locator, type Page} from '@playwright/test';

import UIReference from '../config/element-identifiers/element-identifiers.json';
import outcomeMarker from '../config/outcome-markers/outcome-markers.json';
import slugs from '../config/slugs.json';
import {faker} from '@faker-js/faker';


export class CheckoutPage {

  readonly page: Page;
  readonly shippingMethodOptionFixed: Locator;
  readonly paymentMethodOptionCheck: Locator;
  readonly showDiscountFormButton: Locator;
  readonly placeOrderButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly subtotalElement: Locator;
  readonly shippingElement: Locator;
  readonly taxElement: Locator;
  readonly grandTotalElement: Locator;

  constructor(page: Page){
    this.page = page;
    this.shippingMethodOptionFixed = this.page.getByLabel(UIReference.checkout.shippingMethodFixedLabel);
    this.paymentMethodOptionCheck = this.page.getByLabel(UIReference.checkout.paymentOptionCheckLabel);
    this.showDiscountFormButton = this.page.getByRole('button', {name: UIReference.checkout.openDiscountFormLabel});
    this.placeOrderButton = this.page.getByRole('button', { name: UIReference.checkout.placeOrderButtonLabel });
    this.continueShoppingButton = this.page.getByRole('link', { name: UIReference.checkout.continueShoppingLabel });
    this.subtotalElement = page.getByText('Subtotal $');
    this.shippingElement = page.getByText('Shipping & Handling (Flat Rate - Fixed) $');
    this.taxElement = page.getByText('Tax $');
    this.grandTotalElement = page.getByText('Grand Total $');
  }

  // ==============================================
  // Order-related methods
  // ==============================================

  async placeOrder(){
    let orderPlacedNotification = outcomeMarker.checkout.orderPlacedNotification;
    await this.page.goto(slugs.checkoutSlug);

    await this.shippingMethodOptionFixed.check();
    // Loader pops up, wait for this to be done.
    await this.page.waitForFunction(() => {
      const element = document.querySelector('.magewire\\.messenger');
      return element && getComputedStyle(element).height === '0px';
    });

    await this.paymentMethodOptionCheck.check();
    // Loader pops up, wait for this to be done.
    await this.page.waitForFunction(() => {
      const element = document.querySelector('.magewire\\.messenger');
      return element && getComputedStyle(element).height === '0px';
    });


    await this.placeOrderButton.click();
    // Loader pops up, wait for this to be done.
    await this.page.waitForFunction(() => {
      const element = document.querySelector('.magewire\\.messenger');
      return element && getComputedStyle(element).height === '0px';
    });

    await expect.soft(this.page.getByText(orderPlacedNotification)).toBeVisible();
    let orderNumber = await this.page.locator('p').filter({ hasText: outcomeMarker.checkout.orderPlacedNumberText }).getByRole('link').innerText();

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

  async fillRequiredFields() {
    // Fill in personal information with Faker
    await this.page.getByLabel(UIReference.personalInformation.firstNameLabel).fill(faker.person.firstName());
    await this.page.getByLabel(UIReference.personalInformation.lastNameLabel).fill(faker.person.lastName());
    await this.page.getByLabel(UIReference.credentials.emailCheckoutLabel, { exact: true }).fill(faker.internet.email());

    // Fill in shipping address
    await this.page.getByLabel(UIReference.newAddress.streetAddressLabel).fill(faker.location.streetAddress());
    await this.page.getByLabel(UIReference.newAddress.cityNameLabel).fill(faker.location.city());
    await this.page.getByLabel(UIReference.newAddress.zipCodeLabel).fill(faker.string.numeric(5));
    await this.page.getByLabel(UIReference.newAddress.phoneNumberLabel).fill(faker.phone.number());

    // Wait for state field to be enabled
    await this.page.waitForTimeout(500);

    // Select state
    const stateSelect = this.page.getByLabel(UIReference.newAddress.provinceSelectLabel);
    await stateSelect.selectOption('California');
  }
}
