import {test} from '@playwright/test';
import {RegisterPage} from './fixtures/register.page';

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
test('User can register an account', { tag: '@setup', }, async ({page, browserName}) => {
// TODO: remove the 'skip' when done. We don't always want to create accounts. 
test.skip('User can register an account', async ({page}) => {
  const registerPage = new RegisterPage(page);

  // Retrieve desired password from .env file
  const existingAccountPassword = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;
  var firstName = inputvalues.accountCreation.firstNameValue;
  var lastName = inputvalues.accountCreation.lastNameValue;

  
  // TODO: Once setup script works, uncomment this section (uniqueEmailSection) and remove the one below
  //Create unique email with custom handle and host, adding a number between 0 - 100
  /* let randomNumber = Math.floor(Math.random() * 100);
  let emailHandle = inputvalues.accountCreation.emailHandleValue;
  let emailHost = inputvalues.accountCreation.emailHostValue;
  const uniqueEmail = `${emailHandle}${randomNumber}@${emailHost}`; 

  if(!existingAccountPassword){
    throw new Error("MAGENTO_EXISTING_ACCOUNT_PASSWORD has not been defined in the .env file.");
  } */
  // end of uniqueEmailSection
  
  
  //TODO: Once setup script works, remove this section (browserNameEmailSection) and use uniqueEmail from above
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


  // password is retrieved from .env file in createNewAccount() function
  await registerPage.createNewAccount(firstName, lastName, accountEmail, existingAccountPassword);
});


test.skip('Account creation fails if required fields are not filled in', { tag: '@error-checker', }, async ({page}) => {
  // TODO: registration should not work if mistakes are made, and proper messages should be displayed.
  // These tests should have a specific "error checker" tag.
  test.fixme(true,'Skipped, test will be created later');
});