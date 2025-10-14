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
  readonly mainMenuWishListButton: Locator;
  readonly mainMenuMyOrdersButton: Locator;
  readonly mainMenuLogoutItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainMenuElement = page.locator('header');
    this.mainMenuAccountButton = this.mainMenuElement.getByRole('button', { name: UIReference.mainMenu.myAccountButtonLabel });
    this.mainMenuMiniCartButton = this.mainMenuElement.getByLabel(UIReference.mainMenu.miniCartLabel);
    this.mainMenuMyAccountItem = this.mainMenuElement.getByTitle(UIReference.mainMenu.myAccountButtonLabel);
    this.mainMenuLoginItem = this.mainMenuElement.getByRole('link', {name: UIReference.mainMenu.loginButtonLabel});
    this.mainMenuCreateAccountButton = this.mainMenuElement.getByRole('link', {name: UIReference.mainMenu.createAccountButtonLabel});
    this.mainMenuWishListButton = this.mainMenuElement.getByRole('link', {name: UIReference.mainMenu.wishListButtonLabel});
    this.mainMenuMyOrdersButton = this.mainMenuElement.getByRole('link', {name: UIReference.mainMenu.myOrdersButtonLabel});
    this.mainMenuLogoutItem = this.mainMenuElement.getByTitle(UIReference.mainMenu.myAccountLogoutItem);

  }

  /**
   * Function for the test Navigate_to_category_page
   */
  async goToCategoryPage() {
    await this.page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
    await this.mainMenuAccountButton.waitFor();
    await this.page.getByRole('link', { name: UIReference.categoryPage.categoryPageTitleText, exact: true }).click();

    await this.page.waitForURL(slugs.categoryPage.categorySlug);
    await expect(
      this.page.getByRole('heading', {name: UIReference.categoryPage.categoryPageTitleText}),
      `Heading "${UIReference.categoryPage.categoryPageTitleText}" is visible`).toBeVisible();
  }
  /**
   * Function for the test Navigate_to_subcategory_page
   */
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

  /**
   * Function for the test User_navigates_account_page
   */
  async gotoMyAccount(){
    await this.page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
    await this.mainMenuAccountButton.waitFor();
    await this.mainMenuAccountButton.click();
    await this.mainMenuMyAccountItem.click();

    await expect(this.page.getByRole('heading', { name: UIReference.accountDashboard.accountDashboardTitleLabel }), 'Account dashboard is visible').toBeVisible();
  }

  /**
   * Function for the test User_navigates_to_login
   */
  async goToLoginPage() {
    const loginHeader = this.page.getByRole('heading', {name: outcomeMarker.login.loginHeaderText, exact:true});
    await this.page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
    await this.mainMenuAccountButton.waitFor();
    await this.mainMenuAccountButton.click();

    await this.mainMenuLoginItem.click();
    await this.page.waitForURL(`${slugs.account.loginSlug}/**`);
    await expect(loginHeader, 'Login header text is visible').toBeVisible();
  }

  /**
   * Function for the test User_navigates_to_create_account
   */
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

  /**
   * Function for the test Navigate_to_orders
   */
  async goToOrders() {
    await this.page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
    await this.mainMenuAccountButton.waitFor();
    await this.mainMenuAccountButton.click();

    await this.mainMenuMyOrdersButton.click();
    await this.page.waitForURL(slugs.account.orderHistorySlug);
    await expect(this.page.getByRole(
        'heading', {name: UIReference.orderHistoryPage.orderHistoryTitle, level: 1, exact:true}),
      `Heading "${UIReference.orderHistoryPage.orderHistoryTitle}" is visible`).toBeVisible();
  }

  /**
   * Function for the test Navigate_to_wishlist
   */
  async goToWishList() {
    await this.page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
    await this.mainMenuAccountButton.waitFor();
    await this.mainMenuAccountButton.click();

    await this.mainMenuWishListButton.click();
    await this.page.waitForURL(slugs.wishList.wishListSlug);
    await expect(this.page.getByRole(
      'heading', {name: UIReference.wishListPage.wishListTitle, exact:true}),
      `Heading "${UIReference.wishListPage.wishListTitle}" is visible`).toBeVisible();
  }

  /**
   * Function for the test Open_the_minicart
   */
  async openMiniCart() {
    await this.page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
    await this.mainMenuMiniCartButton.waitFor();
    // By adding 'force', we can bypass the 'aria-disabled' tag.
    await this.mainMenuMiniCartButton.click({force: true});

    let miniCartDrawer = this.page.locator("#cart-drawer-title");
    await expect(miniCartDrawer.getByText(outcomeMarker.miniCart.miniCartTitle)).toBeVisible();
  }

  /**
   * Function for the test User_logs_out
   */
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
