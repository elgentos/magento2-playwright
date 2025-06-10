import {expect, type Locator, type Page} from '@playwright/test';

import UIReference from '../config/element-identifiers/element-identifiers.json';

import slugs from '../config/slugs.json';

class CategoryPage {
  readonly page:Page;
  categoryPageTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.categoryPageTitle = this.page.getByRole('heading', { name: UIReference.categoryPage.categoryPageTitleText });
  }

  async goToCategoryPage(){
    await this.page.goto(slugs.categoryPage.categorySlug);
    // Wait for the first filter option to be visible
    const firstFilterOption = this.page.locator(UIReference.categoryPage.firstFilterOptionLocator);
    await firstFilterOption.waitFor();

    this.page.waitForLoadState();
    await expect(this.categoryPageTitle).toBeVisible();
  }

  async filterOnSize(browser:string){
    const sizeFilterButton = this.page.getByRole('button', {name: UIReference.categoryPage.sizeFilterButtonLabel});
    const sizeLButton = this.page.locator(UIReference.categoryPage.sizeLButtonLocator);
    const removeActiveFilterLink = this.page.getByRole('link', {name: UIReference.categoryPage.removeActiveFilterButtonLabel}).first();
    const amountOfItemsBeforeFilter = parseInt(await this.page.locator(UIReference.categoryPage.itemsOnPageAmountLocator).last().innerText());
    
    
    /**
     * BROWSER_WORKAROUND
     * The size filter seems to auto-close in Firefox and Webkit.
     * Therefore, we open it manually.
     */
    if(browser !== 'chromium'){
      await sizeFilterButton.click();
    }

    await sizeLButton.click();

    const sizeFilterRegex = new RegExp(`\\?size=L$`);
    await this.page.waitForURL(sizeFilterRegex);

    const amountOfItemsAfterFilter = parseInt(await this.page.locator(UIReference.categoryPage.itemsOnPageAmountLocator).last().innerText());
    await expect(removeActiveFilterLink, 'Trash button to remove filter is visible').toBeVisible();
    expect(amountOfItemsAfterFilter, `Amount of items shown with filter (${amountOfItemsAfterFilter}) is less than without (${amountOfItemsBeforeFilter})`).toBeLessThan(amountOfItemsBeforeFilter);

  }

  async sortProducts(attribute:string){
    const sortButton = this.page.getByLabel(UIReference.categoryPage.sortByButtonLabel);
    await sortButton.selectOption(attribute);
    const sortRegex = new RegExp(`\\?product_list_order=${attribute}$`);
    await this.page.waitForURL(sortRegex);
  
    const selectedValue = await this.page.$eval(UIReference.categoryPage.sortByButtonLocator, sel => sel.value);

    // sortButton should now display attribute
    expect(selectedValue, `Sort button should now display ${attribute}`).toEqual(attribute);
    // URL now has ?product_list_order=${attribute}
    expect(this.page.url(), `URL should contain ?product_list_order=${attribute}`).toContain(`product_list_order=${attribute}`);
  }


  async showMoreProducts(){
    const itemsPerPageButton = this.page.getByLabel(UIReference.categoryPage.itemsPerPageButtonLabel);
    const productGrid = this.page.locator(UIReference.categoryPage.productGridLocator);

    await itemsPerPageButton.selectOption('36');
    const itemsRegex = /\?product_list_limit=36$/;
    await this.page.waitForURL(itemsRegex);

    const amountOfItems = await productGrid.locator('li').count();

    expect(this.page.url(), `URL should contain ?product_list_limit=36`).toContain(`?product_list_limit=36`);
    expect(amountOfItems, `Amount of items on the page should be 36`).toBe(36);
  }

  async switchView(){
    const viewSwitcher = this.page.getByLabel(UIReference.categoryPage.viewSwitchLabel, {exact: true}).locator(UIReference.categoryPage.activeViewLocator);
    const activeView = await viewSwitcher.getAttribute('title');

    if(activeView == 'Grid'){
      await this.page.getByLabel(UIReference.categoryPage.viewListLabel).click();
    } else {
      await this.page.getByLabel(UIReference.categoryPage.viewGridLabel).click();
    }

    const viewRegex = /\?product_list_mode=list$/;
    await this.page.waitForURL(viewRegex);

    const newActiveView = await viewSwitcher.getAttribute('title');
    expect(newActiveView, `View (now ${newActiveView}) should be switched (old: ${activeView})`).not.toEqual(activeView);
    expect(this.page.url(),`URL should contain ?product_list_mode=${newActiveView?.toLowerCase()}`).toContain(`?product_list_mode=${newActiveView?.toLowerCase()}`);
  }
}
export default CategoryPage;
