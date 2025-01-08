import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';
import verify from '../config/expected/expected.json';

export class CartPage {
  readonly page: Page;
  readonly showDiscountButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.showDiscountButton = this.page.getByRole('button', { name: selectors.cart.showDiscountFormButtonLabel });
  }

  async applyDiscountCode(code: string){
    if(await this.page.getByPlaceholder(selectors.cart.discountInputFieldLabel).isHidden()){
      // discount field is not open.
      await this.showDiscountButton.click();
    }
    
    let applyDiscoundButton = this.page.getByRole('button', {name: selectors.cart.applyDiscountButtonLabel, exact:true});
    let discountField = this.page.getByPlaceholder(selectors.cart.discountInputFieldLabel);
    await discountField.fill(code);
    await applyDiscoundButton.click();
    await this.page.waitForLoadState();
    
    await expect(this.page.getByText(`${verify.cart.discountAppliedNotification} "${code}"`),`Notification that discount code ${code} has been applied`).toBeVisible();
    await expect(this.page.getByText(verify.cart.priceReducedSymbols),`'- $' should be visible on the page`).toBeVisible();
    //Close message to prevent difficulties with other tests.
    await this.page.getByLabel(selectors.general.closeMessageLabel).click();
  }

  async enterWrongCouponCode(code: string){
    if(await this.page.getByPlaceholder(selectors.cart.discountInputFieldLabel).isHidden()){
      // discount field is not open.
      await this.showDiscountButton.click();
    }

    let applyDiscoundButton = this.page.getByRole('button', {name: selectors.cart.applyDiscountButtonLabel, exact:true});
    let discountField = this.page.getByPlaceholder(selectors.cart.discountInputFieldLabel);
    await discountField.fill(code);
    await applyDiscoundButton.click();
    await this.page.waitForLoadState();

    let incorrectNotification = `${verify.cart.incorrectCouponCodeNotificationOne} "${code}" ${verify.cart.incorrectCouponCodeNotificationTwo}`;

    await expect(this.page.getByText(incorrectNotification), `Code should not work`).toBeVisible();
  }

  async removeDiscountCode(){
    if(await this.page.getByPlaceholder(selectors.cart.discountInputFieldLabel).isHidden()){
      // discount field is not open.
      await this.showDiscountButton.click();
    }
  
    let cancelCouponButton = this.page.getByRole('button', {name: selectors.cart.cancelCouponButtonLabel});
    await cancelCouponButton.click();
    await this.page.waitForLoadState();

    await expect(this.page.getByText(verify.cart.discountRemovedNotification),`Notification should be visible`).toBeVisible();
    await expect(this.page.getByText(verify.cart.priceReducedSymbols),`'- $' should not be on the page`).toBeHidden();
  }

  async removeProduct(name: string){
    //let removeButton = this.page.getByLabel(`${selectors.cart.cancelCouponButtonLabel} ${name}`);
    let removeButton = this.page.getByLabel(`Remove ${name}`);
    await removeButton.click();
    await this.page.waitForLoadState();
    await expect(removeButton,`Button to remove product is no longer visible`).toBeHidden();
  }
}