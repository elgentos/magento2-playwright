import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';
import verify from '../config/expected/expected.json';
import slugs from '../config/slugs.json';

export class MiniCartPage {
  readonly page: Page;
  readonly toCheckoutButton: Locator;
  readonly toCartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toCheckoutButton = page.getByRole('link', { name: selectors.miniCart.checkOutButtonLabel });
    this.toCartButton = page.getByRole('link', { name: 'View and Edit Cart' });
  }
  
  async goToCheckout(){
    await this.toCheckoutButton.click();
    await expect(this.page).toHaveURL(new RegExp(`${slugs.checkoutSlug}.*`));
  }

  async goToCart(){
    await this.toCartButton.click();
    await expect(this.page).toHaveURL(new RegExp(`${slugs.checkoutSlug}.*`));
  }
}