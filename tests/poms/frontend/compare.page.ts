// @ts-check

import { expect, type Page } from '@playwright/test';
import { UIReference, outcomeMarker } from '@config';

class ComparePage {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async removeProductFromCompare(product:string){
    let comparisonPageEmptyText = this.page.getByText(UIReference.text.frontend.compare.empty);
    // if the comparison page is empty, we can't remove anything
    if (await comparisonPageEmptyText.isVisible()) {
      return;
    }

	const comparisonPageProductTitle = this.page.getByRole('link', {name: product});
    let removeFromCompareButton = this.page.getByLabel(`${UIReference.text.frontend.compare.removeProduct} ${product}`);
    await removeFromCompareButton.click();
    const messageLocator = this.page.locator(UIReference.selectors.shared.message);
    await messageLocator.waitFor();
    await this.page.getByRole('button', {name: UIReference.text.shared.buttons.closeMessage}).click();
    await expect(messageLocator, `notification toast should be hidden`).toBeHidden();
	  await expect(comparisonPageProductTitle, `Link to product is no longer visible`).toBeHidden();
  }

  async addToCart(product:string){
    const successMessage = this.page.locator(UIReference.selectors.shared.successMessage);
    let productAddedNotification = this.page.getByText(`${outcomeMarker.productPage.simpleProductAddedNotification} ${product}`);

    const productCell = this.page.getByRole('cell', {name: product});
    const addToCartButton = productCell.getByRole('button', {name: UIReference.text.shared.buttons.addToCart});

    await addToCartButton.click();
    await successMessage.waitFor();
    await expect(productAddedNotification).toBeVisible();
  }

  async addToWishList(product:string){
    const successMessage = this.page.locator(UIReference.selectors.shared.successMessage);
    let addToWishlistButton = this.page.getByLabel(`${UIReference.text.shared.buttons.addToWishlist} ${product}`);
    let productAddedNotification = this.page.getByText(`${product} ${outcomeMarker.wishListPage.wishListAddedNotification}`);

    await addToWishlistButton.click();
    await successMessage.waitFor();
  }
}
export default ComparePage;
