import { test as base } from '@playwright/test';
import {faker} from '@faker-js/faker';
import toggles from './config/test-toggles.json';

import { MagentoAdminPage } from './poms/magentoAdmin.page';
import { RegisterPage } from './poms/register.page';


import values from './config/input-values/input-values.json';

import fs from 'fs';
import path from 'path';

/**
 * NOTE:
 * The first if-statement checks if we are running in CI.
 * if so, we always run the setup.
 * else, we check if the 'setup' test toggle in test-toggles.json has been set to true. 
 * This is to ensure the tests always run in CI, but otherwise only run when requested.
 */

if(process.env.CI) {
  /**
   * If we are running in CI, we want to run the setup tests,
   * But NOT exclusively.
   */
  base.describe('Setting up the testing environment', () => {
  
    base('Enable multiple Magento admin logins', {tag: '@setup',}, async ({ page, browserName }, testInfo) => {
      const magentoAdminUsername = process.env.MAGENTO_ADMIN_USERNAME;
      const magentoAdminPassword = process.env.MAGENTO_ADMIN_PASSWORD;
  
      if (!magentoAdminUsername || !magentoAdminPassword) {
        throw new Error("MAGENTO_ADMIN_USERNAME or MAGENTO_ADMIN_PASSWORD is not defined in your .env file.");
      }
  
      const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
  
      /**
       * Only enable multiple admin logins for Chromium browser.
       */
      if (browserEngine === "CHROMIUM") {
        const magentoAdminPage = new MagentoAdminPage(page);
        await magentoAdminPage.login(magentoAdminUsername, magentoAdminPassword);
        await magentoAdminPage.enableMultipleAdminLogins();
      } else {
        testInfo.skip(true, `Skipping because configuration is only needed once.`);
      }
    });
  
    base('Setup Magento environment for tests', {tag: '@setup',}, async ({ page, browserName }, testInfo) => {
      const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
      const setupCompleteVar = `SETUP_COMPLETE_${browserEngine}`;
      const isSetupComplete = process.env[setupCompleteVar];
  
      if(isSetupComplete === 'DONE') {
        testInfo.skip(true, `Skipping because configuration is only needed once.`);
      }
  
      await base.step(`Step 1: Perform actions`, async() =>{
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
  
      await base.step(`Step 2: (optional) Update env file`, async() =>{
        if (process.env.CI === 'true') {
          console.log("Running in CI environment. Skipping .env update.");
          base.skip();
        }
  
        const envPath = path.resolve(__dirname, '../../.env');
        try {
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
            if (!envContent.includes(`SETUP_COMPLETE_${browserEngine}='DONE'`)) {
              fs.appendFileSync(envPath, `\nSETUP_COMPLETE_${browserEngine}='DONE'`);
              console.log(`Environment setup completed successfully. 'SETUP_COMPLETE_${browserEngine}='DONE'' added to .env file.`);
            }
            // if (!envContent.includes(`SETUP_COMPLETE_${browserEngine}=true`)) {
            //   fs.appendFileSync(envPath, `\nSETUP_COMPLETE_${browserEngine}=true`);
            //   console.log(`Environment setup completed successfully. 'SETUP_COMPLETE_${browserEngine}=true' added to .env file.`);
            // }
          } else {
            throw new Error('.env file not found. Please ensure it exists in the root directory.');
          }
        } catch (error) {
          throw new Error(`Failed to update .env file: ${error.message}`);
        }
      });
    });
  });
} else {
  if(toggles.general.setup) {
    /**
     * This test is used to set up the testing environment.
     * It should only be run once, or when the environment needs to be reset.
     * It is skipped by default, but can be run by setting the 'general.setup' toggle to true.
     */
    base.describe.only('Setting up the testing environment', () => {
  
      base('Enable multiple Magento admin logins', {tag: '@setup',}, async ({ page, browserName }, testInfo) => {
        const magentoAdminUsername = process.env.MAGENTO_ADMIN_USERNAME;
        const magentoAdminPassword = process.env.MAGENTO_ADMIN_PASSWORD;
    
        if (!magentoAdminUsername || !magentoAdminPassword) {
          throw new Error("MAGENTO_ADMIN_USERNAME or MAGENTO_ADMIN_PASSWORD is not defined in your .env file.");
        }
    
        const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    
        /**
         * Only enable multiple admin logins for Chromium browser.
         */
        if (browserEngine === "CHROMIUM") {
          const magentoAdminPage = new MagentoAdminPage(page);
          await magentoAdminPage.login(magentoAdminUsername, magentoAdminPassword);
          await magentoAdminPage.enableMultipleAdminLogins();
        } else {
          testInfo.skip(true, `Skipping because configuration is only needed once.`);
        }
      });
    
      base('Setup Magento environment for tests', {tag: '@setup',}, async ({ page, browserName }, testInfo) => {
        const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
        const setupCompleteVar = `SETUP_COMPLETE_${browserEngine}`;
        const isSetupComplete = process.env[setupCompleteVar];
    
        if(isSetupComplete === 'DONE') {
          testInfo.skip(true, `Skipping because configuration is only needed once.`);
        }
    
        await base.step(`Step 1: Perform actions`, async() =>{
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
    
        await base.step(`Step 2: (optional) Update env file`, async() =>{
          if (process.env.CI === 'true') {
            console.log("Running in CI environment. Skipping .env update.");
            base.skip();
          }
    
          const envPath = path.resolve(__dirname, '../../.env');
          try {
            if (fs.existsSync(envPath)) {
              const envContent = fs.readFileSync(envPath, 'utf-8');
              const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
              if (!envContent.includes(`SETUP_COMPLETE_${browserEngine}='DONE'`)) {
                fs.appendFileSync(envPath, `\nSETUP_COMPLETE_${browserEngine}='DONE'`);
                console.log(`Environment setup completed successfully. 'SETUP_COMPLETE_${browserEngine}='DONE'' added to .env file.`);
              }
              // if (!envContent.includes(`SETUP_COMPLETE_${browserEngine}=true`)) {
              //   fs.appendFileSync(envPath, `\nSETUP_COMPLETE_${browserEngine}=true`);
              //   console.log(`Environment setup completed successfully. 'SETUP_COMPLETE_${browserEngine}=true' added to .env file.`);
              // }
            } else {
              throw new Error('.env file not found. Please ensure it exists in the root directory.');
            }
          } catch (error) {
            throw new Error(`Failed to update .env file: ${error.message}`);
          }
        });
      });
    });
  }
}


