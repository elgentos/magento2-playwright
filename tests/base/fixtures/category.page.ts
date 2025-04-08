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

    await this.page.waitForLoadState("networkidle");

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

    if(await filterContentGroup.isHidden()){
      // filter group is not open, open it
      await sizeFilterButton.click();
    }

    await sizeFilterButton.click();
    let amountOfItemsBeforeFilter = parseInt(await this.page.locator(".toolbar-number").last().innerText());

    // Hard-coded filter to check other steps of the test
    // await this.page.goto(`${slugs.productpage.categorySlug}?size=L`);
    await sizeLButton.click({force: true});
    await activeFilterHeader.waitFor();
    await expect(removeActiveFilterLink, 'Trash button to remove filter is visible').toBeVisible();
    let amountOfItemsAfterFilter = parseInt(await this.page.locator(".toolbar-number").last().innerText());

    expect(amountOfItemsAfterFilter, 'Amount of items shown with filter is less than without').toBeLessThan(amountOfItemsBeforeFilter);

    // URL now has 'size=L' at the end
    // h3 id "active-filtering-heading" should now be visible
    // a trash button should be visible now
    // the value of the last toolbar-number should now be lower than it was before

  }
}