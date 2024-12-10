import {expect, type Locator, type Page} from '@playwright/test';
import selectors from '../config/selectors/selectors.json';
import verify from '../config/expected/expected.json';

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

  async fillOutForm(name: string, email: string, message: string){
    let messageSentConfirmationText = verify.contactPage.messageSentConfirmationText;
    await this.nameField.fill(name);
    await this.emailField.fill(email);
    await this.messageField.fill(message);
    await this.sendFormButton.click();
    
    await expect(this.page.getByText(messageSentConfirmationText)).toBeVisible();
    await expect(this.nameField, 'name should be empty now').toBeEmpty();
    await expect(this.emailField, 'email should be empty now').toBeEmpty();
    await expect(this.messageField, 'message should be empty now').toBeEmpty();
  }
}