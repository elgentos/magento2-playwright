import {expect, type Locator, type Page} from '@playwright/test';

import slugs from '../config/slugs.json';
import UIReference from '../config/element-identifiers/element-identifiers.json';

export class LoginPage {
  readonly page: Page;
  readonly loginEmailField: Locator;
  readonly loginPasswordField: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginEmailField = page.getByLabel(UIReference.credentials.emailFieldLabel, {exact: true});
    this.loginPasswordField = page.getByLabel(UIReference.credentials.passwordFieldLabel, {exact: true});
    this.loginButton = page.getByRole('button', { name: UIReference.credentials.loginButtonLabel });
  }

  async login(email: string, password: string){
    await this.page.goto(slugs.account.loginSlug);
    await this.loginEmailField.fill(email);
    await this.loginPasswordField.fill(password);
    // usage of .press("Enter") to prevent webkit issues with button.click();
    await this.loginButton.press("Enter");

    await expect(this.page.getByRole('link', { name: UIReference.mainMenu.myAccountLogoutItem })).toBeVisible();
  }
}