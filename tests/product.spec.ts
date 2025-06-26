// @ts-check

import { test } from '@playwright/test';
import { UIReference ,slugs } from 'config';

import ProductPage from './poms/frontend/product.page';
import LoginPage from './poms/frontend/login.page';

test.describe('Product page tests',{ tag: '@product',}, () => {
  test('Add_product_to_compare',{ tag: '@cold'}, async ({page}) => {
    const productPage = new ProductPage(page);
    await productPage.addProductToCompare(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
  });

  test('Add_product_to_wishlist',{ tag: '@cold'}, async ({page, browserName}) => {
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


  test.fixme('Leave a product review (Test currently fails due to error on website)',{ tag: '@cold'}, async ({page}) => {
    // const productPage = new ProductPage(page);
    // await productPage.leaveProductReview(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
  });

  test('Open_pictures_in_lightbox_and_scroll', async ({page}) => {
    const productPage = new ProductPage(page);
    await productPage.openLightboxAndScrollThrough(slugs.productpage.configurableProductSlug);
  });

  test('Change_number_of_reviews_shown_on_product_page', async ({page}) => {
    const productPage = new ProductPage(page);
    await productPage.changeReviewCountAndVerify(slugs.productpage.simpleProductSlug);
  });
});

test.describe('Simple product tests',{ tag: '@simple-product',}, () => {
  test.fixme('Simple tests will be added later', async ({ page }) => {});
});

test.describe('Configurable product tests',{ tag: '@conf-product',}, () => {
  test.fixme('Configurable tests will be added later', async ({ page }) => {});
});
