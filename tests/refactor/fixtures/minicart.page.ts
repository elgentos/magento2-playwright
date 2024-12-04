import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';
import verify from '../config/expected/expected.json';
import slugs from '../config/slugs.json';

export class MiniCartPage {
  readonly page: Page;
  readonly toCheckoutButton: Locator;
  readonly toCartButton: Locator;
  readonly editProductButton: Locator;
  readonly productQuantityField: Locator;
  readonly updateItemButton: Locator;
  readonly removeProductMiniCartButton: Locator;
  readonly cartQuantityField: Locator;
  readonly priceOnPDP: Locator;
  readonly priceInMinicart: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toCheckoutButton = page.getByRole('link', { name: selectors.miniCart.checkOutButtonLabel });
    this.toCartButton = page.getByRole('link', { name: selectors.miniCart.toCartLinkLabel });
    this.editProductButton = page.getByLabel(selectors.miniCart.editProductIconLabel);
    this.productQuantityField = page.getByLabel(selectors.miniCart.productQuantityFieldLabel);
    this.updateItemButton = page.getByRole('button', { name: selectors.cart.updateItemButtonLabel });
    this.removeProductMiniCartButton = page.getByLabel(selectors.miniCart.removeProductIconLabel).first();
    this.priceOnPDP = page.getByLabel('Price').getByText('$');
    this.priceInMinicart = page.getByText('$').first();
  }
  
  async goToCheckout(){
    await this.toCheckoutButton.click();
    await expect(this.page).toHaveURL(new RegExp(`${slugs.checkoutSlug}.*`));
  }

  async goToCart(){
    await this.toCartButton.click();
    await expect(this.page).toHaveURL(new RegExp(`${slugs.cartSlug}.*`));
  }

  async removeProductFromMinicart() {
    let productRemovedNotification = verify.miniCart.productRemovedConfirmation;
    await this.removeProductMiniCartButton.click();
    await expect(this.page.getByText(productRemovedNotification)).toBeVisible();
  }

  async updateProduct(amount: string){
    let productQuantityChangedNotification = verify.miniCart.productQuantityChangedConfirmation;
    await this.editProductButton.click();
    await expect(this.page).toHaveURL(new RegExp(`${slugs.cartProductChangeSlug}.*`));

    await this.productQuantityField.fill(amount);
    await this.updateItemButton.click();
    await expect(this.page.getByText(productQuantityChangedNotification)).toBeVisible();

    let productQuantityInCart = await this.page.getByLabel('Qty').first().inputValue();
    console.log(productQuantityInCart);
    expect(productQuantityInCart).toBe(amount);
  }

  async checkPriceWithProductPage() {
    const priceOnPage = await this.page.locator(selectors.productPage.simpleProductPrice).innerText();
    const productTitle = await this.page.getByRole('heading', { level : 1}).innerText();
    const productListing =  this.page.locator('div').filter({hasText: productTitle});
    const priceInMinicart = await productListing.locator('.price-excluding-tax .minicart-price .price').first().innerText();
    //expect(priceOnPage).toBe(priceInMinicart);
    expect(priceOnPage, `Expect these prices to be the same: priceOnpage: ${priceOnPage} and priceInMinicart: ${priceInMinicart}`).toBe(priceInMinicart);
  }
} 