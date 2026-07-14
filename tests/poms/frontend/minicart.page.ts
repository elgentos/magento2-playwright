// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference,  outcomeMarker, slugs } from '@config';
import { slugToRegex } from '@utils/url.utils';

class MiniCartPage {
  readonly page: Page;
  readonly toCheckoutButton: Locator;
  readonly toCartButton: Locator;
  readonly editProductButton: Locator;
  readonly productQuantityField: Locator;
  readonly updateItemButton: Locator;
  readonly priceOnPDP: Locator;
  readonly priceInMinicart: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toCheckoutButton = page.getByRole('link', { name: UIReference.text.frontend.minicart.checkout });
    this.toCartButton = page.getByRole('link', { name: UIReference.text.frontend.minicart.toCart });
    this.editProductButton = page.getByLabel(UIReference.text.frontend.minicart.editProduct);
    this.productQuantityField = page.getByLabel(UIReference.text.shared.forms.quantity);
    this.updateItemButton = page.getByRole('button', { name: UIReference.text.frontend.cart.updateItem });
    this.priceOnPDP = page.getByLabel(UIReference.text.frontend.common.price).getByText(UIReference.text.frontend.common.priceSymbol);
    this.priceInMinicart = page.getByText(UIReference.text.frontend.common.priceSymbol).first();
  }

  async goToCheckout(){
    await this.toCheckoutButton.click();
    await expect(this.page).toHaveURL(slugToRegex(slugs.frontend.checkout.index));
  }

  async goToCart(){
    await this.toCartButton.click();
    await expect(this.page).toHaveURL(slugToRegex(slugs.frontend.cart.index));
  }

  async removeProductFromMinicart(product: string) {
    let productRemovedNotification = outcomeMarker.miniCart.productRemovedConfirmation;
    let removeProductMiniCartButton = this.page.getByLabel(`${UIReference.text.frontend.minicart.removeProduct} "${UIReference.text.frontend.product.simpleProduct}"`);
    // ensure button is visible
    await removeProductMiniCartButton.waitFor();
    await removeProductMiniCartButton.click();
    await expect(removeProductMiniCartButton, `Button to move product from minicart is no longer visible`).toBeHidden();
    await expect(this.page.getByText(UIReference.text.frontend.minicart.empty), `Minicart shows text "Cart is empty"`).toBeVisible();
  }

  async updateProduct(amount: string){
    let productQuantityChangedNotification = outcomeMarker.miniCart.productQuantityChangedConfirmation;
    await this.editProductButton.click();
    await expect(this.page).toHaveURL(slugToRegex(slugs.frontend.cart.configure));

    await this.productQuantityField.click();
    await this.productQuantityField.fill(amount);

    await this.updateItemButton.click();
    await expect.soft(this.page.getByText(productQuantityChangedNotification)).toBeVisible();

    let productQuantityInCart = await this.page.getByLabel(UIReference.text.frontend.common.quantityAbbr).first().inputValue();
    expect(productQuantityInCart).toBe(amount);
  }

  async checkPriceWithProductPage() {
    const priceOnPage = await this.page.locator(UIReference.selectors.frontend.product.price).first().innerText();
    const productTitle = await this.page.getByRole('heading', { level : 1}).innerText();
    const productListing =  this.page.locator('div').filter({hasText: productTitle});
    const priceInMinicart = await productListing.locator(UIReference.selectors.frontend.minicart.price).first().textContent();
    //expect(priceOnPage).toBe(priceInMinicart);
    expect(priceOnPage, `Expect these prices to be the same: priceOnpage: ${priceOnPage} and priceInMinicart: ${priceInMinicart}`).toBe(priceInMinicart);
  }
}

export default MiniCartPage;
