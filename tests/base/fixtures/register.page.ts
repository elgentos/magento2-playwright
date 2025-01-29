import {expect, type Locator, type Page} from '@playwright/test';

import slugs from '../config/slugs.json';
import UIReference from '../config/element-identifiers/element-identifiers.json';
import outcomeMarker from '../config/outcome-markers/outcome-markers.json';

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
    this.accountCreationFirstNameField = page.getByLabel(UIReference.personalInformation.firstNameLabel);
    this.accountCreationLastNameField = page.getByLabel(UIReference.personalInformation.lastNameLabel);
    this.accountCreationEmailField = page.getByLabel(UIReference.credentials.emailFieldLabel, { exact: true});
    this.accountCreationPasswordField = page.getByLabel(UIReference.credentials.passwordFieldLabel, { exact: true });
    this.accountCreationPasswordRepeatField = page.getByLabel(UIReference.credentials.passwordConfirmFieldLabel);
    this.accountCreationConfirmButton = page.getByRole('button', {name: UIReference.accountCreation.createAccountButtonLabel});
  }


  async createNewAccount(firstName: string, lastName: string, email: string, password: string){  
    await this.page.goto(slugs.account.createAccountSlug);

    await this.accountCreationFirstNameField.fill(firstName);
    await this.accountCreationLastNameField.fill(lastName);
    await this.accountCreationEmailField.fill(email);
    await this.accountCreationPasswordField.fill(password);
    await this.accountCreationPasswordRepeatField.fill(password);
    await this.accountCreationConfirmButton.click();

    await expect(this.page.getByText(outcomeMarker.account.accountCreatedNotificationText)).toBeVisible();
    // log credentials to console to add to .env file
    //console.log(`Account created with credentials: email address "${email}" and password "${password}"`);
  }
}