import { test as setup, expect } from '@playwright/test';
import path from 'path';
import slugs from './base/config/slugs.json';
import selectors from './base/config/selectors/selectors.json';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page, browserName }) => {
  const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
  let emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
  let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

  if(!emailInputValue || !passwordInputValue) {
    throw new Error("MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn't been created yet.");
  }

  // Perform authentication steps. Replace these actions with your own.
  await page.goto(slugs.account.loginSlug);
  await page.getByLabel(selectors.credentials.emailFieldLabel, {exact: true}).fill(emailInputValue);
  await page.getByLabel(selectors.credentials.passwordFieldLabel, {exact: true}).fill(passwordInputValue);
  await page.getByRole('button', { name: selectors.credentials.loginButtonLabel }).click();
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  // await page.waitForURL('');
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  await expect(page.getByRole('link', { name: selectors.mainMenu.myAccountLogoutItem })).toBeVisible();

  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});
