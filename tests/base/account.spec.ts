import {test, expect} from '@playwright/test';
import {LoginPage} from './fixtures/login.page';
import {AccountPage} from './fixtures/account.page';
import {NewsletterSubscriptionPage} from './fixtures/newsletter.page';

import slugs from './config/slugs.json';
import inputvalues from './config/input-values/input-values.json';
import selectors from './config/selectors/selectors.json';
import verify from './config/expected/expected.json';

// no resetting storageState, mainmenu has more functionalities when logged in.
// TODO: remove this beforeEach() once authentication as project set-up/fixture works.

// Before each test, log in
test.beforeEach(async ({ page, browserName }) => {
  const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
  let emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
  let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

  if(!emailInputValue || !passwordInputValue) {
    throw new Error("MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn't been created yet.");
  }

  const loginPage = new LoginPage(page);
  await loginPage.login(emailInputValue, passwordInputValue);
});

test.describe('Account information actions', {annotation: {type: 'Account Dashboard', description: 'Test for Account Information'},}, () => {

  test.beforeEach(async ({page}) => {
    await page.goto(slugs.account.accountOverviewSlug);
    await page.waitForLoadState();
  });

  // TODO: add test to update e-mail address

  /**
   * @feature Magento 2 Change Password
   * @scenario User changes their password
   * @given I am logged in
   * @and I am on the Account Dashboard page
   * @when I navigate to the Account Information page
   * @and I check the 'change password' option
   * @when I fill in the new credentials
   * @and I click Save
   * @then I should see a notification that my password has been updated
   * @and I should be able to login with my new credentials.
   */


  test.skip('I can change my password',{ tag: ['@account-credentials', '@password-change'], }, async ({page}) => {
    const accountPage = new AccountPage(page);
    let changedPasswordValue = process.env.MAGENTO_EXISTING_ACCOUNT_CHANGED_PASSWORD;
    let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

    if(!changedPasswordValue || !passwordInputValue) {
      throw new Error("Changed password or original password in your .env file is not defined or could not be read.");
    }

    // Navigate to Account Information, confirm by checking heading above sidebar
    const sidebarAccountInfoLink = page.getByRole('link', { name: 'Account Information' });
    sidebarAccountInfoLink.click();
    await expect(page.getByRole('heading', { name: 'Account Information' }).locator('span')).toBeVisible();

    await accountPage.updatePassword(passwordInputValue, changedPasswordValue);

  });
});


// TODO: Add tests to check address can't be added/updated if the supplied information is incorrect
// TODO: Add tests to check address can't be deleted if it's the last/only one.
test.describe('Account address book actions', { annotation: {type: 'Account Dashboard', description: 'Tests for the Address Book'},}, () => {
  test.beforeEach(async ({page}) => {
    // go to the Adress Book page
    await page.goto(slugs.account.addressBookSlug);
    await page.waitForLoadState();
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

  test('I can add my first address',{ tag: '@address-actions', }, async ({page}, testInfo) => {
    // If account has no address, Address Book redirects to the 'Add New Address' page.
    // We expect this to be true before continuing.
    let addNewAddressTitle = page.getByRole('heading', {level: 1, name: selectors.newAddress.addNewAddressTitle});
    testInfo.skip(await addNewAddressTitle.isHidden(), `Heading "Add New Addres" is not found, please check if an address has already been added.`);

    const accountPage = new AccountPage(page);

    let phoneNumberValue = inputvalues.firstAddress.firstPhoneNumberValue;
    let addressValue = inputvalues.firstAddress.firstStreetAddressValue;
    let zipCodeValue = inputvalues.firstAddress.firstZipCodeValue;
    let cityNameValue = inputvalues.firstAddress.firstCityValue;
    let stateValue = inputvalues.firstAddress.firstProvinceValue;

    await accountPage.addNewAddress(phoneNumberValue, addressValue, zipCodeValue, cityNameValue, stateValue);

  });

  /**
   * @given I am logged in
   *  @and I am on the account dashboard page
   * @when I go to the page where I can add another address
   * @when I fill in the required information
   *   @and I click the save button
   * @then I should see a notification my address has been updated.
   *  @and The new address should be listed
   */
  test('I can add another address',{ tag: '@address-actions', }, async ({page}) => {
    await page.goto(slugs.account.addressNewSlug);

    const accountPage = new AccountPage(page);

    let phoneNumberValue = inputvalues.secondAddress.secondPhoneNumberValue;
    let addressValue = inputvalues.secondAddress.secondStreetAddressValue;
    let zipCodeValue = inputvalues.secondAddress.secondZipCodeValue;
    let cityNameValue = inputvalues.secondAddress.secondCityValue;
    let stateValue = inputvalues.secondAddress.secondProvinceValue;

    await accountPage.addNewAddress(phoneNumberValue, addressValue, zipCodeValue, cityNameValue, stateValue);

  });

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
  test('I can edit an existing address',{ tag: '@address-actions', }, async ({page}, testInfo) => {
    const accountPage = new AccountPage(page);
    let newFirstName = inputvalues.editedAddress.editfirstNameValue;
    let newLastName = inputvalues.editedAddress.editLastNameValue;
    let newStreet = inputvalues.editedAddress.editStreetAddressValue;
    let newZipCode = inputvalues.editedAddress.editZipCodeValue;
    let newCity = inputvalues.editedAddress.editCityValue;
    let newState = inputvalues.editedAddress.editStateValue;

    let editAddressButton = page.getByRole('link', {name: selectors.accountDashboard.editAddressIconButton}).first();
    testInfo.skip(await editAddressButton.isHidden(), `Button to edit Address is not found, please check if an address has been added.`);

    await page.goto(slugs.account.addressBookSlug);
    await accountPage.editExistingAddress(newFirstName, newLastName, newStreet, newZipCode, newCity, newState);

  });

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
  test('I can delete an address',{ tag: '@address-actions', }, async ({page}, testInfo) => {
    const accountPage = new AccountPage(page);

    let deleteAddressButton = page.getByRole('link', {name: selectors.accountDashboard.addressDeleteIconButton}).first();
    testInfo.skip(await deleteAddressButton.isHidden(), `Button to delete Address is not found, please check if an address has been added.`);

    await accountPage.deleteFirstAddressFromAddressBook();
  });
});

// TODO: move this to new spec file.
test.describe('Newsletter actions', { annotation: {type: 'Account Dashboard', description: 'Newsletter tests'},}, () => {
  test.beforeEach(async ({page}) => {
    // go to the Dashboard page
    await page.goto(slugs.account.accountOverviewSlug);
  });

  // TODO: What if website offers multiple subscriptions?

  /**
   * @feature Magento 2 newsletter subscriptions
   * @scenario User (un)subscribes from a newsletter
   * @given I am logged in
   *  @and I am on the account dashboard page
   * @when I click on the newsletter link in the sidebar
   *  @then I should navigate to the newsletter subscription page
   * @when I (un)check the subscription button
   *  @then I should see a message confirming my action
   *  @and My subscription option should be updated.
   */
  test('I can update my newsletter subscription',{ tag: '@newsletter-actions', }, async ({page}) => {
    const newsletterPage = new NewsletterSubscriptionPage(page);
    let newsletterLink = page.getByRole('link', { name: selectors.accountDashboard.links.newsletterLink });
    const newsletterCheckElement = page.getByLabel(selectors.newsletterSubscriptions.generalSubscriptionCheckLabel);

    await newsletterLink.click();
    await expect(page.getByText(verify.account.newsletterSubscriptionTitle, { exact: true })).toBeVisible();

    let updateSubscription = await newsletterPage.updateNewsletterSubscription();

    await newsletterLink.click();

    if(updateSubscription){
      await expect(newsletterCheckElement).toBeChecked();
    } else {
      await expect(newsletterCheckElement).not.toBeChecked();
    }
  });

});

