import {test as base} from '@playwright/test';
import {LoginPage} from './fixtures/login.page';

import slugs from './config/slugs.json';

/*
const test = base.extend<{ loginPage:LoginPage }>({
 loginPage: async ({ page }, use) => {
  const loginPage = new LoginPage(page);
  await loginPage.login();
 } 
});
*/

/**
 * @feature Magento 2 Account Creation
 * @scenario The user creates an account on the website
 *  @given I am on any Magento 2 page
 *    @when I go to the account creation page
 *    @and I fill in the required information
 *  @then I click the 'Create account' button
 *  @then I should see a messsage confirming my account was created
 */
base('Login with existing account', async ({page}) => {
  const account = new LoginPage(page);

  await account.login();
});
