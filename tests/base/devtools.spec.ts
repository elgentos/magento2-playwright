import {test as base, expect} from '@playwright/test';
import {ProductPage} from './fixtures/product.page';

import slugs from './config/slugs.json';
import selectors from './config/selectors/selectors.json';
import verify from './config/expected/expected.json';

base.describe.serial('Price checking tests', () => {
  base('product input to cart is consistent from PDP to checkout', async ({page}) => {
    var productPagePrice: string;
    var productPageAmount: string;
    var productQuantityInCheckout: string;
    var productPriceInCheckout: string;
    
    await base.step('Step: Add product to cart', async () =>{
      const productPage = new ProductPage(page);
      await page.goto(slugs.productpage.simpleProductSlug);
      // set quantity to 2 so we can see that the math works
      await page.getByLabel('Quantity').fill('2');
  
      productPagePrice = await page.locator(selectors.productPage.simpleProductPrice).innerText();
      productPageAmount = await page.getByLabel(selectors.productPage.quantityFieldLabel).inputValue();
      await productPage.addSimpleProductToCart();
    });

    await base.step('Step: Go to checkout, get values', async () =>{
      await page.goto(slugs.checkoutSlug);

      //get itemcount in cart from minicart bubble
      let cartItemAmount = await page.locator(selectors.miniCart.minicartAmountBubbleLocator).count();
      if(cartItemAmount == 1) {
        await page.getByLabel(`${selectors.checkout.openCartButtonLabel} ${cartItemAmount} ${selectors.checkout.openCartButtonLabelCont}`).click();
      } else {
        await page.getByLabel(`${selectors.checkout.openCartButtonLabel} ${cartItemAmount} ${selectors.checkout.openCartButtonLabelContMultiple}`).click();
      }

      // Get values from checkout page
      let simpleProductInCheckout = page.locator(selectors.checkout.cartDetailsLocator).filter({ hasText: selectors.productPage.simpleProductTitle }).nth(1);
      productPriceInCheckout = await simpleProductInCheckout.getByText(selectors.general.genericPriceSymbol).innerText();
      let simpleProductImage = page.locator(selectors.checkout.cartDetailsLocator)
                                    .filter({ has: page.getByRole('img', { name: selectors.productPage.simpleProductTitle })});
      productQuantityInCheckout = await simpleProductImage.locator('> span').innerText();
    });

    await base.step('Step: Calculate and check expectations', async () =>{
      // perform magic to calculate price * amount and mold it into the correct form again
      productPagePrice = productPagePrice.replace(selectors.general.genericPriceSymbol,'');
      let pricePDPInt = Number(productPagePrice);
      let quantityPDPInt = +productPageAmount;
      let calculatedPricePDP = `${selectors.general.genericPriceSymbol}` + (pricePDPInt * quantityPDPInt).toFixed(2);

      expect(productPageAmount,`Amount on PDP (${productPageAmount}) equals amount in checkout (${productQuantityInCheckout})`).toEqual(productQuantityInCheckout);
      expect(calculatedPricePDP, `Price * qty on PDP (${calculatedPricePDP}) equals price * qty in checkout (${productPriceInCheckout})`).toEqual(productPriceInCheckout);
    });
    
  });
});