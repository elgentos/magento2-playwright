import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';

export class CartPage {
  readonly page: Page;
  readonly applyDiscountButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.applyDiscountButton = this.page.getByRole('button', { name: selectors.cart.applyDiscountCodeLabel });
  }

  async removeProduct(name: string){
    let removeButton = this.page.getByLabel(`${selectors.cart.remove} ${name}`);
    await removeButton.click();
    await expect(removeButton,`Button to remove product is no longer visible`).toBeHidden();
  }
}