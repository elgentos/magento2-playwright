import {type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';

export class HomePage {

  readonly page: Page;
  buyProductButton: Locator;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async addHomepageProductToCart(){
    let buyProductButton = this.page.getByRole('button').filter({hasText: selectors.general.addToCartLabel}).first();
    
    if(await buyProductButton.isVisible()) {
      await buyProductButton.click();
    } else {
      throw new Error(`No 'Add to Cart' button found on homepage`);
    }
  }
}