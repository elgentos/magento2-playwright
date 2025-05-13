import {expect, type Locator, type Page} from '@playwright/test';

import {ProductPage} from '../poms/product.page';
import { CartPage } from '../poms/shoppingcart.page';

// --------------------
// shopPageWithProduct
// --------------------
export class shopPageWithProduct {
  readonly productPage: ProductPage;
  readonly cartPage: CartPage;

  constructor(page: Page) {
    this.productPage = new ProductPage(page);
    this.cartPage = new CartPage(page);
  }
}