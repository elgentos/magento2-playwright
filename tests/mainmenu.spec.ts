// @ts-check

import { test, expect } from '@playwright/test';
import { UIReference, slugs, inputValues } from 'config';

import LoginPage from './poms/frontend/login.page';
import MainMenuPage from './poms/frontend/mainmenu.page';
import ProductPage from './poms/frontend/product.page';


test.describe('Main menu (guest)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Go to login page', async ({ page }) => {
    const menu = new MainMenuPage(page);
    await menu.gotoLoginPage();
    await expect(page).toHaveURL(new RegExp(slugs.account.loginSlug));
  });

  test('Go to create account page', async ({ page }) => {
    const menu = new MainMenuPage(page);
    await menu.gotoCreateAccountPage();
    await expect(page).toHaveURL(new RegExp(slugs.account.createAccountSlug));
  });

  test('Go to a category', async ({ page }) => {
    const menu = new MainMenuPage(page);
    await menu.gotoCategory(UIReference.categoryMenu.womenLabel, slugs.categoryPage.categorySlug);
  });

  test('Go to a subcategory', async ({ page }) => {
    const menu = new MainMenuPage(page);
    await menu.gotoSubCategory(UIReference.categoryMenu.womenLabel, UIReference.categoryMenu.topsLabel, slugs.categoryPage.subCategorySlug);
  });
});

test.describe('Main menu (logged in)', () => {
  test.beforeEach(async ({ page, browserName }) => {
    const browserEngine = browserName?.toUpperCase() || 'UNKNOWN';
    const emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
    const passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

    if (!emailInputValue || !passwordInputValue) {
      throw new Error('MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn\'t been created yet.');
    }

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
test('User can log out', { tag: ['@mainmenu', '@hot'] }, async ({page}) => {
  const mainMenu = new MainMenuPage(page);
  await mainMenu.logout();
});


test('Navigate to account page', { tag: ['@mainmenu', '@hot'] }, async ({page}) => {
  const mainMenu = new MainMenuPage(page);
  await mainMenu.gotoMyAccount();
});

  test('Open the minicart', { tag: ['@mainmenu', '@cold'] }, async ({page}, testInfo) => {
  testInfo.annotations.push({ type: 'WARNING (FIREFOX)', description: `The minicart icon does not lose its aria-disabled=true flag when the first product is added. This prevents Playwright from clicking it. A fix will be added in the future.`});

  const mainMenu = new MainMenuPage(page);
  const productPage = new ProductPage(page);

  await productPage.addSimpleProductToCart(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
  await mainMenu.openMiniCart();
  });

  test('Go to Addressbook', async ({ page }) => {
    const menu = new MainMenuPage(page);
    await menu.gotoAddressBook();
  });

  test('Go to wish list', async ({ page }) => {
    const menu = new MainMenuPage(page);
    await menu.gotoWishList();
  });

  test('Go to orders', async ({ page }) => {
    const menu = new MainMenuPage(page);
    await menu.gotoOrders();
  });
});
