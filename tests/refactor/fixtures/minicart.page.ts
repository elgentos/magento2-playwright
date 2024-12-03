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
  readonly cartQuantityField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toCheckoutButton = page.getByRole('link', { name: selectors.miniCart.checkOutButtonLabel });
    this.toCartButton = page.getByRole('link', { name: 'View and Edit Cart' });
    this.editProductButton = page.getByLabel('Edit product');
    this.productQuantityField = page.getByLabel('Quantity');
    this.updateItemButton = page.getByRole('button', { name: 'shopping-cart Update item' });
  }
  
  async goToCheckout(){
    await this.toCheckoutButton.click();
    await expect(this.page).toHaveURL(new RegExp(`${slugs.checkoutSlug}.*`));
  }

  async goToCart(){
    await this.toCartButton.click();
    await expect(this.page).toHaveURL(new RegExp(`${slugs.cartSlug}.*`));
  }

  async updateProduct(amount: string){
    let productQuantityChangedNotification = "Push It Messenger Bag was";
    await this.editProductButton.click();
    await expect(this.page).toHaveURL(new RegExp(`${slugs.cartProductChangeSlug}.*`));

    await this.productQuantityField.fill(amount);
    await this.updateItemButton.click();
    await expect(this.page.getByText(productQuantityChangedNotification)).toBeVisible();

    let productQuantityInCart = await this.page.getByLabel('Qty').first().inputValue();
    console.log(productQuantityInCart);
    expect(productQuantityInCart).toBe(amount);
  }
}