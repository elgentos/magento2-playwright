// @ts-check

import { test as base, expect } from '@playwright/test';
import { outcomeMarker, inputValues } from 'config';

import LoginPage from './poms/frontend/login.page';

base('User_logs_in_with_valid_credentials', {tag: '@hot'}, async ({page, browserName}) => {
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

  expect(parsedData.customer.firstname, 'Customer firstname should match').toBe(inputValues.accountCreation.firstNameValue);
  expect(parsedData.customer.fullname, 'Customer lastname should match').toContain(inputValues.accountCreation.lastNameValue);
});

base('Invalid_credentials_are_rejected', async ({page}) => {
  const loginPage = new LoginPage(page);
  await loginPage.loginExpectError('invalid@example.com', 'wrongpassword', outcomeMarker.login.invalidCredentialsMessage);
});

base('Login_fails_with_missing_password', async ({page}) => {
  const loginPage = new LoginPage(page);
  await loginPage.loginExpectError('invalid@example.com', '', '');
});
