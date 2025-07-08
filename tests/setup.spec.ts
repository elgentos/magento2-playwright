// @ts-check

import { test as base } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { inputValues } from '@config';
import { requireEnv } from '@utils/env.utils';

import MagentoAdminPage from '@poms/adminhtml/magentoAdmin.page';
import RegisterPage from '@poms/frontend/register.page';

const magentoAdminUsername = requireEnv('MAGENTO_ADMIN_USERNAME');
const magentoAdminPassword = requireEnv('MAGENTO_ADMIN_PASSWORD');

base.describe('Setting up the testing environment', () => {
  base('Enable_multiple_admin_logins', { tag: '@setup' }, async ({ page, browserName }, testInfo) => {
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";

    if (browserEngine === "CHROMIUM") {
      const magentoAdminPage = new MagentoAdminPage(page);
      await magentoAdminPage.login(magentoAdminUsername, magentoAdminPassword);
      await magentoAdminPage.enableMultipleAdminLogins();
    } else {
      testInfo.skip(true, `Skipping because configuration is only needed once.`);
    }
  });

  base('Disable_login_captcha', { tag: '@setup' }, async ({ page, browserName }, testInfo) => {
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";

    if (browserEngine === "CHROMIUM") {
      const magentoAdminPage = new MagentoAdminPage(page);
      await magentoAdminPage.login(magentoAdminUsername, magentoAdminPassword);
      await magentoAdminPage.disableLoginCaptcha();
    } else {
      testInfo.skip(true, `Skipping because configuration is only needed once.`);
    }
  });

  base('Setup_environment_for_tests', { tag: '@setup' }, async ({ page, browserName }, testInfo) => {
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    const setupCompleteVar = `SETUP_COMPLETE_${browserEngine}`;
    const isSetupComplete = process.env[setupCompleteVar];

    if (isSetupComplete === 'DONE') {
      testInfo.skip(true, `Skipping because configuration is only needed once.`);
    }

    await base.step(`Step 1: Perform actions`, async () => {
      const magentoAdminPage = new MagentoAdminPage(page);
      await magentoAdminPage.login(magentoAdminUsername, magentoAdminPassword);

      const couponCode = requireEnv(`MAGENTO_COUPON_CODE_${browserEngine}`);
      await magentoAdminPage.addCartPriceRule(couponCode);

      const registerPage = new RegisterPage(page);
      const accountEmail = requireEnv(`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`);
      const accountPassword = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');

      await registerPage.createNewAccount(
        inputValues.accountCreation.firstNameValue,
        inputValues.accountCreation.lastNameValue,
        accountEmail,
        accountPassword,
        true
      );
    });

    await base.step(`Step 2: (optional) Update env file`, async () => {
      console.log(process.env.CI);
      if (process.env.CI === 'true') {
        console.log("Running in CI environment. Skipping .env update.");
        base.skip();
      }

      const envPath = path.resolve(__dirname, '../.env');
      try {
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf-8');
          if (!envContent.includes(`SETUP_COMPLETE_${browserEngine}='DONE'`)) {
            fs.appendFileSync(envPath, `\nSETUP_COMPLETE_${browserEngine}='DONE'`);
            console.log(`Environment setup completed. Added SETUP_COMPLETE_${browserEngine}='DONE' to .env`);
          }
        } else {
          throw new Error('.env file not found. Please ensure it exists in the root directory.');
        }
      } catch (error) {
        const err = error as Error;
        throw new Error(`Failed to update .env file: ${err.message}`);
      }
    });
  });
});