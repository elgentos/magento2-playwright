import {expect, type Locator, type Page} from '@playwright/test';


export class CartPage {
  readonly page: Page;
  readonly applyDiscountButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.applyDiscountButton = this.page.getByRole('button', { name: 'Apply Discount Code' });
  }
}