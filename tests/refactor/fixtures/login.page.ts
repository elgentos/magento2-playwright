import {expect, type Locator, type Page} from '@playwright/test';

import inputvalues from '../config/input-values/input-values.json';
import selectors from '../config/selectors/selectors.json';
import slugs from '../config/slugs.json';

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
  async login(){
    
    await this.page.goto(slugs.account.createAccountSlug);
    await this.loginEmailField.fill(inputvalues.login.email);
    await this.loginPasswordField.fill(inputvalues.login.password);
    await this.loginButton.click();
  }
}