import {expect, type Locator, type Page} from '@playwright/test';

import slugs from '../config/slugs.json';
import selectors from '../config/selectors/selectors.json';
import inputvalues from '../config/input-values/input-values.json';
import expected from '../config/expected/expected.json';

export class RegisterPage {
  readonly page: Page;
  readonly accountCreationFirstNameField: Locator;
  readonly accountCreationLastNameField: Locator;
  readonly accountCreationEmailField: Locator;
  readonly accountCreationPasswordField: Locator;
  readonly accountCreationPasswordRepeatField: Locator;
  readonly accountCreationConfirmButton: Locator;

  constructor(page: Page){
    this.page = page;
    this.accountCreationFirstNameField = page.getByLabel(selectors.personalInformation.firstNameLabel);
    this.accountCreationLastNameField = page.getByLabel(selectors.personalInformation.lastNameLabel);
    this.accountCreationEmailField = page.getByLabel(selectors.credentials.emailFieldLabel, { exact: true});
    this.accountCreationPasswordField = page.getByLabel(selectors.credentials.passwordFieldLabel, { exact: true });
    this.accountCreationPasswordRepeatField = page.getByLabel(selectors.credentials.passwordConfirmFieldLabel);
    this.accountCreationConfirmButton = page.getByRole('button', {name: selectors.accountCreation.createAccountButtonLabel});
  }


  async createNewAccount(firstName: string, lastName: string, email: string, password: string){  
    await this.page.goto(slugs.account.createAccountSlug);

    await this.accountCreationFirstNameField.fill(firstName);
    await this.accountCreationLastNameField.fill(lastName);
    await this.accountCreationEmailField.fill(email);
    await this.accountCreationPasswordField.fill(password);
    await this.accountCreationPasswordRepeatField.fill(password);
    await this.accountCreationConfirmButton.click();

    await expect(this.page.getByText(expected.account.accountCreatedNotificationText)).toBeVisible();
    // log credentials to console to add to .env file
    console.log(`Account created with credentials: email address "${email}" and password "${password}"`);
  }
}