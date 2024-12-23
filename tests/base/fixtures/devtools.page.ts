import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json'; 

export class DevTools{
  readonly page: Page;
  productPagePrice: string;
  productPageAmount: string;
  productQuantityInCheckout: string;
  productPriceInCheckout: string;

  constructor(page: Page){
    this.page = page;
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

    // if(simpleProduct){
    //   let simpleProductInCheckout = this.page.locator(selectors.checkout.cartDetailsLocator).filter({ hasText: selectors.productPage.simpleProductTitle }).nth(1);
    //   this.productPriceInCheckout = await simpleProductInCheckout.getByText(selectors.general.genericPriceSymbol).innerText();
    //   this.productPriceInCheckout = this.productPriceInCheckout.trim();
    //   let simpleProductImage = this.page.locator(selectors.checkout.cartDetailsLocator)
    //   .filter({ has: this.page.getByRole('img', { name: selectors.productPage.simpleProductTitle })});
    //   this.productQuantityInCheckout = await simpleProductImage.locator('> span').innerText();
    // } else {
    //   let confProductInCheckout = this.page.locator(selectors.checkout.cartDetailsLocator).filter({ hasText: selectors.productPage.configurableProductTitle }).nth(1);
    //   this.productPriceInCheckout = await confProductInCheckout.getByText(selectors.general.genericPriceSymbol).innerText();
    //   this.productPriceInCheckout = this.productPriceInCheckout.trim();
    //   let confProductImage = this.page.locator(selectors.checkout.cartDetailsLocator)
    //   .filter({ has: this.page.getByRole('img', { name: selectors.productPage.configurableProductTitle })});
    //   this.productQuantityInCheckout = await confProductImage.locator('> span').innerText();
    // }

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