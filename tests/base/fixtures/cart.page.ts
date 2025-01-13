import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';
import verify from '../config/expected/expected.json';

export class CartPage {
  readonly page: Page;
  readonly showDiscountButton: Locator;
  readonly applyDiscountButton: Locator;
  productPagePrice: string;
  productPageAmount: string;
  productQuantityInCheckout: string;
  productPriceInCheckout: string;

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
    
    await expect(this.page.getByText(`${verify.cart.discountAppliedNotification} "${code}"`),`Notification that discount code ${code} has been applied`).toBeVisible();
    await expect(this.page.getByText(verify.cart.priceReducedSymbols),`'- $' should be visible on the page`).toBeVisible();
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

    await expect(this.page.getByText(verify.cart.discountRemovedNotification),`Notification should be visible`).toBeVisible();
    await expect(this.page.getByText(verify.cart.priceReducedSymbols),`'- $' should not be on the page`).toBeHidden();
  }

  async removeProduct(name: string){
    let removeButton = this.page.getByLabel(`${selectors.cart.cancelCouponButtonLabel} ${name}`);
    await removeButton.click();
    await expect(removeButton,`Button to remove product is no longer visible`).toBeHidden();
  }

  async getCheckoutValues(productName:string, pricePDP:string, amountPDP:string){
    // Open minicart based on amount of products in cart
    let cartItemAmount = await this.page.locator(selectors.miniCart.minicartAmountBubbleLocator).count();
    if(cartItemAmount == 1) {
      await this.page.getByLabel(`${selectors.checkout.openCartButtonLabel} ${cartItemAmount} ${selectors.checkout.openCartButtonLabelCont}`).click();
    } else {
      await this.page.getByLabel(`${selectors.checkout.openCartButtonLabel} ${cartItemAmount} ${selectors.checkout.openCartButtonLabelContMultiple}`).click();
    }

    // Get values from checkout page
    let productInCheckout = this.page.locator(selectors.checkout.cartDetailsLocator).filter({ hasText: productName }).nth(1);
    this.productPriceInCheckout = await productInCheckout.getByText(selectors.general.genericPriceSymbol).innerText();
    this.productPriceInCheckout = this.productPriceInCheckout.trim();
    let productImage = this.page.locator(selectors.checkout.cartDetailsLocator)
    .filter({ has: this.page.getByRole('img', { name: productName })});
    this.productQuantityInCheckout = await productImage.locator('> span').innerText();

    return [this.productPriceInCheckout, this.productQuantityInCheckout];
  }

  async calculateProductPricesAndCompare(pricePDP: string, amountPDP:string, priceCheckout:string, amountCheckout:string){
    // perform magic to calculate price * amount and mold it into the correct form again
    pricePDP = pricePDP.replace(selectors.general.genericPriceSymbol,'');
    let pricePDPInt = Number(pricePDP);
    let quantityPDPInt = +amountPDP;
    let calculatedPricePDP = `${selectors.general.genericPriceSymbol}` + (pricePDPInt * quantityPDPInt).toFixed(2);

    expect(amountPDP,`Amount on PDP (${amountPDP}) equals amount in checkout (${amountCheckout})`).toEqual(amountPDP);
    expect(calculatedPricePDP, `Price * qty on PDP (${calculatedPricePDP}) equals price * qty in checkout (${priceCheckout})`).toEqual(priceCheckout);
  }
}