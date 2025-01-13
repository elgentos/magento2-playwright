import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';

export class CartPage {
  readonly page: Page;
  readonly applyDiscountButton: Locator;
  productPagePrice: string;
  productPageAmount: string;
  productQuantityInCheckout: string;
  productPriceInCheckout: string;

  constructor(page: Page) {
    this.page = page;
    this.applyDiscountButton = this.page.getByRole('button', { name: selectors.cart.applyDiscountCodeLabel });
  }

  async removeProduct(name: string){
    let removeButton = this.page.getByLabel(`${selectors.cart.remove} ${name}`);
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