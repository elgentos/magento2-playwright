import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';
import verify from '../config/expected/expected.json';
import slugs from '../config/slugs.json';

export class MiniCartPage {
  readonly page: Page;
  readonly toCheckoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toCheckoutButton = page.getByRole('link', { name: 'Checkout' });
  }
  
  async goToCheckout(){
    await this.toCheckoutButton.click();
    await expect(this.page).toHaveURL(new RegExp(`${slugs.checkoutSlug}.*`));
  }
}