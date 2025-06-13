import { test as base } from '@playwright/test';
import { faker } from '@faker-js/faker';
import toggles from './config/test-toggles.json';

import MagentoAdminPage from './fixtures/magentoAdmin.page';
import RegisterPage from './fixtures/register.page';
import AccountPage from './fixtures/account.page';

import values from './config/input-values/input-values.json';

import fs from 'fs';
import path from 'path';

/**
 * NOTE:
 * The first if-statement checks if we are running in CI.
 * If so, we always run the setup.
 * Else, we check if the 'setup' test toggle in test-toggles.json has been set to true. 
 */

const runSetupTests = (describeFn: typeof base.describe | typeof base.describe.only) => {
  describeFn('Setting up the testing environment', () => {
    base('Enable multiple Magento admin logins', { tag: '@setup' }, async ({ page, browserName }, testInfo) => {
      const magentoAdminUsername = process.env.MAGENTO_ADMIN_USERNAME;
      const magentoAdminPassword = process.env.MAGENTO_ADMIN_PASSWORD;

      if (!magentoAdminUsername || !magentoAdminPassword) {
        throw new Error("MAGENTO_ADMIN_USERNAME or MAGENTO_ADMIN_PASSWORD is not defined in your .env file.");
      }

      const browserEngine = browserName?.toUpperCase() || "UNKNOWN";

      if (browserEngine === "CHROMIUM") {
        const magentoAdminPage = new MagentoAdminPage(page);
        await magentoAdminPage.login(magentoAdminUsername, magentoAdminPassword);
        await magentoAdminPage.enableMultipleAdminLogins();
      } else {
        testInfo.skip(true, `Skipping because configuration is only needed once.`);
      }
    });

    base('Disable login CAPTCHA', { tag: '@setup' }, async ({ page, browserName }, testInfo) => {
      const magentoAdminUsername = process.env.MAGENTO_ADMIN_USERNAME;
      const magentoAdminPassword = process.env.MAGENTO_ADMIN_PASSWORD;

      if (!magentoAdminUsername || !magentoAdminPassword) {
        throw new Error("MAGENTO_ADMIN_USERNAME or MAGENTO_ADMIN_PASSWORD is not defined in your .env file.");
      }

      const browserEngine = browserName?.toUpperCase() || "UNKNOWN";

      if (browserEngine === "CHROMIUM") {
        const magentoAdminPage = new MagentoAdminPage(page);
        await magentoAdminPage.login(magentoAdminUsername, magentoAdminPassword);
        await magentoAdminPage.disableLoginCaptcha();
      } else {
        testInfo.skip(true, `Skipping because configuration is only needed once.`);
      }
    });

    base('Setup Magento environment for tests', { tag: '@setup' }, async ({ page, browserName }, testInfo) => {
      const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
      const setupCompleteVar = `SETUP_COMPLETE_${browserEngine}`;
      const isSetupComplete = process.env[setupCompleteVar];

      if (isSetupComplete === 'DONE') {
        testInfo.skip(true, `Skipping because configuration is only needed once.`);
      }

      await base.step(`Step 1: Perform actions`, async () => {
        const magentoAdminUsername = process.env.MAGENTO_ADMIN_USERNAME;
        const magentoAdminPassword = process.env.MAGENTO_ADMIN_PASSWORD;

        if (!magentoAdminUsername || !magentoAdminPassword) {
          throw new Error("MAGENTO_ADMIN_USERNAME or MAGENTO_ADMIN_PASSWORD is not defined in your .env file.");
        }

        const magentoAdminPage = new MagentoAdminPage(page);
        await magentoAdminPage.login(magentoAdminUsername, magentoAdminPassword);

        const couponCode = process.env[`MAGENTO_COUPON_CODE_${browserEngine}`];
        if (!couponCode) {
          throw new Error(`MAGENTO_COUPON_CODE_${browserEngine} is not defined in your .env file.`);
        }
        await magentoAdminPage.addCartPriceRule(couponCode);

        const registerPage = new RegisterPage(page);
        const accountEmail = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
        const accountPassword = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

        if (!accountEmail || !accountPassword) {
          throw new Error(
            `MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} or MAGENTO_EXISTING_ACCOUNT_PASSWORD is not defined in your .env file.`
          );
        }

        await registerPage.createNewAccount(
          values.accountCreation.firstNameValue,
          values.accountCreation.lastNameValue,
          accountEmail,
          accountPassword,
          true
        );
      });

      await base.step(`Step 2: (optional) Update env file`, async () => {
        if (process.env.CI === 'true') {
          console.log("Running in CI environment. Skipping .env update.");
          base.skip();
        }

        const envPath = path.resolve(__dirname, '../../.env');
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
          throw new Error(`Failed to update .env file: ${error.message}`);
        }
      });
    });
  });
};

if (process.env.CI) {
  runSetupTests(base.describe);
} else if (toggles.general.setup) {
  runSetupTests(base.describe.only);
}