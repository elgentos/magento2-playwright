import { test as base } from '@playwright/test';
import { MagentoAdminPage } from './fixtures/magentoAdmin.page';
import { AccountPage } from './fixtures/account.page';

import values from './config/input-values/input-values.json';
import fs from 'fs';
import path from 'path';

if (!process.env.SETUP_COMPLETE) {
  base('Enable multiple Magento admin logins', async ({ page, browserName }) => {
    const magentoAdminUsername = process.env.MAGENTO_ADMIN_USERNAME;
    const magentoAdminPassword = process.env.MAGENTO_ADMIN_PASSWORD;

    if (!magentoAdminUsername || !magentoAdminPassword) {
      throw new Error("MAGENTO_ADMIN_USERNAME or MAGENTO_ADMIN_PASSWORD is not defined in your .env file.");
    }

    const magentoAdminPage = new MagentoAdminPage(page);
    await magentoAdminPage.login(magentoAdminUsername, magentoAdminPassword);

    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";

    if (browserEngine === "CHROMIUM") {
      await magentoAdminPage.enableMultipleAdminLogins();
    }
  });

  base('Setup Magento environment for tests', async ({ page, browserName }) => {
    const magentoAdminUsername = process.env.MAGENTO_ADMIN_USERNAME;
    const magentoAdminPassword = process.env.MAGENTO_ADMIN_PASSWORD;

    if (!magentoAdminUsername || !magentoAdminPassword) {
      throw new Error("MAGENTO_ADMIN_USERNAME or MAGENTO_ADMIN_PASSWORD is not defined in your .env file.");
    }

    const magentoAdminPage = new MagentoAdminPage(page);
    await magentoAdminPage.login(magentoAdminUsername, magentoAdminPassword);

    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";

    const couponCode = process.env[`MAGENTO_COUPON_CODE_${browserEngine}`];
    if (!couponCode) {
      throw new Error(`MAGENTO_COUPON_CODE_${browserEngine} is not defined in your .env file.`);
    }
    await magentoAdminPage.addCartPriceRule(couponCode);
    await magentoAdminPage.disableLoginCaptcha();

    const accountPage = new AccountPage(page);

    const accountEmail = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
    const accountPassword = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

    if (!accountEmail || !accountPassword) {
      throw new Error(
        `MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} or MAGENTO_EXISTING_ACCOUNT_PASSWORD is not defined in your .env file.`
      );
    }

    await accountPage.create(
      values.accountCreation.firstNameValue,
      values.accountCreation.lastNameValue,
      accountEmail,
      accountPassword
    );

    if (process.env.CI === 'true') {
      console.log("Running in CI environment. Skipping .env update.");
      process.exit(0);
    }

    const envPath = path.resolve(__dirname, '../../.env');
    try {
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        if (!envContent.includes('SETUP_COMPLETE=true')) {
          fs.appendFileSync(envPath, '\nSETUP_COMPLETE=true');
          console.log("Environment setup completed successfully. 'SETUP_COMPLETE=true' added to .env file.");
        }
      } else {
        throw new Error('.env file not found. Please ensure it exists in the root directory.');
      }
    } catch (error) {
      throw new Error(`Failed to update .env file: ${error.message}`);
    }
  });
}
