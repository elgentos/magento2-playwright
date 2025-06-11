import {test, expect} from '@playwright/test';
import {MainMenuPage} from './fixtures/mainmenu.page';
import {LoginPage} from './fixtures/login.page';
import {RegisterPage} from './fixtures/register.page';
import {AccountPage} from './fixtures/account.page';
import {NewsletterSubscriptionPage} from './fixtures/newsletter.page';
import {faker} from '@faker-js/faker';

import slugs from './config/slugs.json';
import UIReference from './config/element-identifiers/element-identifiers.json';
import outcomeMarker from './config/outcome-markers/outcome-markers.json';

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
  test('I can change my password',{ tag: ['@account-credentials', '@hot'] }, async ({page, browserName}, testInfo) => {

    // Create instances and set variables
    const mainMenu = new MainMenuPage(page);
    const registerPage = new RegisterPage(page);
    const accountPage = new AccountPage(page);
    const loginPage = new LoginPage(page);

    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    let randomNumberforEmail = Math.floor(Math.random() * 101);
    let emailPasswordUpdatevalue = `passwordupdate-${randomNumberforEmail}-${browserEngine}@example.com`;
    let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;
    let changedPasswordValue = process.env.MAGENTO_EXISTING_ACCOUNT_CHANGED_PASSWORD;

    // Log out of current account
    if(await page.getByRole('link', { name: UIReference.mainMenu.myAccountLogoutItem }).isVisible()){
      await mainMenu.logout();
    }

    // Create account
    if(!changedPasswordValue || !passwordInputValue) {
      throw new Error("Changed password or original password in your .env file is not defined or could not be read.");
    }

    await registerPage.createNewAccount(faker.person.firstName(), faker.person.lastName(), emailPasswordUpdatevalue, passwordInputValue);

    // Update password
    await page.goto(slugs.account.changePasswordSlug);
    await page.waitForLoadState();
    await accountPage.updatePassword(passwordInputValue, changedPasswordValue);

    // If login with changePasswordValue is possible, then password change was succesful.
    await loginPage.login(emailPasswordUpdatevalue, changedPasswordValue);

    // Logout again, login with original account
    await mainMenu.logout();
    let emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
    if(!emailInputValue) {
      throw new Error("MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn't been created yet.");
    }
    await loginPage.login(emailInputValue, passwordInputValue);
  });
});

test.describe.serial('Account address book actions', { annotation: {type: 'Account Dashboard', description: 'Tests for the Address Book'},}, () => {
  test.beforeEach(async ({page}) => {
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

  test('I can add my first address',{ tag: ['@account-credentials', '@hot'] }, async ({page}, testInfo) => {
    const accountPage = new AccountPage(page);
    let addNewAddressTitle = page.getByRole('heading', {level: 1, name: UIReference.newAddress.addNewAddressTitle});

    if(await addNewAddressTitle.isHidden()) {
      await accountPage.deleteAllAddresses();
      testInfo.annotations.push({ type: 'Notification: deleted addresses', description: `All addresses are deleted to recreate the first address flow.` });
      await page.goto(slugs.account.addressNewSlug);
    }

    await accountPage.addNewAddress();
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
  test('I can add another address',{ tag: ['@account-credentials', '@hot'] }, async ({page}) => {
    await page.goto(slugs.account.addressNewSlug);
    const accountPage = new AccountPage(page);

    await accountPage.addNewAddress();
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
  test('I can edit an existing address',{ tag: ['@account-credentials', '@hot'] }, async ({page}) => {
    const accountPage = new AccountPage(page);
    await page.goto(slugs.account.addressNewSlug);
    let editAddressButton = page.getByRole('link', {name: UIReference.accountDashboard.editAddressIconButton}).first();

    if(await editAddressButton.isHidden()){
      // The edit address button was not found, add another address first.
      await accountPage.addNewAddress();
    }

    await page.goto(slugs.account.addressBookSlug);
    await accountPage.editExistingAddress();
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
  test('I can delete an address',{ tag: ['@account-credentials', '@hot'] }, async ({page}, testInfo) => {
    const accountPage = new AccountPage(page);

    let deleteAddressButton = page.getByRole('link', {name: UIReference.accountDashboard.addressDeleteIconButton}).first();

    if(await deleteAddressButton.isHidden()) {
      await page.goto(slugs.account.addressNewSlug);
      await accountPage.addNewAddress();
    }
    await accountPage.deleteFirstAddressFromAddressBook();
  });
});

test.describe('Newsletter actions', { annotation: {type: 'Account Dashboard', description: 'Newsletter tests'},}, () => {
  test.beforeEach(async ({page}) => {
    await page.goto(slugs.account.accountOverviewSlug);
  });

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
  test('I can update my newsletter subscription',{ tag: ['@newsletter-actions', '@cold'] }, async ({page, browserName}) => {
    test.skip(browserName === 'webkit', '.click() does not work, still searching for a workaround');
    const newsletterPage = new NewsletterSubscriptionPage(page);
    let newsletterLink = page.getByRole('link', { name: UIReference.accountDashboard.links.newsletterLink });
    const newsletterCheckElement = page.getByLabel(UIReference.newsletterSubscriptions.generalSubscriptionCheckLabel);

    await newsletterLink.click();
    await expect(page.getByText(outcomeMarker.account.newsletterSubscriptionTitle, { exact: true })).toBeVisible();

    let updateSubscription = await newsletterPage.updateNewsletterSubscription();

    await newsletterLink.click();

    if(updateSubscription){
      await expect(newsletterCheckElement).toBeChecked();
    } else {
      await expect(newsletterCheckElement).not.toBeChecked();
    }
  });
});
