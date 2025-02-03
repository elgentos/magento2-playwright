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
    /*if(await this.page.locator('#menu-cart-icon > span').isVisible()){
      // there are items in the cart
      let miniCartItemCount = await this.page.locator('#menu-cart-icon > span').innerText();
      
      if(miniCartItemCount == "1") {
        //await this.page.getByLabel("Toggle minicart, 1 item").click();
        await this.page.getByLabel(`${UIReference.miniCart.miniCartToggleLabelPrefix} ${UIReference.miniCart.miniCartToggleLabelOneItem}`).click();
      } else {
        await this.page.getByLabel(`${UIReference.miniCart.miniCartToggleLabelPrefix} ${miniCartItemCount} ${UIReference.miniCart.miniCartToggleLabelMultiItem}`).click();
      }
    } else {
      // there are no items in the cart
      await this.page.getByLabel(`${UIReference.miniCart.miniCartToggleLabelPrefix} ${UIReference.miniCart.miniCartToggleLabelEmpty}`).click();
    }
    */
   // await this.page.locator('#menu-cart-icon > span').innerText();
    //if(miniCartItemCount = "0")
    
    await this.mainMenuMiniCartButton.click();
    await expect(this.page.getByText(outcomeMarker.miniCart.miniCartTitle)).toBeVisible();
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