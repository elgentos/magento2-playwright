// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, outcomeMarker, slugs } from '@config';
import { requireEnv } from '@utils/env.utils';

class MainMenuPage {
  readonly page: Page;
  readonly mainMenuElement: Locator;
  readonly mainMenuAccountButton: Locator;
  readonly mainMenuMiniCartButton: Locator;
  readonly mainMenuMyAccountItem: Locator;
  readonly mainMenuLoginItem: Locator;
  readonly mainMenuCreateAccountButton: Locator;
  readonly mainMenuLogoutItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainMenuElement = page.locator('header');
    this.mainMenuAccountButton = this.mainMenuElement.getByRole('button', { name: UIReference.mainMenu.myAccountButtonLabel });
    this.mainMenuMiniCartButton = this.mainMenuElement.getByLabel(UIReference.mainMenu.miniCartLabel);
    this.mainMenuLoginItem = this.mainMenuElement.getByRole('link', {name: UIReference.mainMenu.loginButtonLabel});
    this.mainMenuCreateAccountButton = this.mainMenuElement.getByRole('link', {name: UIReference.mainMenu.createAccountButtonLabel});
    this.mainMenuLogoutItem = this.mainMenuElement.getByTitle(UIReference.mainMenu.myAccountLogoutItem);
    this.mainMenuMyAccountItem = this.mainMenuElement.getByTitle(UIReference.mainMenu.myAccountButtonLabel);
  }

  async goToCategoryPage() {
    await this.page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
    await this.mainMenuAccountButton.waitFor();
    await this.page.getByRole('link', { name: UIReference.categoryPage.categoryPageTitleText, exact: true }).click();

    await this.page.waitForURL(slugs.categoryPage.categorySlug);
    await expect(
      this.page.getByRole('heading', {name: UIReference.categoryPage.categoryPageTitleText}),
      `Heading "${UIReference.categoryPage.categoryPageTitleText}" is visible`).toBeVisible();
  }
  async goToSubCategoryPage() {
    await this.page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
    await this.mainMenuAccountButton.waitFor();

    await this.page.getByRole('link', { name: UIReference.mainMenu.gearCategoryItemText, exact: true }).hover();
    await expect(this.page.getByRole('link', {name: UIReference.mainMenu.fitnessEquipmentLinkLabel})).toBeVisible();

    await this.page.getByRole('link', {name: UIReference.mainMenu.fitnessEquipmentLinkLabel}).click();
    await this.page.waitForURL(slugs.categoryPage.fitnessEquipmentSlug);

    await expect(this.page.getByRole('heading',
      { name: outcomeMarker.categoryPage.fitnessEquipmentTitle }).locator('span'),
      `Category page title "${outcomeMarker.categoryPage.fitnessEquipmentTitle}" is visible`).toBeVisible();
  }

  async gotoMyAccount(){
    await this.page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
    await this.mainMenuAccountButton.waitFor();
    await this.mainMenuAccountButton.click();
    await this.mainMenuMyAccountItem.click();

    await expect(this.page.getByRole('heading', { name: UIReference.accountDashboard.accountDashboardTitleLabel }), 'Account dashboard is visible').toBeVisible();
  }

  async goToLoginPage() {
    const loginHeader = this.page.getByRole('heading', {name: outcomeMarker.login.loginHeaderText, exact:true});
    await this.page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
    await this.mainMenuAccountButton.waitFor();
    await this.mainMenuAccountButton.click();

    await this.mainMenuLoginItem.click();
    await this.page.waitForURL(`${slugs.account.loginSlug}/**`);
    await expect(loginHeader, 'Login header text is visible').toBeVisible();
  }

  async goToCreateAccountPage() {
    const createAccountHeader = this.page.getByRole('heading', {name: outcomeMarker.account.createAccountHeaderText, exact:true});
    await this.page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
    await this.mainMenuAccountButton.waitFor();
    await this.mainMenuAccountButton.click();

    await this.mainMenuCreateAccountButton.click();
    await this.page.waitForURL(slugs.account.createAccountSlug);
    await expect(createAccountHeader, 'Create account header text is visible').toBeVisible();
  }

  async gotoAddressBook() {
    // create function to navigate to Address Book through the header menu links
  }

  async openMiniCart() {
    await this.page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
    await this.mainMenuMiniCartButton.waitFor();
    // By adding 'force', we can bypass the 'aria-disabled' tag.
    await this.mainMenuMiniCartButton.click({force: true});

    let miniCartDrawer = this.page.locator("#cart-drawer-title");
    await expect(miniCartDrawer.getByText(outcomeMarker.miniCart.miniCartTitle)).toBeVisible();
  }

  async logout(){
    await this.page.goto(slugs.account.accountOverviewSlug);
    await this.mainMenuAccountButton.click();
    await this.mainMenuLogoutItem.click();

    //assertions: notification that user is logged out & logout button no longer visible
    await expect(this.page.getByText(outcomeMarker.logout.logoutConfirmationText, { exact: true })).toBeVisible();
    await expect(this.mainMenuLogoutItem).toBeHidden();
  }
}

export default MainMenuPage;
