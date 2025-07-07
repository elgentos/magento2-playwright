// @ts-check

import { type Page } from '@playwright/test';
import { UIReference, slugs } from 'config';

class HomePage {

  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async openHomePage() {
    await this.page.goto(slugs.home.homeSlug);
  }

  async addHomepageProductToCart(){
    let buyProductButton = this.page.getByRole('button').filter({hasText: UIReference.general.addToCartLabel}).first();

    if(await buyProductButton.isVisible()) {
      await buyProductButton.click();
    } else {
      throw new Error(`No 'Add to Cart' button found on homepage`);
    }
  }
}

export default HomePage;
