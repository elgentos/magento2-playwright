import {expect, type Locator, type Page} from '@playwright/test';
import {LoginPage} from './login.page';

import slugs from '../config/slugs.json';
import selectors from '../config/selectors/selectors.json';
import inputvalues from '../config/input-values/input-values.json';
import expected from '../config/expected/expected.json';

export class AccountPage {
  readonly page: Page;
  readonly accountDashboardTitle: Locator;

  constructor(page: Page){
    this.page = page;
    this.accountDashboardTitle = page.getByRole('heading', { name: selectors.accountDashboard.accountDashboardTitleLabel });
  }
}