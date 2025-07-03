// @ts-check

import { test } from '@playwright/test';
import { UIReference, slugs } from '@config';

import LoginPage from '@poms/frontend/login.page';
import MainMenuPage from '@poms/frontend/mainmenu.page';
import ProductPage from '@poms/frontend/product.page';
import { requireEnv } from '@utils/env.utils';

// no resetting storageState, mainmenu has more functionalities when logged in.

// Before each test, log in
test.beforeEach(async ({ page, browserName }) => {
  const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
  const emailInputValue = requireEnv(`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`);
  const passwordInputValue = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');

  const loginPage = new LoginPage(page);
  await loginPage.login(emailInputValue, passwordInputValue);
});

/**
 * @feature Logout
 * @scenario The user can log out
 *  @given I am logged in
 *  @and I am on any Magento 2 page
 *    @when I open the account menu
 *    @and I click the Logout option
 *  @then I should see a message confirming I am logged out
 */
test('User_logs_out', { tag: ['@mainmenu', '@hot'] }, async ({page}) => {
  const mainMenu = new MainMenuPage(page);
  await mainMenu.logout();
});


test('Navigate_to_account_page', { tag: ['@mainmenu', '@hot'] }, async ({page}) => {
  const mainMenu = new MainMenuPage(page);
  await mainMenu.gotoMyAccount();
});

test('Open_the_minicart', { tag: ['@mainmenu', '@cold'] }, async ({page}, testInfo) => {
  testInfo.annotations.push({ type: 'WARNING (FIREFOX)', description: `The minicart icon does not lose its aria-disabled=true flag when the first product is added. This prevents Playwright from clicking it. A fix will be added in the future.`});

  const mainMenu = new MainMenuPage(page);
  const productPage = new ProductPage(page);

  await productPage.addSimpleProductToCart(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
  await mainMenu.openMiniCart();
});
