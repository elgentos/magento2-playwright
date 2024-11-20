import {test, expect, selectors} from '@playwright/test';
import {PageTester} from './utils/PageTester';
import {Account} from './utils/Account';
import {Order} from './utils/Order';

import toggle from './config/test-toggles.json';
import slugs from './fixtures/before/slugs.json';
import accountSelector from './fixtures/during/selectors/account.json';
import globalSelector from './fixtures/during/selectors/global.json';
import accountValue from './fixtures/during/input-values/account.json';
import accountExpected from './fixtures/verify/expects/account.json';
import { todo } from 'node:test';

test.describe('Test user account actions', () => {
  const existingAccountEmail = process.env.MAGENTO_EXISTING_ACCOUNT_EMAIL;
  const existingAccountPassword = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;
  const existingAccountChangedPassword = process.env.MAGENTO_EXISTING_ACCOUNT_CHANGED_PASSWORD;

  /**
   * @feature Magento 2 Account Creation
   *  @scenario User creates an account on the website
   *    @given I am on any Magento 2 page
   *    @when I go to the account creation page
   *    @and I fill in the required information
   *    @and I click the 'Create an account' button
   *    @then I should see a message to confirm my account was created
   */
  if (toggle.account.testAccountCreation) {
    test('Create an account', async ({page}) => {
      const randomNumber = Math.floor(Math.random() * 10000000);
      const emailHandle = accountValue.newAccountEmailHandle;
      const emailHost = accountValue.newAccountEmailHost;
      const uniqueEmail = `${emailHandle}${randomNumber}@${emailHost}`;

      await page.goto(slugs.accountCreationSlug);

      await page.fill(accountSelector.registrationFirstNameSelector, accountValue.newAccountFirstName);
      await page.fill(accountSelector.registrationLastNameSelector, accountValue.newAccountLastName);
      await page.fill(accountSelector.registrationEmailAddressSelector, uniqueEmail);
      await page.fill(accountSelector.registrationPasswordSelector, existingAccountPassword);
      await page.fill(accountSelector.registrationConfirmPasswordSelector, existingAccountPassword);

      await page.click(accountSelector.registrationCreateAccountButtonSelector);

      const uniqueSuccessfulAccountCreationNotificationText = accountExpected.uniqueSuccessfulAccountCreationNotificationText;
      await expect(page.locator(`text=${uniqueSuccessfulAccountCreationNotificationText}`)).toBeVisible();

      console.log(`Account created with credentials: email address "${uniqueEmail}" and password "${existingAccountPassword}"`);
    });
  }

  /**
   * @feature Magento 2 Login
   *  @scenario User logs in on the Magento 2 web shop
   *    @given I am on any Magento 2 page
   *    @when I go to the login page
   *    @and I fill in the required information
   *    @and I click the 'Sign in' button
   *    @then I should see a confirmation message with my e-mail in this text.
   */
  if (toggle.account.testAccountLogin) {
    test('Login with an account', async ({page}) => {
      const account = new Account(page);
      await account.login(existingAccountEmail, existingAccountPassword);

      const accountPageTester = new PageTester(page, page.url());
      await accountPageTester.testPage();
      await expect(page.locator(`text=${existingAccountEmail}`)).toBeVisible();
    });
  }

  /**
   * @feature Magento 2 Add an Address to Account
   *  @scenario User adds an address to their account
   *    @given I am logged in
   *    @when I go to the page where I can update my address
   *    @and I fill in the required information
   *    @and I click the 'Save' button
   *    @then My address should be added
   *    @and I should see a notification my address has been updated.
   */
  test('Add new address on account', async ({page}) => {
    const account = new Account(page);
    await account.login(existingAccountEmail, existingAccountPassword);
    await account.addAddress();

    const accountPageTester = new PageTester(page, page.url());
    await accountPageTester.testPage();
  });

  /**
   * @feature Magento 2 Update Address on Account
   *  @scenario User updates their address in their account
   *    @given I am logged in
   *    @when I go to the page where I can update my address
   *    @and I fill in the required information
   *    @and I click the 'Save' button
   *    @then My address should be updated
   *    @and I should see a notification my address has been updated.
   */
  test('Edit address on account', async ({page}) => {
    const account = new Account(page);
    await account.login(existingAccountEmail, existingAccountPassword)

    await page.goto(slugs.accountAddressBookSlug);
    await page.locator(accountSelector.accountEditAddressButtons).first().click();
    await page.fill(accountSelector.registrationFirstNameSelector, accountValue.newChangedAddressFirstName);
    await page.fill(accountSelector.registrationLastNameSelector, accountValue.newChangedAddressLastName);
    await page.fill(accountSelector.accountTelephoneSelector, accountValue.newAddressTelephoneNumber);
    await page.fill(accountSelector.accountStreetAddressSelector, accountValue.newAddressStreetAddress);
    await page.fill(accountSelector.accountZipSelector, accountValue.newAddressZipCode);
    await page.fill(accountSelector.accountCitySelector, accountValue.newAddressCityName);
    await page.click(accountSelector.accountAddressSaveButtonSelector);

    await expect(page.locator(`text=${accountExpected.accountAddressChangedNotificationText}`)).toBeVisible();

    const accountPageTester = new PageTester(page, page.url());
    await accountPageTester.testPage();
  });

  /**
   * @feature Magento 2 (Un)subscribe to newsletter
   *  @scenario User subscribes from a newsletter
   *    @given I am logged in
   *    @when I go to the page where I can update my newsletter subscription settings
   *    @and I click the checkbox to subscribe
   *    @and I click the 'Save' button
   *    @then I should see a notification that I am now subscribed.
   *
   *   @scenario User unsubscribes from a newsletter
   *    @given I am logged in
   *    @when I go to the page where I can update my newsletter subscription settings
   *    @and I click the checkbox to unsubscribe
   *    @and I click the 'Save' button
   *    @then I should see a notification that I am now unsubscribed.
   */
  test('Subscribe and unsubscribe to newsletter', async ({page}) => {
    const account = new Account(page);
    await account.login(existingAccountEmail, existingAccountPassword);

    await page.goto(slugs.accountNewsletterSubscriptionsSlug);

    const subscriptionCheckBox = page.locator(accountSelector.subscriptionCheckBoxSelector);

    // Update subscription
    await page.click(accountSelector.subscriptionCheckBoxSelector);
    
    
    if(await subscriptionCheckBox.isChecked()){
      // User is going to subscribe.
      await page.click(accountSelector.accountSaveButtonSelector);
      await expect(page.locator(`text=${accountExpected.accountNewsletterSubscribedNotificationText}`)).toBeVisible();

    } else {
      // User will unsubscribe.
      await page.click(accountSelector.accountSaveButtonSelector);
      await expect(page.locator(`text=${accountExpected.accountNewsletterUnsubscribedNotificationText}`)).toBeVisible();
    }

    const accountPageTester = new PageTester(page, page.url());
    await accountPageTester.testPage();
  });

  /**
   * @feature Magento 2 Page Title Checking
   *  @scenario User navigates to a variety of pages related to their account
   *    @given I am logged in
   *    @when I go navigate to a specified page
   *    @then The page URL should match the specified URL
   *    @and The page title should match the specified page title.
   */
  if (toggle.account.testAccountPageTitles.all) {
    test('Test page titles and meta titles', async ({page}) => {
      const account = new Account(page);
      await account.login(existingAccountEmail, existingAccountPassword);

      const accountPageTester = new PageTester(page, page.url());
      await accountPageTester.testPage();

      // Test Account Information Page
      await page.goto(slugs.accountChangeInformationSlug);
      await expect(page).toHaveURL(new RegExp(`${slugs.accountChangeInformationSlug}.*`));
      await expect(page.locator(globalSelector.mainColumn)).toContainText(accountExpected.accountAccountInformationPageTitle);

      const accountInformationPageTester = new PageTester(page, page.url());
      await accountInformationPageTester.testPage();

      // Test Address Book Page
      await page.goto(slugs.accountAddressBookSlug);
      await expect(page).toHaveURL(new RegExp(`${slugs.accountAddressBookSlug}.*`));
      await expect(page.locator(globalSelector.mainColumn)).toContainText(accountExpected.accountAddressBookPageTitle);

      const addressBookPageTester = new PageTester(page, page.url());
      await addressBookPageTester.testPage();

      // Test Order History Page
      await page.goto(slugs.accountOrderHistorySlug);
      await expect(page).toHaveURL(new RegExp(`${slugs.accountOrderHistorySlug}.*`));
      await expect(page.locator(globalSelector.mainColumn)).toContainText(accountExpected.accountMyOrdersPageTitle);

      const orderHistoryPageTester = new PageTester(page, page.url());
      await orderHistoryPageTester.testPage();

      // Test Downloads Page
      await page.goto(slugs.accountDownloadsSlug);
      await expect(page).toHaveURL(new RegExp(`${slugs.accountDownloadsSlug}.*`));
      await expect(page.locator(globalSelector.mainColumn)).toContainText(accountExpected.accountDownloadsPageTitle);

      const downloadsPageTester = new PageTester(page, page.url());
      await downloadsPageTester.testPage();

      // Test Wishlist Page
      await page.goto(slugs.accountWishlistSlug);
      await expect(page).toHaveURL(new RegExp(`${slugs.accountWishlistSlug}.*`));
      await expect(page.locator(globalSelector.mainColumn)).toContainText(accountExpected.acccountMyWishlistPageTitle);

      const wishlistPageTester = new PageTester(page, page.url());
      await wishlistPageTester.testPage();

      // Test Saved Payment Methods Page
      await page.goto(slugs.accountSavedPaymentMethodsSlug);
      await expect(page).toHaveURL(new RegExp(`${slugs.accountSavedPaymentMethodsSlug}.*`));
      await expect(page.locator(globalSelector.mainColumn)).toContainText(accountExpected.accountSavedPaymentMethodsPageTitle);

      const savedPaymentMethodsPageTester = new PageTester(page, page.url());
      await savedPaymentMethodsPageTester.testPage();

      if (toggle.account.testAccountPageTitles.ProductReviewsTest) {
        // Test Product Reviews Page
        await page.goto(slugs.accountReviewsSlug);
        await expect(page).toHaveURL(new RegExp(`${slugs.accountReviewsSlug}.*`));
        await expect(page.locator(globalSelector.mainColumn)).toContainText(accountExpected.accountProductReviewsPageTitle);

        const productReviewsPageTester = new PageTester(page, page.url());
        await productReviewsPageTester.testPage();
      }

      // Test Newsletter Subscriptions Page
      await page.goto(slugs.accountNewsletterSubscriptionsSlug);
      await expect(page).toHaveURL(new RegExp(`${slugs.accountNewsletterSubscriptionsSlug}.*`));
      await expect(page.locator(globalSelector.mainColumn)).toContainText(accountExpected.accountNewsletterSubscriptionsPageTitle);

      const newsletterSubscriptionsPageTester = new PageTester(page, page.url());
      await newsletterSubscriptionsPageTester.testPage();
    });
  }

  /**
   * @feature Magento 2 Update First Name and Last Name
   *  @scenario User updates their name details
   *    @given I am logged in
   *    @when I navigate to the page where I can edit my first name and last name, or only my first name
   *    @and I update the fields I wish to update (both fields)
   *    @and I click the 'Save' button
   *    @then My updated information should be saved
   *    @and I should see a notification that my details have been updated.
   */
  test('Update firstname and lastname on account, check combinations', async ({page}) => {
    const account = new Account(page);
    await account.login(existingAccountEmail, existingAccountPassword);

    await page.goto(slugs.accountEditSlug);
    await page.fill(accountSelector.registrationFirstNameSelector, accountValue.newAccountLastName);
    await page.fill(accountSelector.registrationLastNameSelector, accountValue.newAccountFirstName);
    await page.click(accountSelector.accountSaveButtonSelector);
    await expect(page.locator(`text=${accountExpected.accountInformationUpdatedNotificationText}`)).toBeVisible();

    await page.goto(slugs.accountEditSlug);
    await page.fill(accountSelector.registrationFirstNameSelector, accountValue.newAccountFirstName);
    await page.click(accountSelector.accountSaveButtonSelector);
    await expect(page.locator(`text=${accountExpected.accountInformationUpdatedNotificationText}`)).toBeVisible();

    const accountPageTester = new PageTester(page, page.url());
    await accountPageTester.testPage();
  });

  /**
   * @feature Magento 2 Delete Address
   *  @scenario User removes one of their addresses
   *    @given I am logged in
   *    @when I navigate to the page where I can delete one of my addresses
   *    @and I click the trash button for the address I want to delete
   *    @and I click the confirmation button
   *    @then the specified address should be removed from the overview.
   */
  test('Delete address on account', async ({page}) => {
    const account = new Account(page);
    await account.login(existingAccountEmail, existingAccountPassword);
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'confirm') {
        await dialog.accept();
      }
    });

    await page.goto(slugs.accountAddressBookSlug);
    
    const addressTrashButton = page.locator(accountSelector.accountDeleteAddressButtons);
    
    // If trash button is visible, there are multiple addresses.
    if(await addressTrashButton.isVisible()){
      await addressTrashButton.first().click();
      // await page.waitForTimeout(2000);
      await expect(page.locator(`text=${accountExpected.accountAddressDeletedNotificationText}`)).toBeVisible();
    } else {
      console.log("Notice for test \"Delete address on account\": less than 2 addresses available, deleting an address is not possible.");
      test.skip();
    }
    

    const accountPageTester = new PageTester(page, page.url());
    await accountPageTester.testPage();
    
  });

  /**
   * @feature Magento 2 Change Password
   *  @scenario User updates the password for their account
   *    @given I am logged in
   *    @when I navigate to my account information on the account information page
   *    @and I check the 'Change password' button
   *    @and I fill in the required fields
   *    @and I click the 'Save' button
   *    @then I should see a notification that my password has been updated.
   */
  if (toggle.account.testAccountPasswordChange) {
    test('Change password for account', async ({page}) => {
      // Change password
      const changePassword = async (currentPassword: string, newPassword: string) => {
        await page.goto(slugs.changePasswordSlug);
        await page.click(accountSelector.changePasswordLabel);
        await page.fill(accountSelector.currentPasswordFieldSelector, currentPassword);
        await page.fill(accountSelector.registrationPasswordSelector, newPassword);
        await page.fill(accountSelector.registrationConfirmPasswordSelector, newPassword);
        await page.click(accountSelector.accountSaveButtonSelector);
        await expect(page.locator(`text=${accountExpected.accountInformationUpdatedNotificationText}`)).toBeVisible();
      };

      const account = new Account(page);
      await account.login(existingAccountEmail, existingAccountChangedPassword);
      await changePassword(existingAccountPassword, existingAccountChangedPassword);

      await account.login(existingAccountEmail, existingAccountChangedPassword);
      await changePassword(existingAccountChangedPassword, existingAccountPassword);

      const accountPageTester = new PageTester(page, page.url());
      await accountPageTester.testPage();
    });
  }

  /**
   * @feature Magento 2 See order history
   *  @scenario User places an order and sees them in their order history
   *    @given I am logged in
   *    @when I place an order
   *    @then I should see my order in my order history
   */
  if (toggle.account.testAccountOrders) {
    test('Check order history for orders', async ({page}) => {
      const order = new Order(page);
      await order.create();

      await expect(page.locator('.checkout-success .order-number')).toBeVisible();
      const orderID = await page.locator('.checkout-success .order-number strong').innerText();
      await page.goto(slugs.orderGridSlug);
      await expect(page.locator(`text=${orderID}`)).toBeVisible();
    });
  }

  /**
   * @feature Magento 2 Logout
   *  @scenario User logs out
   *    @given I am logged in
   *    @when I click on a button to log out
   *    @then I should see a page that confirms I am logged out
   */
  test('Logout with an account', async ({page}) => {
    const account = new Account(page);
    await account.login(existingAccountEmail, existingAccountPassword);

    await account.logout();
    const accountPageTester = new PageTester(page, page.url())
    await accountPageTester.testPage();
  });
});
