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


  async createNewAccount(){
    const existingAccountPassword = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

    if(!existingAccountPassword){
      throw new Error("Password variable not defined in .env");
    }

    //Create unique email with custom handle and host, adding a number between 0 - 100
    const randomNumber = Math.floor(Math.random() * 100);
    let emailHandle = inputvalues.accountCreation.emailHandleValue;
    let emailHost = inputvalues.accountCreation.emailHostValue;
    const uniqueEmail = `${emailHandle}${randomNumber}@${emailHost}`;
    
    await this.page.goto(slugs.account.createAccountSlug);

    await this.accountCreationFirstNameField.fill(inputvalues.accountCreation.firstNameValue);
    await this.accountCreationLastNameField.fill(inputvalues.accountCreation.lastNameValue);
    await this.accountCreationEmailField.fill(uniqueEmail);
    await this.accountCreationPasswordField.fill(existingAccountPassword);
    await this.accountCreationPasswordRepeatField.fill(existingAccountPassword);
    await this.accountCreationConfirmButton.click();

    await expect(this.page.getByText(expected.account.accountCreatedNotificationText)).toBeVisible();
    // log credentials to console to add to .env file
    console.log(`Account created with credentials: email address "${uniqueEmail}" and password "${existingAccountPassword}"`);
  }
}