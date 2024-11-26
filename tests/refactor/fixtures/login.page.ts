import {expect, type Locator, type Page} from '@playwright/test';

import slugs from '../config/slugs.json';
import selectors from '../config/selectors/selectors.json';
import expected from '../config/expected/expected.json';

export class LoginPage {
  readonly page: Page;
  readonly loginEmailField: Locator;
  readonly loginPasswordField: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginEmailField = page.getByLabel(selectors.login.emailFieldLabel, {exact: true});
    this.loginPasswordField = page.getByLabel(selectors.login.PasswordFieldLabel, {exact: true});
    this.loginButton = page.getByRole('button', { name: selectors.login.loginButtonLabel });
  }

  // Note: this login function is simply written to quickly log in for tests which require you to be logged in.
  // Do NOT use this to test logging in.
  // TODO: this login function should be moved to an auth file. see login.spec.ts line 15 and 16 for more info.
  async login(){
    let emailInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_EMAIL;
    let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;
    
    if(!emailInputValue || !passwordInputValue) {
      throw new Error("Your password variable and/or your email variable have not defined in the .env file, or the account hasn't been created yet.");
    }

    await this.page.goto(slugs.account.loginSlug);
    await this.loginEmailField.fill(emailInputValue);
    await this.loginPasswordField.fill(passwordInputValue);
    await this.loginButton.click();

    // this element cannot be defined in the constructor, since the sign out button only appears after logging in.
    await expect(this.page.getByRole('link', { name: expected.account.signOutButtonLabel })).toBeVisible();
  }
}