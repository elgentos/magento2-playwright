import {test} from '@playwright/test';
import {RegisterPage} from './fixtures/register.page';

// Reset storageState to ensure we're not logged in before running these tests.
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * @feature Magento 2 Account Creation
 * @scenario The user creates an account on the website
 *  @given I am on any Magento 2 page
 *    @when I go to the account creation page
 *    @and I fill in the required information
 *  @then I click the 'Create account' button
 *  @then I should see a messsage confirming my account was created
 */
test('User can register an account', async ({page}) => {
  const registerPage = new RegisterPage(page);
  await registerPage.createNewAccount();
});

// TODO: registration should not work if mistakes are made, and proper messages should be displayed.
// These tests should have a specific "error checker" tag.
test('Account creation fails if required fields are not filled in', { tag: '@error-checker', }, async ({page}) => {
  test.fixme(true,'Skipped, test will be created later');
});