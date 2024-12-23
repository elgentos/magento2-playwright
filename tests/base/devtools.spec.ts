import {test as base, expect} from '@playwright/test';
import {ProductPage} from './fixtures/product.page';
import {DevTools} from './fixtures/devtools.page';

import slugs from './config/slugs.json';
import selectors from './config/selectors/selectors.json';

//TODO: Write gherkin feature descriptions
base.describe('Price checking tests', () => {
  //TODO: Rewrite this test as follows:
  // Test: Simple Product Input check from PDP to checkout
  // test.step: add simple product to cart, return priceOnPDP and productAmount as variables
  // test.step: call function retrieveCheckoutPrices() to go to checkout, retrieve values
  // test.step: call function compareRetrievedPrices() to compare price on PDP to price in checkout
  
  // Test: Configurable Product Input check from PDP to checkout
  // test.step: add configurable product to cart, return priceOnPDP and productAmount as variables
  // test.step: call function retrieveCheckoutPrices() to go to checkout, retrieve values
  // test.step: call function compareRetrievedPrices() to compare price on PDP to price in checkout

  /**
   * @feature Simple Product price/amount check from PDP to Checkout
   * 
   */
  base('Simple product input to cart is consistent from PDP to checkout', async ({page}) => {
    var productPagePrice: string;
    var productPageAmount: string;
    var checkoutProductDetails: string[];

    const devTools = new DevTools(page);

    await base.step('Step: Add product to cart', async () =>{
      const productPage = new ProductPage(page);
      await page.goto(slugs.productpage.simpleProductSlug);
      // set quantity to 2 so we can see that the math works
      await page.getByLabel('Quantity').fill('2');
  
      productPagePrice = await page.locator(selectors.productPage.simpleProductPrice).innerText();
      productPageAmount = await page.getByLabel(selectors.productPage.quantityFieldLabel).inputValue();
      await productPage.addSimpleProductToCart();

    });

    await base.step('Step: go to checkout, get values', async () =>{
      await page.goto(slugs.checkoutSlug);
      await page.waitForLoadState();

      // returns productPriceInCheckout and productQuantityInCheckout
      checkoutProductDetails = await devTools.getCheckoutValues(productPagePrice, productPageAmount);
    });

    await base.step('Step: Calculate and check expectations', async () =>{
      await devTools.calculateProductPricesAndCompare(productPagePrice, productPageAmount, checkoutProductDetails[0], checkoutProductDetails[1]);
    });
    
  });
});