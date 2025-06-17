import {test as base, expect} from '@playwright/test';
import LoginPage from './fixtures/login.page';
import MainMenuPage from './fixtures/mainmenu.page';
import inputvalues from './config/input-values/input-values.json';
import outcomeMarker from './config/outcome-markers/outcome-markers.json';

base('User can log in with valid credentials', {tag: '@hot'}, async ({page, browserName}) => {
  const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
  let emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];

  let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

  if(!emailInputValue || !passwordInputValue) {
    throw new Error("MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn't been created yet.");
  }

  const loginPage = new LoginPage(page)
  await loginPage.login(emailInputValue, passwordInputValue);
  await page.waitForLoadState('networkidle');

  // Check customer section data in localStorage and verify name
  const customerData = await page.evaluate(() => {
    const data = localStorage.getItem('mage-cache-storage');
    return data ? data : null;
  });

  expect(customerData, 'Customer data should exist in localStorage').toBeTruthy();
  expect(customerData, 'Customer data should contain customer information').toContain('customer');

  // Parse the JSON and verify firstname and lastname
  const parsedData = await page.evaluate(() => {
    const data = localStorage.getItem('mage-cache-storage');
    return data ? JSON.parse(data) : null;
  });

  expect(parsedData.customer.firstname, 'Customer firstname should match').toBe(inputvalues.accountCreation.firstNameValue);
  expect(parsedData.customer.fullname, 'Customer lastname should match').toContain(inputvalues.accountCreation.lastNameValue);
});

base('User cannot log in with invalid credentials', async ({page}) => {
  const loginPage = new LoginPage(page);
  await loginPage.loginExpectError('invalid@example.com', 'wrongpassword', outcomeMarker.login.invalidCredentialsMessage);
});

base('Login fails with missing password', async ({page}) => {
  const loginPage = new LoginPage(page);
  await loginPage.loginExpectError('invalid@example.com', '', false);
});
