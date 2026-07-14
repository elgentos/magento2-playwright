// @ts-check

import { type Page } from '@playwright/test';
import { UIReference } from '@config';

class HomePage {

  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async addHomepageProductToCart(){
    let buyProductButton = this.page.getByRole('button').filter({hasText: UIReference.text.shared.buttons.addToCart}).first();

    if(await buyProductButton.isVisible()) {
      await buyProductButton.click();
    } else {
      throw new Error(`No 'Add to Cart' button found on homepage`);
    }
  }
}

export default HomePage;
