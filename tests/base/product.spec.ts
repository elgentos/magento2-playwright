import { test, expect } from '@playwright/test';

import {ProductPage} from './poms/product.page';
import {LoginPage} from './poms/login.page';

import slugs from './config/slugs.json';
import UIReference from './config/element-identifiers/element-identifiers.json';
import outcomeMarker from './config/outcome-markers/outcome-markers.json';


test.describe('Product page tests',{ tag: '@product',}, () => {
  test('Add product to compare', async ({page}) => {
    const productPage = new ProductPage(page);
    await productPage.addProductToCompare(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
  });

  test('Add product to wishlist', async ({page, browserName}) => {
    await test.step('Log in with account', async () =>{
      const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
      let emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
      let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;
    
      if(!emailInputValue || !passwordInputValue) {
        throw new Error("MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn't been created yet.");
      }
    
      const loginPage = new LoginPage(page);
      await loginPage.login(emailInputValue, passwordInputValue);
    });

    await test.step('Add product to wishlist', async () =>{
      const productPage = new ProductPage(page);
      await productPage.addProductToWishlist(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
    });
  });


  test.fixme('Leave a product review (Test currently fails due to error on website)', async ({page}) => {
    // const productPage = new ProductPage(page);
    // await productPage.leaveProductReview(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
  });

  test('Open pictures in lightbox and scroll through', async ({page}) => {
    const productPage = new ProductPage(page);
    await productPage.openLightboxAndScrollThrough(slugs.productpage.configurableProductSlug);
  });
  
});

test.describe('Simple product tests',{ tag: '@simple-product',}, () => {
  test.fixme('Simple tests will be added later', async ({ page }) => {});
});

test.describe('Configurable product tests',{ tag: '@conf-product',}, () => {
  test.fixme('Configurable tests will be added later', async ({ page }) => {});
});