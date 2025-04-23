import {expect, type Locator, type Page} from '@playwright/test';

import UIReference from '../config/element-identifiers/element-identifiers.json';

import slugs from '../config/slugs.json';

export default class CategoryPage {
  readonly page:Page;
  categoryPageTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.categoryPageTitle = this.page.getByRole('heading', { name: UIReference.categoryPage.categoryPageTitleText });
  }

  async goToCategoryPage(){
    await this.page.goto(slugs.productpage.categorySlug);
    // Wait for the first filter option to be visible
    const firstFilterOption = this.page.locator(UIReference.categoryPage.firstFilterOptionLocator);
    await firstFilterOption.waitFor();

    this.page.waitForLoadState();
    await expect(this.categoryPageTitle).toBeVisible();
  }

  async filterOnSize(){
    const sizeFilterButton = this.page.getByRole('button', {name: 'Size filter'});
    const sizeLButton = this.page.getByLabel('Filter Size L');
    const filterContentGroup = this.page.locator("#filter-option-4-content");
    const activeFilterHeader = this.page.locator("#active-filtering-heading");
    const removeActiveFilterLink = this.page.getByRole('link', {name: 'Remove active'}).first();


    // locator: filter-option-4-content
    // if this is not visible, it has style="display:none"
    if(await this.page.locator('#filter-option-4-content').isHidden()){
      // filter group is not open, open it
      console.log('Not visible!');
      await sizeFilterButton.click();
    }

    // await sizeFilterButton.click();
    let amountOfItemsBeforeFilter = parseInt(await this.page.locator(".toolbar-number").last().innerText());


    await sizeLButton.click();
    await activeFilterHeader.waitFor();
    let amountOfItemsAfterFilter = parseInt(await this.page.locator(".toolbar-number").last().innerText());

    await expect(removeActiveFilterLink, 'Trash button to remove filter is visible').toBeVisible();
    expect(amountOfItemsAfterFilter, `Amount of items shown with filter (${amountOfItemsAfterFilter}) is less than without (${amountOfItemsBeforeFilter})`).toBeLessThan(amountOfItemsBeforeFilter);
    expect(this.page.url(), `URL should contain 'size=L'`).toContain("size=L");

  }

  async sortProducts(attribute:string){
    const sortButton = this.page.getByLabel('Sort by');
    await sortButton.selectOption(attribute);
    await this.page.waitForTimeout(3000);
  
    // // sortButton should now display attribute
    // expect(await sortButton.innerText(), `Sort button should now display ${attribute}`).toContain(attribute);
    // URL now has ?product_list_order=${attribute}
    expect(this.page.url()).toContain(`product_list_order=${attribute}`);
  }
}