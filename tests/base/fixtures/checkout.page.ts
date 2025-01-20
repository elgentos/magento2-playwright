import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';
import verify from '../config/expected/expected.json';
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
    this.shippingMethodOptionFixed = this.page.getByLabel(selectors.checkout.shippingMethodFixedLabel);
    this.paymentMethodOptionCheck = this.page.getByLabel(selectors.checkout.paymentOptionCheckLabel);
    this.showDiscountFormButton = this.page.getByRole('button', {name: selectors.checkout.openDiscountFormLabel});
    this.placeOrderButton = this.page.getByRole('button', { name: selectors.checkout.placeOrderButtonLabel });
    this.continueShoppingButton = this.page.getByRole('link', { name: selectors.checkout.continueShoppingLabel });
  }

  async placeOrder(){
    let orderPlacedNotification = "Thank you for your purchase!";
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

    await expect(this.page.getByText(orderPlacedNotification)).toBeVisible();
    let orderNumber = await this.page.locator('p').filter({ hasText: 'Your order number is:' }).getByRole('link').innerText();
    console.log(`Your ordernumer is: ${orderNumber}`);

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
      let cancelCouponButton = this.page.getByRole('button', { name: selectors.checkout.cancelDiscountButtonLabel });
      await cancelCouponButton.click();
    }

    let applyCouponCheckoutButton = this.page.getByRole('button', { name: selectors.checkout.applyDiscountButtonLabel });
    let checkoutDiscountField = this.page.getByPlaceholder(selectors.checkout.discountInputFieldLabel);
  
    await checkoutDiscountField.fill(code);
    await applyCouponCheckoutButton.click();

    await expect(this.page.getByText(`${verify.checkout.couponAppliedNotification}`),`Notification that discount code ${code} has been applied`).toBeVisible({timeout: 30000});
    await expect(this.page.getByText(verify.checkout.checkoutPriceReducedSymbol),`'-$' should be visible on the page`).toBeVisible();
  }

  async enterWrongCouponCode(code: string){
    if(await this.page.getByPlaceholder(selectors.cart.discountInputFieldLabel).isHidden()){
      // discount field is not open.
      await this.showDiscountFormButton.click();
    }

    let applyCouponCheckoutButton = this.page.getByRole('button', { name: selectors.checkout.applyDiscountButtonLabel });
    let checkoutDiscountField = this.page.getByPlaceholder(selectors.checkout.discountInputFieldLabel);
    await checkoutDiscountField.fill(code);
    await applyCouponCheckoutButton.click();

    await expect(this.page.getByText(verify.checkout.incorrectDiscountNotification), `Code should not work`).toBeVisible();
  }

  async removeDiscountCode(){
    if(await this.page.getByPlaceholder(selectors.cart.discountInputFieldLabel).isHidden()){
      // discount field is not open.
      await this.showDiscountFormButton.click();
    }
  
    let cancelCouponButton = this.page.getByRole('button', {name: selectors.cart.cancelCouponButtonLabel});
    await cancelCouponButton.click();

    await expect(this.page.getByText(verify.checkout.couponRemovedNotification),`Notification should be visible`).toBeVisible();
    await expect(this.page.getByText(verify.checkout.checkoutPriceReducedSymbol),`'-$' should not be on the page`).toBeHidden();
  }
}