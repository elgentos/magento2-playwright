import {expect, type Locator, type Page} from '@playwright/test';
import {faker} from '@faker-js/faker';

import selectors from '../config/selectors/selectors.json';
import verify from '../config/expected/expected.json';
import slugs from '../config/slugs.json';

export class ContactPage {
  readonly page: Page;
  readonly nameField: Locator;
  readonly emailField: Locator;
  readonly messageField: Locator;
  readonly sendFormButton: Locator;

  constructor(page: Page){
    this.page = page;
    this.nameField = this.page.getByLabel(selectors.credentials.nameFieldLabel);
    this.emailField = this.page.getByLabel(selectors.credentials.emailFieldLabel, {exact: true});
    this.messageField = this.page.getByLabel(selectors.contactPage.messageFieldLabel);
    this.sendFormButton = this.page.getByRole('button', { name: selectors.general.genericSubmitButtonLabel });
  }

  async fillOutForm(){
    await this.page.goto(slugs.contact);
    let messageSentConfirmationText = verify.contactPage.messageSentConfirmationText;
    await this.nameField.fill(faker.person.firstName());
    await this.emailField.fill(faker.internet.email());
    await this.messageField.fill(faker.lorem.paragraph());
    await this.sendFormButton.click();
    
    await expect(this.page.getByText(messageSentConfirmationText)).toBeVisible();
    await expect(this.nameField, 'name should be empty now').toBeEmpty();
    await expect(this.emailField, 'email should be empty now').toBeEmpty();
    await expect(this.messageField, 'message should be empty now').toBeEmpty();
  }
}