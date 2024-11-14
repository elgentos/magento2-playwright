import {Page} from '@playwright/test';
import checkoutSelectors from '../fixtures/during/selectors/checkout.json';
import checkoutExpected from '../fixtures/verify/expects/checkout.json'

export class Checkout {
  page: Page;

  constructor(page: Page) {
    this.page = page
  }

  async fastForward() {
    await this.page.click(checkoutSelectors.firstAccountAddressSelector);
    await this.page.click(checkoutSelectors.firstShipmentOptionSelector);
    await this.page.click(checkoutSelectors.firstPaymentOptionSelector);

    await this.page.waitForFunction(() => {
      const element = document.querySelector('.magewire\\.messenger');
      return element && getComputedStyle(element).height === '0px';
    });

    await this.page.click(checkoutSelectors.placeOrderButtonSelector);

    await this.page.waitForFunction(() => {
      const element = document.querySelector('.magewire\\.messenger');
      return element && getComputedStyle(element).height === '0px';
    });
  }
}
