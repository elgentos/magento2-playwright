import {Page} from '@playwright/test';

export class Checkout {
  page: Page;

  constructor(page: Page) {
    this.page = page
  }
}
