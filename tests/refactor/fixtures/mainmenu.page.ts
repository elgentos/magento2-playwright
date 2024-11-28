import {expect, type Locator, type Page} from '@playwright/test';

import slugs from '../config/slugs.json';
import selectors from '../config/selectors/selectors.json';
import expected from '../config/expected/expected.json';


export class MainMenuPage {
  readonly page: Page;
  readonly mainMenuAccountButton: Locator;
  readonly mainMenuMyAccountItem: Locator;
  readonly mainMenuLogoutItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainMenuAccountButton = page.getByLabel(selectors.mainMenu.myAccountButtonLabel);
    this.mainMenuLogoutItem = page.getByTitle(selectors.mainMenu.myAccountLogoutItem);
    this.mainMenuMyAccountItem = page.getByTitle(selectors.mainMenu.myAccountButtonLabel);
  }

  async gotoMyAccount(){
    await this.page.goto(slugs.productpage.simpleProductSlug);
    await this.mainMenuAccountButton.click();
    await this.mainMenuMyAccountItem.click();

    await expect(this.page.getByRole('heading', { name: selectors.accountDashboard.accountDashboardTitleLabel })).toBeVisible();
  }

  async gotoAddressBook() {
    // TODO: create function to navigate to Address Book through the header menu links
  }

  async logout(){
    await this.page.goto(slugs.account.accountOverviewSlug);
    await this.mainMenuAccountButton.click();
    await this.mainMenuLogoutItem.click();

    await expect(this.page.getByText(expected.logout.logoutConfirmationText, { exact: true })).toBeVisible();
  }
}