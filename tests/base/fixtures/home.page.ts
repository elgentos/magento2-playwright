import {type Locator, type Page} from '@playwright/test';

import UIReference from '../config/element-identifiers/element-identifiers.json';

class HomePage {

  readonly page: Page;
  buyProductButton: Locator;

  constructor(page: Page) {
    this.page = page;
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
