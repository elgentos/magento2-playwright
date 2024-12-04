import {expect, type Locator, type Page} from '@playwright/test';

export class ContactPage {
  readonly page: Page;
  readonly nameField: Locator;
  readonly emailField: Locator;
  readonly messageField: Locator;
  readonly sendFormButton: Locator;

  constructor(page: Page){
    this.page = page;
    this.nameField = this.page.getByLabel('Name');
    this.emailField = this.page.getByLabel('Email', {exact: true});
    this.messageField = this.page.getByLabel('What’s on your mind?');
    this.sendFormButton = this.page.getByRole('button', { name: 'Submit' });
  }

  async fillOutForm(name: string, email: string, message: string){
    let messageSentConfirmationText = 'Thanks for contacting us with';
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