import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';
import verify from '../config/expected/expected.json';

export class ProductPage {
  readonly page: Page;
  readonly simpleProductTitle: Locator;
  readonly simpleProductAddToCartButon: Locator;

  constructor(page: Page) {
    this.page = page;
    this.simpleProductTitle = page.getByRole('heading', {name: selectors.productPage.simpleProductTitle, exact:true});
    this.simpleProductAddToCartButon = page.getByRole('button', { name: 'shopping-cart Add to Cart' });
  }

  async addSimpleProductToCart(){
    let productAddedNotification = verify.productPage.simpleProductAddedNotification;
    await expect(this.simpleProductTitle.locator('span')).toBeVisible();

    await this.simpleProductAddToCartButon.click();
    await expect(this.page.getByText(productAddedNotification)).toBeVisible();
  }
}

// await expect(page.getByRole('heading', { name: 'Push It Messenger Bag', exact: true }).locator('span')).toBeVisible();