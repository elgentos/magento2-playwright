import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';
import verify from '../config/expected/expected.json';

export class CheckoutPage {

  //TODO: Expand with fields for when user is not logged in or has not provided an address
  readonly page: Page;
  readonly shippingMethodOptionFixed: Locator;
  readonly paymentMethodOptionCheck: Locator;
  readonly showDiscountFormButton: Locator;
  readonly placeOrderButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page){
    this.page = page;
    this.shippingMethodOptionFixed = this.page.getByLabel('Fixed');
    this.paymentMethodOptionCheck = this.page.getByLabel('Check / Money order Free');
    this.showDiscountFormButton = this.page.getByRole('button', {name: 'Apply Discount Code'});
    this.placeOrderButton = this.page.getByRole('button', { name: 'Place Order' });
    this.continueShoppingButton = this.page.getByRole('link', { name: 'Continue Shopping' });
  }

  async placeOrder(){
    let orderPlacedNotification = "Thank you for your purchase!";

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

    await expect(this.page.getByText(orderPlacedNotification)).toBeVisible();
    let orderNumber = await this.page.locator('p').filter({ hasText: 'Your order number is:' }).getByRole('link').innerText();
    console.log(`Your ordernumer is: ${orderNumber}`);

    // This await only exists to report order number to the HTML reporter.
    // TODO: replace this with a proper way to write something to the HTML reporter.
    await expect(this.continueShoppingButton, `Your order number is: ${orderNumber}`).toBeVisible();
    return orderNumber;
  }

  async applyDiscountCodeCheckout(code: string){
    if(await this.page.getByPlaceholder(selectors.cart.discountInputFieldLabel).isHidden()){
      // discount field is not open.
      await this.showDiscountFormButton.click();
    }

    if(await this.page.getByText(verify.cart.priceReducedSymbols).isVisible()){
      // discount is already active.
      let cancelCouponButton = this.page.getByRole('button', { name: 'Cancel Coupon' });
      await cancelCouponButton.click();
    }

    let applyCouponCheckoutButton = this.page.getByRole('button', { name: 'Apply Coupon' });
    let checkoutDiscountField = this.page.getByPlaceholder('Enter discount code');
  
    await checkoutDiscountField.fill(code);
    await applyCouponCheckoutButton.click();

    await expect(this.page.getByText(`${verify.checkout.couponAppliedNotification}`),`Notification that discount code ${code} has been applied`).toBeVisible({timeout: 30000});
    await expect(this.page.getByText(verify.checkout.checkoutPriceReducedSymbol),`'-$' should be visible on the page`).toBeVisible();
  }
}