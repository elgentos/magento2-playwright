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

  async addConfigurableProductToCart(){
    /*"configurableProductSizeLabel": "Size",
    "configurableProductColorLabel": "Color",
    "configurableProductOptionForm": "#product_addtocart_form",
    "configurableProductOptionValue": ".product-option-value-label"*/

    const productOptions = this.page.locator(selectors.productPage.configurableProductOptionForm);

    // loop through each radiogroup (product option) within the form
    for (const option of await productOptions.getByRole('radiogroup').all()) {
        await option.locator(selectors.productPage.configurableProductOptionValue).first().check();
    }

    await this.simpleProductAddToCartButon.click();
    //TODO: add notification check to ensure product has been added.
  }
}