import {test, expect} from '@playwright/test';
import { ContactPage } from './fixtures/contact.page';

import slugs from './config/slugs.json';
import inputvalues from './config/input-values/input-values.json';

/**
 * @feature Magento 2 Contact Form
 * @scenario User fills in the contact form and sends a message
 * @given I om any Magento 2 page
 * @when I navigate to the contact page
 *  @and I fill in the required fields
 * @when I click the button to send the form
 *  @then I should see a notification my message has been sent
 *  @and the fields should be empty again.
 */
test('I can send a message through the contact form',{ tag: '@contact-form',}, async ({page}) => {
  const contactPage = new ContactPage(page);
  let formName = inputvalues.accountCreation.firstNameValue;
  let formEmail = inputvalues.contact.contactFormEmailValue;
  let message = inputvalues.contact.contactFormMessage;

  await page.goto(slugs.contact);
  await contactPage.fillOutForm(formName,formEmail,message);
});