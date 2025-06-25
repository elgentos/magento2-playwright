// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, outcomeMarker, slugs } from 'config';

class MainMenuPage {
  readonly page: Page;
  readonly mainMenuAccountButton: Locator;
  readonly mainMenuMiniCartButton: Locator;
  readonly mainMenuMyAccountItem: Locator;
  readonly mainMenuLogoutItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainMenuAccountButton = page.getByLabel(UIReference.mainMenu.myAccountButtonLabel);
    this.mainMenuMiniCartButton = page.getByLabel(UIReference.mainMenu.miniCartLabel);
    this.mainMenuLogoutItem = page.getByTitle(UIReference.mainMenu.myAccountLogoutItem);
    this.mainMenuMyAccountItem = page.getByTitle(UIReference.mainMenu.myAccountButtonLabel);
  }

  async gotoMyAccount(){
    await this.page.goto(slugs.productpage.simpleProductSlug);
    await this.mainMenuAccountButton.click();
    await this.mainMenuMyAccountItem.click();

    await expect(this.page.getByRole('heading', { name: UIReference.accountDashboard.accountDashboardTitleLabel })).toBeVisible();
  }

  async gotoAddressBook() {
    await this.page.goto(slugs.account.accountOverviewSlug);
    await this.mainMenuAccountButton.click();
    await this.page.getByTitle(UIReference.mainMenu.addressBookLinkTitle).click();

    await expect(
      this.page.getByRole('heading', { name: outcomeMarker.account.addressBookTitle })
    ).toBeVisible();
  }

  async gotoLoginPage() {
    await this.page.goto(slugs.productpage.simpleProductSlug);
    await this.mainMenuAccountButton.click();
    await this.page.getByRole('link', { name: UIReference.mainMenu.loginLinkLabel }).click();

    await expect(this.page).toHaveURL(new RegExp(slugs.account.loginSlug));
  }

  async gotoCreateAccountPage() {
    await this.page.goto(slugs.productpage.simpleProductSlug);
    await this.mainMenuAccountButton.click();
    await this.page.getByRole('link', { name: UIReference.mainMenu.createAccountLinkLabel }).click();

    await expect(this.page).toHaveURL(new RegExp(slugs.account.createAccountSlug));
  }

  async gotoWishList() {
    await this.page.goto(slugs.account.accountOverviewSlug);
    await this.mainMenuAccountButton.click();
    await this.page.getByRole('link', { name: UIReference.mainMenu.wishListLinkLabel }).click();

    await expect(this.page).toHaveURL(new RegExp(slugs.wishlist.wishListRegex));
  }

  async gotoOrders() {
    await this.page.goto(slugs.account.accountOverviewSlug);
    await this.mainMenuAccountButton.click();
    await this.page.getByRole('link', { name: UIReference.mainMenu.ordersLinkLabel }).click();

    await expect(this.page).toHaveURL(new RegExp(slugs.account.ordersSlug));
  }

  async gotoCategory(categoryName: string, slug: string) {
    await this.page.goto('');
    await this.page.getByRole('link', { name: categoryName }).first().click();

    await expect(this.page).toHaveURL(new RegExp(slug));
  }

  async gotoSubCategory(categoryName: string, subCategoryName: string, slug: string) {
    await this.page.goto('');
    const category = this.page.getByRole('link', { name: categoryName }).first();
    await category.hover();
    await this.page.getByRole('link', { name: subCategoryName }).click();

    await expect(this.page).toHaveURL(new RegExp(slug));
  }

  async openSearchForm(searchTerm: string) {
    await this.page.getByLabel(UIReference.mainMenu.searchToggleLabel).click();
    const searchBox = this.page.getByRole('searchbox', { name: UIReference.mainMenu.searchPlaceholder });
    await searchBox.fill(searchTerm);
    await searchBox.press('Enter');

    await expect(this.page).toHaveURL(new RegExp(slugs.search.searchResultRegex));
  }

  async openMiniCart() {
    await this.page.waitForTimeout(3000);
    await this.mainMenuMiniCartButton.locator('span').waitFor();

    await this.mainMenuMiniCartButton.click();
    const miniCartDrawer = this.page.locator('#cart-drawer-title');
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
