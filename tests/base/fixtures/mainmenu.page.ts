import {expect, type Locator, type Page} from '@playwright/test';

import slugs from '../config/slugs.json';
import UIReference from '../config/element-identifiers/element-identifiers.json';
import outcomeMarker from '../config/outcome-markers/outcome-markers.json';


export class MainMenuPage {
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
    // create function to navigate to Address Book through the header menu links
  }

  async openMiniCart() {
    // await this.page.reload();
    // FIREFOX_WORKAROUND: wait for 3 seconds to allow minicart to be updated.
    await this.page.waitForTimeout(3000);
    const cartAmountBubble = this.mainMenuMiniCartButton.locator('span');
    cartAmountBubble.waitFor();
    const amountInCart = await cartAmountBubble.innerText();

    // waitFor is added to ensure the minicart button is visible before clicking, mostly as a fix for Firefox.
    // await this.mainMenuMiniCartButton.waitFor();

    await this.mainMenuMiniCartButton.click();

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
