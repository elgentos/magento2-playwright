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
    this.loginEmailField = page.getByLabel(selectors.credentials.emailFieldLabel, {exact: true});
    this.loginPasswordField = page.getByLabel(selectors.credentials.passwordFieldLabel, {exact: true});
    this.loginButton = page.getByRole('button', { name: selectors.credentials.loginButtonLabel });
  }

  // Note: this login function is simply written to quickly log in for tests which require you to be logged in.
  // Do NOT use this to test logging in.
  // TODO: this login function should be moved to an auth file. see login.spec.ts line 15 and 16 for more info.
  async login(email: string, password: string){
    await this.page.goto(slugs.account.loginSlug);
    await this.loginEmailField.fill(email);
    await this.loginPasswordField.fill(password);
    await this.loginButton.click();

    // this element cannot be defined in the constructor, since the sign out button only appears after logging in.
    // Using a selector rather than expected, since it's we're locating a button rather than an expected notification.
    await expect(this.page.getByRole('link', { name: selectors.mainMenu.myAccountLogoutItem })).toBeVisible();
  }
}