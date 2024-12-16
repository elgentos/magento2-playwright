import {test as base, expect} from '@playwright/test';
import {ProductPage} from './fixtures/product.page';

import slugs from './config/slugs.json';
import selectors from './config/selectors/selectors.json';
import verify from './config/expected/expected.json';

base.describe('Price checking tests', () => {
  //TODO: break down test in steps once we can send variables between steps.
  base('product input to cart is consistent from PDP to checkout', async ({page}) => {
    const productPage = new ProductPage(page);
    await page.goto(slugs.productpage.simpleProductSlug);

    // await page.getByLabel('Quantity').fill('2');

    var productPagePrice = await page.locator(selectors.productPage.simpleProductPrice).innerText();
    var productPageAmount = await page.getByLabel('Quantity').inputValue();
    await productPage.addSimpleProductToCart();
    await page.goto(slugs.checkoutSlug);
    
    //get itemcount in cart from minicart bubble
    let cartItemAmount = await page.locator('#menu-cart-icon > span').count();
    if(cartItemAmount == 1) {
      await page.getByLabel(`Cart 1 item`).click();
    } else {
      await page.getByLabel(`Cart ${cartItemAmount} items`).click();
    }

    // Get values from checkout page
    let simpleProductInCheckout = page.locator('#checkout-cart-details div').filter({ hasText: 'Push It Messenger Bag' }).nth(1);
    let productPriceInCheckout = await simpleProductInCheckout.getByText('$').innerText();
    let simpleProductImage = page.locator('#checkout-cart-details div').filter({ has: page.getByRole('img', { name: 'Push It Messenger Bag' }) });
    let productQuantityInCheckout = await simpleProductImage.locator('> span').innerText();

    // perform magic to calculate price * amount and mold it into the correct form again
    productPagePrice = productPagePrice.replace('$','');
    let pricePDPInt = Number(productPagePrice);
    let quantityPDPInt = +productPageAmount;
    let calculatedPricePDP = "$" + (pricePDPInt * quantityPDPInt).toFixed(2);

    expect(productPageAmount,`Amount on PDP (${productPageAmount}) equals amount in checkout (${productQuantityInCheckout})`).toEqual(productQuantityInCheckout);
    expect(calculatedPricePDP, `Price * qty on PDP (${calculatedPricePDP}) equals price * qty in checkout (${productPriceInCheckout})`).toEqual(productPriceInCheckout);
  });
});