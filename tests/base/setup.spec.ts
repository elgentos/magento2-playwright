import {test as base} from '@playwright/test';
import {MagentoAdminPage} from './fixtures/magentoAdmin.page';
import {AccountPage} from './fixtures/account.page';

import values from './config/input-values/input-values.json';

base('Setup Magento environment for tests', async ({page}) => {
  let magentoAdminUsername = process.env.MAGENTO_ADMIN_USERNAME;
  let magentoAdminPassword = process.env.MAGENTO_ADMIN_PASSWORD;

  if(!magentoAdminUsername || !magentoAdminPassword) {
    throw new Error("MAGENTO_ADMIN_USERNAME or MAGENTO_ADMIN_PASSWORD is not defined in your .env file.");
  }

  const magentoAdminPage = new MagentoAdminPage(page);
  await magentoAdminPage.login(magentoAdminUsername, magentoAdminPassword);

  let magentoCouponCode = process.env.MAGENTO_COUPON_CODE;
  if(!magentoCouponCode) {
    throw new Error("MAGENTO_COUPON_CODE is not defined in your .env file.");
  }

  await magentoAdminPage.addCartPriceRule(magentoCouponCode);
  await magentoAdminPage.disableLoginCaptcha();

  const accountPage = new AccountPage(page);

  if(!process.env.MAGENTO_EXISTING_ACCOUNT_EMAIL || !process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD) {
    throw new Error("MAGENTO_EXISTING_ACCOUNT_EMAIL or process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD is not defined in your .env file.");
  }
  await accountPage.create(values.accountCreation.firstNameValue, values.accountCreation.lastNameValue, process.env.MAGENTO_EXISTING_ACCOUNT_EMAIL, process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD);
});
