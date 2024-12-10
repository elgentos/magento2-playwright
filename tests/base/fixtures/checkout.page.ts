import {expect, type Locator, type Page} from '@playwright/test';

export class CheckoutPage {

  //TODO: Expand with fields for when user is not logged in or has not provided an address
  readonly page: Page;
  readonly shippingMethodOptionFixed: Locator;
  readonly paymentMethodOptionCheck: Locator;
  readonly placeOrderButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page){
    this.page = page;
    this.shippingMethodOptionFixed = this.page.getByLabel('Fixed');
    this.paymentMethodOptionCheck = this.page.getByLabel('Check / Money order Free');
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
}