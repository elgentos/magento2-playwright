import {expect, type Locator, type Page} from '@playwright/test';
import inputvalues from '../config/input-values/input-values.json';
import selectors from '../config/selectors/selectors.json';

export class LoginPage {
  readonly page: Page;
  readonly loginEmailField: Locator;
  readonly loginPasswordField: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginEmailField = page.getByLabel('Email', {exact: true});
    this.loginPasswordField = page.getByLabel('Password', {exact: true});
    this.loginButton = page.getByRole('button', { name: 'Sign In' });
  }
}