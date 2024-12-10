import {test as base} from '@playwright/test';
import {LoginPage} from './fixtures/login.page';

/*
const test = base.extend<{ loginPage:LoginPage }>({
 loginPage: async ({ page }, use) => {
  const loginPage = new LoginPage(page);
  await loginPage.login();
 } 
});
*/

//TODO: create an auth.setup.ts file to handle authentication (see login function on login.page.ts)
//TODO: link that setup file in project dependencies to be logged for all tests.
// See: https://playwright.dev/docs/auth#basic-shared-account-in-all-tests

//TODO: login.spec.ts can be removed when storageState functionality has been implemented. Relevant functions should be moved to mainmenu, footer, search, or other page spec files.

// Reset storageState to ensure we're not logged in before running these tests.
base.use({ storageState: { cookies: [], origins: [] } });

base('User can log in with valid credentials', async ({page}) => {
  let emailInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_EMAIL;
  let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

  if(!emailInputValue || !passwordInputValue) {
    throw new Error("Your password variable and/or your email variable have not defined in the .env file, or the account hasn't been created yet.");
  }

  const loginPage = new LoginPage(page);
  await loginPage.login(emailInputValue, passwordInputValue);
});

//TODO: Add test to ensure user cannot log in with invalid credentials.
// Basically, we log in with wrong credentials, then expect a failure message.
// These tests should have a specific "error checker" tag.


//TODO: Add test to test 'Forgot your Password' functionality