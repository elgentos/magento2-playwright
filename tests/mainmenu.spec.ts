// @ts-check

import { test } from '@playwright/test';
import { UIReference, slugs } from '@config';

import LoginPage from '@poms/frontend/login.page';
import MainMenuPage from '@poms/frontend/mainmenu.page';
import ProductPage from '@poms/frontend/product.page';
import { requireEnv } from '@utils/env.utils';

// no resetting storageState, mainmenu has more functionalities when logged in.

test.describe('Guest tests (not logged in)', () => {
  /**
   * @feature Navigate to login page
   * @scenario user clicks 'log in' button in main menu
   * @given I am not logged in
   * @and I am on any Magento 2 page
   * @when I click on the user icon in the main menu
   * @and I click the 'sign in' button
   * @then I should navigate to the login page
   */
  test('User_navigates_to_login', { tag: ['@mainmenu', '@cold'] }, async ({page}) => {
    const mainMenu = new MainMenuPage(page);
    await mainMenu.goToLoginPage();
  });

  /**
   * @feature Navigate to create account page
   * @scenario user clicks 'create an account' button in main menu
   * @given I am not logged in
   * @and I am on any Magento 2 page
   * @when I click on the user icon in the main menu
   * @and I click the 'create an account' button
   * @then I should navigate to the create account page
   */
  test('User_navigates_to_create_account', { tag: ['@mainmenu', '@cold'] }, async ({page}) => {
    const mainMenu = new MainMenuPage(page);
    await mainMenu.goToCreateAccountPage();
  });

  /**
   * @feature Navigate to subcategory page
   * @scenario User hover over menu link to navigate to category page
   * @given I am not logged in
   * @and I am on any Magento 2 page
   * @when I hover over an item in the main menu
   * @then A dropdown menu should appear
   * @when I click an item
   * @then I should navigate to the page
   */
  test('Navigate_to_category_page', { tag: ['@mainmenu', '@cold'] }, async ({page}) => {
    const mainMenu = new MainMenuPage(page);
    await mainMenu.goToCategoryPage();
  });

  /**
   * @feature Navigate to category page
   * @scenario User hover over menu link to navigate to category page
   * @given I am not logged in
   * @and I am on any Magento 2 page
   * @when I hover over an item in the main menu
   * @then A dropdown menu should appear
   * @when I click an item
   * @then I should navigate to the page
   */
  test('Navigate_to_subcategory_page', { tag: ['@mainmenu', '@cold'] }, async ({page}) => {
    const mainMenu = new MainMenuPage(page);
    await mainMenu.goToSubCategoryPage();
  });
});

test.describe('User tests (logged in)', () => {
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

  /**
   * @feature Navigate to account page
   * @scenario user navigates to account page
   * @given I am logged in
   * @and I am on any magento 2 page
   * @when I open the account menu
   * @and I click the account button
   * @and I click the 'my account' button
   * @then I should be navigated to my account
   */
  test('Navigate_to_account_page', { tag: ['@mainmenu', '@hot'] }, async ({page}) => {
    const mainMenu = new MainMenuPage(page);
    await mainMenu.gotoMyAccount();
  });

  test('Open_the_minicart', { tag: ['@mainmenu', '@cold'] }, async ({page}) => {
    const mainMenu = new MainMenuPage(page);
    await mainMenu.openMiniCart();
  });

});





