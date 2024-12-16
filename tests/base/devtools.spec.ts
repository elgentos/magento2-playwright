import {test as base, expect} from '@playwright/test';
import {ProductPage} from './fixtures/product.page';

import slugs from './config/slugs.json';
import selectors from './config/selectors/selectors.json';
import verify from './config/expected/expected.json';

base.describe('Price checking tests', () => {
  base('product pricing is consistent and correct', async ({page}) => {
    const productPage = new ProductPage(page);

    await page.goto(slugs.productpage.simpleProductSlug);
    // value = $45.00
    let productPagePrice = await page.locator(selectors.productPage.simpleProductPrice).innerText();
    await productPage.addSimpleProductToCart();
    await page.goto(slugs.checkoutSlug);

    //get itemcount in cart from minicart bubble
    let cartItems = await page.locator('#menu-cart-icon > span').innerText();
    
    if(cartItems == "1") {
      await page.getByLabel(`Cart 1 item`).click();
    } else {
      await page.getByLabel(`Cart ${cartItems} items`).click();
    }

    const simpleProductInCheckout = page.locator('#checkout-cart-details div').filter({ hasText: 'Push It Messenger Bag' }).nth(1);
    const productPriceInCheckout = await simpleProductInCheckout.getByText('$').innerText();

    expect(productPagePrice,`Price on PDP (${productPagePrice}) equals price in checkout (${productPriceInCheckout})`).toEqual(productPriceInCheckout);
  });
});