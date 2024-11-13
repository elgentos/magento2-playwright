import {test, expect, selectors} from '@playwright/test';
import {PageTester} from './utils/PageTester';
import {Contact} from './utils/Contact';
import slugs from './fixtures/before/slugs.json';
import contactSelector from './fixtures/during/selectors/contact.json';
import globalSelector from './fixtures/during/selectors/global.json';
import contactValue from './fixtures/during/input-values/contact.json';
import accountExpected from './fixtures/verify/expects/contact.json';


test.describe('Test contact actions', () => {

  /**
   * @feature Magento 2 Contact Form
   *  @scenario User sends a filled in contact form
   *    @given I am on any Magento 2 page
   *    @when I'm logged in
   *    @then the name and email fields are already filled in
   *    @when I fill in the (remaining) required fields
   *    @and I click the 'Submit' button
   *    @then I should see a notification to confirm my message has been sent.
   */
  test('Send contactform', async ({page}) => {
    const randomNumber = Math.floor(Math.random() * 10000000);
    const emailHandle = contactValue.contactEmailHandle;
    const emailHost = contactValue.contactEmailHost;
    const uniqueEmail = `${emailHandle}${randomNumber}@${emailHost}`;

    await page.goto(slugs.contactSlug);

    await page.fill(contactSelector.contactNameSelector, contactValue.contactName);
    await page.fill(contactSelector.contactEmailSelector, uniqueEmail);
    await page.fill(contactSelector.contactTelephoneSelector, contactValue.contactTelephoneNumber);
    await page.fill(contactSelector.contactCommentSelector, contactValue.contactComment);

    await page.click(contactSelector.contactButtonSelectorName);

    const contactFormSuccessNotificationText = accountExpected.contactFormSuccessNotificationText;
    await expect(page.locator(`text=${contactFormSuccessNotificationText}`)).toBeVisible();

    console.log(`Contact form submitted by email address "${uniqueEmail}"`);
  });
});
