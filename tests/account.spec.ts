// @ts-check

import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { UIReference, outcomeMarker, slugs, inputValues} from '@config';
import { requireEnv } from '@utils/env.utils';

import AccountPage from '@poms/frontend/account.page';
import LoginPage from '@poms/frontend/login.page';
import MainMenuPage from '@poms/frontend/mainmenu.page';
import NewsletterSubscriptionPage from '@poms/frontend/newsletter.page';
import RegisterPage from '@poms/frontend/register.page';

// Before each test, log in
test.beforeEach(async ({ page, browserName }) => {
  const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
  const emailInputValue = requireEnv(`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`);
  const passwordInputValue = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');

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
  test('Change_password',{ tag: ['@account-credentials', '@hot'] }, async ({page, browserName}, testInfo) => {

    // Create instances and set variables
    const mainMenu = new MainMenuPage(page);
    const registerPage = new RegisterPage(page);
    const accountPage = new AccountPage(page);
    const loginPage = new LoginPage(page);

    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    let randomNumberforEmail = Math.floor(Math.random() * 101);
    let emailPasswordUpdatevalue = `passwordupdate-${randomNumberforEmail}-${browserEngine}@example.com`;
    let passwordInputValue = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');
    let changedPasswordValue = requireEnv('MAGENTO_EXISTING_ACCOUNT_CHANGED_PASSWORD');

    // Log out of current account
    if(await page.getByRole('link', { name: UIReference.mainMenu.myAccountLogoutItem }).isVisible()){
      await mainMenu.logout();
    }

    // Create account

    await registerPage.createNewAccount(faker.person.firstName(), faker.person.lastName(), emailPasswordUpdatevalue, passwordInputValue);

    // Update password
    await page.goto(slugs.account.changePasswordSlug);
    await page.waitForLoadState();
    await accountPage.updatePassword(passwordInputValue, changedPasswordValue);

    // If login with changePasswordValue is possible, then password change was succesful.
    await loginPage.login(emailPasswordUpdatevalue, changedPasswordValue);

    // Logout again, login with original account
    await mainMenu.logout();
    const emailInputValue = requireEnv(`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`);
    await loginPage.login(emailInputValue, passwordInputValue);
  });

  /**
   * @feature Magento 2 Update E-mail Address
   * @scenario User updates their e-mail address
   * @given I am logged in
   * @and I am on the Account Dashboard page
   * @when I navigate to the Account Information page
   * @and I fill in a new e-mail address and my current password
   * @and I click Save
   * @then I should see a notification that my account has been updated
   * @and I should be able to login with my new e-mail address.
   */
  test('Update_my_e-mail_address',{ tag: ['@account-credentials', '@hot'] }, async ({page, browserName}) => {
    const mainMenu = new MainMenuPage(page);
    const registerPage = new RegisterPage(page);
    const accountPage = new AccountPage(page);
    const loginPage = new LoginPage(page);

    const browserEngine = browserName?.toUpperCase() || 'UNKNOWN';
    let randomNumberforEmail = Math.floor(Math.random() * 101);
    let originalEmail = `emailupdate-${randomNumberforEmail}-${browserEngine}@example.com`;
    let updatedEmail = `updated-${randomNumberforEmail}-${browserEngine}@example.com`;
    let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

    if(await page.getByRole('link', { name: UIReference.mainMenu.myAccountLogoutItem }).isVisible()) {
      await mainMenu.logout();
    }

    if(!passwordInputValue) {
      throw new Error('MAGENTO_EXISTING_ACCOUNT_PASSWORD in your .env file is not defined or could not be read.');
    }

    await registerPage.createNewAccount(faker.person.firstName(), faker.person.lastName(), originalEmail, passwordInputValue);

    await page.goto(slugs.account.accountEditSlug);
    await page.waitForLoadState();
    await accountPage.updateEmail(passwordInputValue, updatedEmail);

    await mainMenu.logout();
    await loginPage.login(updatedEmail, passwordInputValue);

    await mainMenu.logout();
    let emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
    if(!emailInputValue) {
      throw new Error(`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn't been created yet.`);
    }
    await loginPage.login(emailInputValue, passwordInputValue);
  });
});

test.describe.serial('Account address book actions', { annotation: {type: 'Account Dashboard', description: 'Tests for the Address Book'},}, () => {

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

  test('Add_first_address',{ tag: ['@account-credentials', '@hot'] }, async ({page}, testInfo) => {
    const accountPage = new AccountPage(page);
    let addNewAddressTitle = page.getByRole('heading', {level: 1, name: UIReference.newAddress.addNewAddressTitle});

    if(await addNewAddressTitle.isHidden()) {
      await accountPage.deleteAllAddresses();
      testInfo.annotations.push({ type: 'Notification: deleted addresses', description: `All addresses are deleted to recreate the first address flow.` });
      await page.goto(slugs.account.addressNewSlug);
    }

    const firstAddress = inputValues.firstAddress;
    const streetValue = firstAddress.firstStreetAddressValue + ' ' + Math.floor(Math.random() * 100 + 1);
    const companyName = faker.company.name();
    await accountPage.addNewAddress({
      company: companyName,
      phone: firstAddress.firstPhoneNumberValue,
      street: streetValue,
      zip: firstAddress.firstZipCodeValue,
      city: firstAddress.firstCityValue,
      state: firstAddress.firstProvinceValue,
      country: firstAddress.firstNonDefaultCountry,
    });

    await expect(page.getByText(companyName)).toBeVisible();
    await expect(page.getByText(streetValue)).toBeVisible();
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
  test('Add_another_address',{ tag: ['@account-credentials', '@hot'] }, async ({page}) => {
    await page.goto(slugs.account.addressNewSlug);
    const accountPage = new AccountPage(page);

    const secondAddress = inputValues.secondAddress;
    const companyName = faker.company.name();
    const streetValue = secondAddress.secondStreetAddressValue + ' ' + Math.floor(Math.random() * 100 + 1);
    await accountPage.addNewAddress({
      company: companyName,
      phone: secondAddress.secondPhoneNumberValue,
      street: streetValue,
      zip: secondAddress.secondZipCodeValue,
      city: secondAddress.secondCityValue,
      state: secondAddress.secondProvinceValue,
      country: secondAddress.secondNonDefaultCountry,
    });

    await expect(page.getByText(companyName)).toBeVisible();
    await expect(page.getByText(streetValue)).toBeVisible();
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
  test('Edit_existing_address',{ tag: ['@account-credentials', '@hot'] }, async ({page}) => {
    const accountPage = new AccountPage(page);
    await page.goto(slugs.account.addressNewSlug);
    let editAddressButton = page.getByRole('link', {name: UIReference.accountDashboard.editAddressIconButton}).first();

    if(await editAddressButton.isHidden()){
      // The edit address button was not found, add another address first.
      await accountPage.addNewAddress();
    }

    await page.goto(slugs.account.addressBookSlug);
    const editAddress = inputValues.editedAddress;
    const companyName = faker.company.name();
    const streetValue = editAddress.editStreetAddressValue + ' ' + Math.floor(Math.random() * 100 + 1);
    await accountPage.editExistingAddress({
      firstName: editAddress.editfirstNameValue,
      lastName: editAddress.editLastNameValue,
      company: companyName,
      street: streetValue,
      zip: editAddress.editZipCodeValue,
      city: editAddress.editCityValue,
      state: editAddress.editStateValue,
      });

    await expect(page.getByText(companyName)).toBeVisible();
    await expect(page.getByText(streetValue)).toBeVisible();
  });

  test('Missing_required_field_prevents_creation',{ tag: ['@account-credentials'] }, async ({page}) => {
    await page.goto(slugs.account.addressNewSlug);
    const accountPage = new AccountPage(page);

    await accountPage.phoneNumberField.fill(inputValues.firstAddress.firstPhoneNumberValue);
    await accountPage.saveAddressButton.click();

    const errorMessage = page.getByText(UIReference.general.errorMessageRequiredFieldText).first();
    await errorMessage.waitFor();
    await expect(errorMessage).toBeVisible();
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
  test('Delete_an_address',{ tag: ['@account-credentials', '@hot'] }, async ({page}, testInfo) => {
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
  test('Update_newsletter_subscription',{ tag: ['@newsletter-actions', '@cold'] }, async ({page, browserName}) => {
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
