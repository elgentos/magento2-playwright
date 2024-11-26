import {test as base} from '@playwright/test';
import {RegisterPage} from './fixtures/register.page';

// Reset storageState to ensure we're not logged in before running these tests.
base.use({ storageState: { cookies: [], origins: [] } });

/**
 * @feature Magento 2 Account Creation
 * @scenario The user creates an account on the website
 *  @given I am on any Magento 2 page
 *    @when I go to the account creation page
 *    @and I fill in the required information
 *  @then I click the 'Create account' button
 *  @then I should see a messsage confirming my account was created
 */
base('User can register an account', async ({page}) => {
  base.fixme(true,'This is skipped until the storageState authentication is fully operational. Use base/account.spec.ts instead');
});