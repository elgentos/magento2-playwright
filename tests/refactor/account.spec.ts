import {test, expect} from '@playwright/test';
import {LoginPage} from './fixtures/login.page';
import {AccountPage} from './fixtures/account.page';

import slugs from './config/slugs.json';
import verify from './config/expected/expected.json';

// no resetting storageState, mainmenu has more functionalities when logged in.

// TODO: remove this beforeEach() once authentication as project set-up/fixture works.
// Before each test, log in
test.beforeEach(async ({ page }) => {
  let emailInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_EMAIL;
  let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

  if(!emailInputValue || !passwordInputValue) {
    throw new Error("Your password variable and/or your email variable have not defined in the .env file, or the account hasn't been created yet.");
  }

  const loginPage = new LoginPage(page);
  await loginPage.login(emailInputValue, passwordInputValue);
});


test.describe('Account address book actions', { annotation: {type: 'Account Dashboard', description: 'Address Book'},}, () => {
  test.beforeEach(async ({page}) => {
    // go to the Adress Book page
    await page.goto(slugs.account.addressBookSlug);
    await expect(page.getByText(verify.account.addressBookTitle, { exact: true })).toBeVisible();
  });
  /**
   * @feature Magento 2 Add First Address to Account
   * @scenario User adds a first address to their account
   * @given I am logged in
   *  @and I am on the account dashboard page
   * @when I go to the page where I can add my address
   *   @and I haven't added an address yet
   * @when I fill in the required information
   *   @and I click the save button
   * @then I should see a notification my address has been updated. 
   *  @and The new address should be selected as default and shipping address
   */

  test('I can add my first address',{ tag: '@address-actions', }, async ({page}) => {
    const accountPage = new AccountPage(page);

  });

  /*
  test('Add new address on account', async ({page}) => {
    const account = new Account(page);

    // Throw an error if existingAccountPassword is empty
    if(!existingAccountPassword || !existingAccountEmail){
      throw new Error("Existing Password or Email variable not defined in .env");
    }
    
    await account.login(existingAccountEmail, existingAccountPassword);
    await account.addAddress();

    const accountPageTester = new PageTester(page, page.url());
    await accountPageTester.testPage();
  });
  */

  /**
   * @feature Magento 2 Update Address in Account
   * @scenario User updates an existing address to their account
   * @given I am logged in
   *  @and I am on the account dashboard page
   * @when I go to the page where I can see my address(es)
   * @when I click on the button to edit the address
   *   @and I fill in the required information correctly
   *   @then I click the save button
   * @then I should see a notification my address has been updated. 
   *  @and The updated address should be visible in the addres book page.
   */


  /**
   * @feature Magento 2 Delete Address from account
   * @scenario User removes an address from their account
   * @given I am logged in
   *  @and I am on the account dashboard page
   * @when I go to the page where I can see my address(es)
   * @when I click the trash button for the address I want to delete
   *   @and I click the confirmation button
   * @then I should see a notification my address has been deleted. 
   *  @and The address should be removed from the overview.
   */
});



// TODO: Add tests to check address can't be added/updated if the supplied information is incorrect
// TODO: Add tests to check address can't be deleted if it's the last/only one.