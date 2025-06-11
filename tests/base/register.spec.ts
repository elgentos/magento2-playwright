import {test} from '@playwright/test';
import {RegisterPage} from './fixtures/register.page';
import {faker} from '@faker-js/faker';

import inputvalues from './config/input-values/input-values.json';

// Reset storageState to ensure we're not logged in before running these tests.
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * @feature Magento 2 Account Creation
 * @scenario The user creates an account on the website
 *  @given I am on any Magento 2 page
 *    @when I go to the account creation page
 *    @and I fill in the required information correctly
 *  @then I click the 'Create account' button
 *  @then I should see a messsage confirming my account was created
 */
test('User can register an account', { tag: ['@setup', '@hot'] }, async ({page, browserName}, testInfo) => {
  const registerPage = new RegisterPage(page);

  // Retrieve desired password from .env file
  const existingAccountPassword = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;
  var firstName = faker.person.firstName();
  var lastName = faker.person.lastName();

  const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
  let randomNumber = Math.floor(Math.random() * 100);
  let emailHandle = inputvalues.accountCreation.emailHandleValue;
  let emailHost = inputvalues.accountCreation.emailHostValue;
  const accountEmail = `${emailHandle}${randomNumber}-${browserEngine}@${emailHost}`;
  //const accountEmail = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];

  if (!accountEmail || !existingAccountPassword) {
    throw new Error(
      `MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} or MAGENTO_EXISTING_ACCOUNT_PASSWORD is not defined in your .env file.`
    );
  }
  // end of browserNameEmailSection

  await registerPage.createNewAccount(firstName, lastName, accountEmail, existingAccountPassword);
  testInfo.annotations.push({ type: 'Notification: account created!', description: `Credentials used: ${accountEmail}, password: ${existingAccountPassword}` });
});
