import {test as base} from '@playwright/test';
import {ProductPage} from '../poms/product.page';
import { CartPage } from '../poms/shoppingcart.page';
import { LoginPage } from '../poms/login.page';
import {MainMenuPage} from '../poms/mainmenu.page';

import {shopPageWithProduct} from './page-manager.ts';

import slugs from '../config/slugs.json';

import UIReference from '../config/element-identifiers/element-identifiers.json';

type CustomFixtures = {
  productPage: any;
  userPage: any;
  userProductPage: any;
}

export const customTest = base.extend<CustomFixtures>({  
  productPage: async ({page}, use) => {
    // Setup the fixture
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    await productPage.addSimpleProductToCart(UIReference.productPage.secondSimpleProducTitle, slugs.productpage.secondSimpleProductSlug);

    // Use step (where the actual test takes place)
    await use({productPage, cartPage, page});

    // Teardown & Cleanup
    await cartPage.removeProduct(UIReference.productPage.secondSimpleProducTitle);
  },

  userPage: async({page, browserName}, use) => {
    // Setup the fixture
    const loggedInPage = new LoginPage(page);
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    let emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
    let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

    if(!emailInputValue || !passwordInputValue) {
      throw new Error("MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn't been created yet.");
    }
    await loggedInPage.login(emailInputValue, passwordInputValue);

    // Use step (where the actual test takes place)
    await use({loggedInPage, page});

    // Teardown & Cleanup
    await loggedInPage.logout();
  },

  userProductPage: async ({page, browserName}, use) => {    
    //Setup the fixture
    const loginPage = new LoginPage(page);
    const productPage = new ProductPage(page);

    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    let emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
    let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;
    if(!emailInputValue || !passwordInputValue) {
      throw new Error(`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn't been created yet.`);
    }
    await loginPage.login(emailInputValue, passwordInputValue);

    await productPage.addSimpleProductToCart(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
    // Use step (where the actual test takes place)
    await use({productPage, loginPage, page});

    // Teardown & Cleanup
    const cartPage = new CartPage(page);
    const mainMenu = new MainMenuPage(page);
    await cartPage.removeProduct(UIReference.productPage.simpleProductTitle);
    await cartPage.removeProduct(UIReference.productPage.configurableProductTitle);
    await mainMenu.logout();
    
  }
});
export { expect } from '@playwright/test';