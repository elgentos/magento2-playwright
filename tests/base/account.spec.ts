import {test, expect} from '@playwright/test';
import {faker} from '@faker-js/faker';
import {productTest} from './fixtures/fixtures';

import {LoginPage} from './poms/login.page';
import {RegisterPage} from './poms/register.page';
import {AccountPage} from './poms/account.page';
import {NewsletterSubscriptionPage} from './poms/newsletter.page';

import slugs from './config/slugs.json';
import UIReference from './config/element-identifiers/element-identifiers.json';

test.describe('Address actions', () => {
  /**
   * @feature Add First Address to Account
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
  productTest('Add_the_first_address', {tag: ['@address']}, async ({userPage}, testInfo) => {
    const accountPage = new AccountPage(userPage.page);
    await userPage.page.goto(slugs.account.accountOverviewSlug);

    let defaultBillingAddressSet = userPage.page.getByText(UIReference.accountDashboard.defaultAddressNotSetLabel);

    if(await defaultBillingAddressSet.isVisible()) {
      // No default address set, so no address has been added yet.
      await userPage.page.goto(slugs.account.addressNewSlug);
      await accountPage.addNewAddress();
    } else {
      testInfo.annotations.push({ type: 'Test skipped', description: `A default address has been set, adding a first address has already been done.`});
      test.skip(true,'Default billing address found.');
    }
  });

  /**
   * @feature Add another address
   * @given I am logged in
   *  @and I am on the account dashboard page
   * @when I go to the page where I can add another address
   * @when I fill in the required information
   *   @and I click the save button
   * @then I should see a notification my address has been updated.
   *  @and The new address should be listed
   */
  productTest('Add_another_address', {tag: ['@address']}, async ({userPage}) => {
    await userPage.page.goto(slugs.account.addressNewSlug);
    const accountPage = new AccountPage(userPage.page);
    
    await accountPage.addNewAddress();
  });

  /**
   * @feature Update Address in Account
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
  productTest('Update_existing_address', {tag: ['@address']}, async ({userPage}) => {
    const accountPage = new AccountPage(userPage.page);
    await userPage.page.goto(slugs.account.addressBookSlug);
    let editAddressButton = userPage.page.getByRole('link', {name: UIReference.accountDashboard.editAddressIconButton}).first();
    if(await editAddressButton.isHidden()){
      // The edit address button was not found, add another address first.
      await accountPage.addNewAddress();
    }
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
  productTest('Delete_existing_address', {tag: ['@address']}, async ({userPage}) => {
    const accountPage = new AccountPage(userPage.page);
    await userPage.page.goto(slugs.account.addressBookSlug);
    let deleteAddressButton = userPage.page.getByRole('link', {name: UIReference.accountDashboard.addressDeleteIconButton}).first();
    if(await deleteAddressButton.isHidden()) {
      await userPage.page.goto(slugs.account.addressNewSlug);
      await accountPage.addNewAddress();
    }
    await accountPage.deleteFirstAddressFromAddressBook();
  });
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
test('Password_change',{ tag: '@password',}, async ({page, browserName}, testInfo) => {
  // Create instances and set variables
  const registerPage = new RegisterPage(page);
  const accountPage = new AccountPage(page);
  const loginPage = new LoginPage(page);
  const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
  let emailInputValue = `passwordupdate-${browserEngine}@example.com`;
  let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;
  let changedPasswordValue = process.env.MAGENTO_EXISTING_ACCOUNT_CHANGED_PASSWORD;

  if(!changedPasswordValue || !passwordInputValue) {
    throw new Error("Changed password or original password in your .env file is not defined or could not be read.");
  }

  await test.step('Create a throwaway account', async () =>{
    await registerPage.createNewAccount(faker.person.firstName(), faker.person.lastName(), emailInputValue, passwordInputValue);
  });

  await test.step('Update the password', async () =>{
    await page.goto(slugs.account.changePasswordSlug);
    await page.waitForLoadState();
    await accountPage.updatePassword(passwordInputValue, changedPasswordValue);
  });

  await test.step('Login with updated password', async () =>{
    await loginPage.login(emailInputValue, changedPasswordValue);
    await loginPage.logout();
  });

});

/**
 * @feature Newsletter subscriptions
 * @scenario User (un)subscribes from a newsletter
 * @given I am logged in
 *  @and I am on the account dashboard page
 * @when I click on the newsletter link in the sidebar
 *  @then I should navigate to the newsletter subscription page
 * @when I (un)check the subscription button
 *  @then I should see a message confirming my action
 *  @and My subscription option should be updated.
 */
productTest('Update_newsletter_subscription', {tag: ['@newsletter']}, async ({userPage, browserName}) => {
  test.skip(browserName === 'webkit', '.click() does not work, will be fixed later');
  const newsLetterPage = new NewsletterSubscriptionPage(userPage.page);
  await newsLetterPage.page.goto(slugs.account.newsLetterSlug);

  await newsLetterPage.updateNewsletterSubscription();
});