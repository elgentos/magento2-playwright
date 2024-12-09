import {expect, Page, Locator} from '@playwright/test';
import slugs from '../fixtures/before/slugs.json';

import productPageSelector from '../fixtures/during/selectors/product-page.json';
import miniCartSelector from '../fixtures/during/selectors/minicart.json';
import productPageExpected from '../fixtures/verify/expects/product-page.json';

export class Cart {
  page: Page;
  addToCartButton: Locator;
  miniCartTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    // TODO: move the variable to new variable file.
    this.addToCartButton = page.getByRole('button', {name: productPageSelector.addToCartButtonPDP});
    // TODO: move the label and text into variables in variable file.
    this.miniCartTitle = page.getByText('My Cart');
  }

  async addSimpleProductToCart(productSlug: string) {
    await this.page.goto(slugs.simpleProductSlug);
    await this.addToCartButton.click();

    // TODO: move the variable to new variable file.
    await expect(this.page.getByText(productPageExpected.productAddedToCartNotificationText)).toBeVisible();
  }

  async addConfigurableProductToCart(productSlug: string){
    await this.page.goto(slugs.configurableProductSlug);
    const productOptions = this.page.locator(productPageSelector.configurableProductOptionForm);

    // loop through each radiogroup (product option) within the form
    for (const option of await productOptions.getByRole('radiogroup').all()) {
        await option.locator(productPageSelector.configurableProductOptionValue).first().check();
    }

    await this.page.click(productPageSelector.addToCartButtonSelector);
  }

  async openMiniCart() {
    //TODO: a check should be built in this function: if the cart is empty, it's not possible to open the minicart.

    // declare minicart button here to ensure cart is not empty.
    var miniCartMenuItem = this.page.getByLabel('Toggle minicart');
    
    await miniCartMenuItem.click();
    await expect(this.miniCartTitle).toBeVisible();
  }

  async preFillCartWithSimpleProduct(){
    await this.page.goto(slugs.simpleProductSlug2);
    await this.page.click(productPageSelector.addToCartButtonSelector);
    await expect(this.page.locator(`text=${productPageExpected.prefillAddedNotificationText}`)).toBeVisible();
  }
}
