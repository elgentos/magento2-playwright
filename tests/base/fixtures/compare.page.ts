import {expect, type Locator, type Page} from '@playwright/test';

import slugs from '../config/slugs.json';

import UIReference from '../config/element-identifiers/element-identifiers.json';
import outcomeMarker from '../config/outcome-markers/outcome-markers.json';

class ComparePage {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async removeProductFromCompare(product:string){
    let comparisonPageEmptyText = this.page.getByText(UIReference.comparePage.comparisonPageEmptyText);
    // if the comparison page is empty, we can't remove anything
    if (await comparisonPageEmptyText.isVisible()) {
      return;
    }

    let removeFromCompareButton = this.page.getByLabel(`${UIReference.comparePage.removeCompareLabel} ${product}`);
    let productRemovedNotification = this.page.getByText(`${outcomeMarker.comparePage.productRemovedNotificationTextOne} ${product} ${outcomeMarker.comparePage.productRemovedNotificationTextTwo}`);
    await removeFromCompareButton.click();
    await expect(productRemovedNotification).toBeVisible();
  }

  async addToCart(product:string){
    const successMessage = this.page.locator(UIReference.general.successMessageLocator);
    let productAddedNotification = this.page.getByText(`${outcomeMarker.productPage.simpleProductAddedNotification} ${product}`);
    let addToCartbutton = this.page.getByLabel(`${UIReference.general.addToCartLabel} ${product}`);
    
    await addToCartbutton.click();
    await successMessage.waitFor();
    await expect(productAddedNotification).toBeVisible();
  }

  async addToWishList(product:string){
    const successMessage = this.page.locator(UIReference.general.successMessageLocator);
    let addToWishlistButton = this.page.getByLabel(`${UIReference.comparePage.addToWishListLabel} ${product}`);
    let productAddedNotification = this.page.getByText(`${product} ${outcomeMarker.wishListPage.wishListAddedNotification}`);

    await addToWishlistButton.click();
    await successMessage.waitFor();
  }
}
export default ComparePage;
