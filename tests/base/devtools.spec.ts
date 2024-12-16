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

    var productPagePrice = await page.locator(selectors.productPage.simpleProductPrice).innerText(); // value = $45.00
    var productPageAmount = await page.getByLabel('Quantity').inputValue(); // value = 1
    await productPage.addSimpleProductToCart();
    await page.goto(slugs.checkoutSlug);
    
    //get itemcount in cart from minicart bubble
    let cartItems = await page.locator('#menu-cart-icon > span').innerText();
    if(cartItems == "1") {
      await page.getByLabel(`Cart 1 item`).click();
    } else {
      await page.getByLabel(`Cart ${cartItems} items`).click();
    }

    // Get values from checkout page
    let simpleProductInCheckout = page.locator('#checkout-cart-details div').filter({ hasText: 'Push It Messenger Bag' }).nth(1);
    let productPriceInCheckout = await simpleProductInCheckout.getByText('$').innerText();
    let simpleProductImage = page.locator('#checkout-cart-details div').filter({ has: page.getByRole('img', { name: 'Push It Messenger Bag' }) });
    let productQuantityInCheckout = await simpleProductImage.locator('> span').innerText();

    expect(productPagePrice,`Price on PDP (${productPagePrice}) equals price in checkout (${productPriceInCheckout})`).toEqual(productPriceInCheckout);
    expect(productPageAmount,`Amount on PDP (${productPageAmount}) equals amount in checkout (${productQuantityInCheckout})`).toEqual(productQuantityInCheckout);

    // Check pricing * quantity
    productPagePrice = productPagePrice.replace('$','');
    let pricePDPInt = +productPagePrice;
    let quantityPDPInt = +productPageAmount;
    let calculatedPricePDP = pricePDPInt * quantityPDPInt;

    productPriceInCheckout = productPriceInCheckout.replace('$','');
    let priceCheckoutInt = +productPriceInCheckout;
    let quantityCheckoutInt = +productPageAmount;
    let calculatedPriceCheckout = priceCheckoutInt * quantityCheckoutInt;

    expect(calculatedPricePDP, `Price * qty on PDP (${calculatedPricePDP}) equals price * qty in checkout (${calculatedPriceCheckout})`).toEqual(calculatedPriceCheckout);
  });
});