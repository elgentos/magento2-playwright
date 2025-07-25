// @ts-check

import { test as base } from '@playwright/test';
import { inputValues } from '@config';
import { requireEnv } from '@utils/env.utils';

import MagentoAdminPage from '@poms/adminhtml/magentoAdmin.page';
import RegisterPage from '@poms/frontend/register.page';

const magentoAdminUsername = requireEnv('MAGENTO_ADMIN_USERNAME');
const magentoAdminPassword = requireEnv('MAGENTO_ADMIN_PASSWORD');

base.beforeEach(async ({ page }, testInfo) => {
  const magentoAdminPage = new MagentoAdminPage(page);
  await magentoAdminPage.login(magentoAdminUsername, magentoAdminPassword);
});

base.describe('Setting up the testing environment', () => {
  /**
   * @feature Magento Admin Configuration (Enable multiple admin logins)
   * @scenario Enable multiple admin logins only in Chromium browser
   * @given the
   * @scenario Enable multiple admin logins only in Chromium browser
   * @given the test is running in a Chromium-based browser
   * @when the admin logs in to the Magento dashboard
   * @and the admin navigates to the configuration page
   * @and the "Allow Multiple Admin Account Login" setting is updated to "Yes"
   * @then the configuration is saved successfully
   * @but if the browser is not Chromium
   * @then the test is skipped with an appropriate message
   */
  base('Enable_multiple_admin_logins', { tag: '@setup' }, async ({ page, browserName }, testInfo) => {
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";

    if (browserEngine !== "CHROMIUM") {
      testInfo.skip(true, `Enabling multiple admin logins through Chromium. This is ${browserEngine}, therefore test is skipped.`);
    } else {
      const magentoAdminPage = new MagentoAdminPage(page);
      await magentoAdminPage.enableMultipleAdminLogins();
    }
  });

  /**
   * @feature Magento Admin Configuration (disable login CAPTCHA)
   * @scenario Disable login CAPTCHA in admin settings via Chromium browser
   * @given the test is running in a Chromium-based browser
   * @when the admin logs in to the Magento dashboard
   * @and the admin navigates to the security configuration section
   * @and the "Enable CAPTCHA on Admin Login" setting is updated to "No"
   * @then the configuration is saved successfully
   * @but if the browser is not Chromium
   * @then the test is skipped with an appropriate message
   */
  base('Disable_login_captcha', { tag: '@setup' }, async ({ page, browserName }, testInfo) => {
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";

    if (browserEngine !== "CHROMIUM") {
      testInfo.skip(true, `Disabling login captcha through Chromium. This is ${browserEngine}, therefore test is skipped.`);
    } else {
      const magentoAdminPage = new MagentoAdminPage(page);
      await magentoAdminPage.disableLoginCaptcha();
    }
  });

  /**
   * @feature Cart Price Rules Configuration
   * @scenario Set up a coupon code for the current browser environment
   * @given a valid coupon code environment variable exists for the current browser engine
   * @when the admin navigates to the Cart Price Rules section
   * @and the admin creates a new cart price rule with the specified coupon code
   * @then the coupon code is successfully saved and available for use
   */
  base('Set_up_coupon_codes', { tag: '@setup'}, async ({page, browserName}, testInfo) => {
    const magentoAdminPage = new MagentoAdminPage(page);
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    const couponCode = requireEnv(`MAGENTO_COUPON_CODE_${browserEngine}`);

    const addCouponCodeResult = await magentoAdminPage.addCartPriceRule(couponCode);
    testInfo.annotations.push({type: 'notice', description: addCouponCodeResult});
  });

  /**
   * @feature Customer Account Setup
   * @scenario Create a test customer account for the current browser environment
   * @given valid environment variables for email and password exist for the current browser engine
   * @when the user navigates to the registration page
   * @and submits the registration form with first name, last name, email, and password
   * @then a new customer account is successfully created for testing purposes
   */
  base('Create_test_accounts', { tag: '@setup'}, async ({page, browserName}, testInfo) => {
    const magentoAdminPage = new MagentoAdminPage(page);
    const registerPage = new RegisterPage(page);
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    const accountEmail = requireEnv(`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`);
    const accountPassword = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');

    await base.step(`Check if ${accountEmail} is already registered`, async () => {
      const customerLookUp = await magentoAdminPage.checkIfCustomerExists(accountEmail);
      if(customerLookUp){
        testInfo.skip(true, `${accountEmail} was found in user table, this step is skipped. If you think this is incorrect, consider removing user from the table and try running the setup again.`);
      }
    });

    await registerPage.createNewAccount(
      inputValues.accountCreation.firstNameValue,
      inputValues.accountCreation.lastNameValue,
      accountEmail,
      accountPassword,
      true
    );
  });
});
