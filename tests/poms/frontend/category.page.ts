// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, slugs } from '@config';
import { slugToRegex, isLocalhost } from '@utils/url.utils';

class CategoryPage {
  readonly page:Page;
  categoryPageTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.categoryPageTitle = this.page.getByRole('heading', { name: UIReference.text.frontend.category.title });
  }

  /**
   * @feature Navigate to Category page
   * @scenario User navigates to the category page
   * @given
   * @when I navigate to the category page
   * @then I should see the filter options
   * @and I should see the title of the page
   */
  async goToCategoryPage(){
    await this.page.goto(slugs.frontend.category.index);

    this.page.waitForLoadState();
    await expect(this.categoryPageTitle).toBeVisible();
  }

  /**
   * @feature Filter category page
   * @scenario User filters category page on size XS
   * @given I am on the category page
   * @when I open the Size filter category
   * @and I click the size XS button
   * @then the URL should reflect this filter
   * @and I should see the active filtering button and Clear All link
   */
  async filterOnSize() {
    const filterRegion = this.page.getByRole('region', {name: 'Product filters'});
    const sizeFilterButton = filterRegion.getByRole('button', {name: UIReference.text.frontend.category.sizeFilter});
    const sizeMButton = filterRegion.getByRole('link', {name: UIReference.text.frontend.category.sizeM});
    const activeFilteringButton = this.page.getByRole('button', {name: UIReference.text.frontend.category.activeFilter});
    const clearAllLink = this.page.getByRole('link', {name: UIReference.text.shared.buttons.clearAll});

    // Scroll to the size filter to trigger Alpine.js deferred initialization
    await sizeFilterButton.scrollIntoViewIfNeeded();

    // Check if the size filter is already opened, if not open it
    await expect(async () => {
      const isExpanded = await sizeFilterButton.getAttribute('aria-expanded');
      if (isExpanded !== 'true') {
        await sizeFilterButton.click();
      }
      await expect(sizeMButton).toBeVisible();
    }).toPass();

    // Determine the expected size filter slug based on the environment
    let expectedSizeFilterSlug: string;
	if(isLocalhost(this.page.url())){
		expectedSizeFilterSlug = 'size=168';
	} else {
		expectedSizeFilterSlug = 'size=M';
	}

    // Click on the M filter option
    await sizeMButton.click();

    await this.page.waitForURL(slugToRegex(expectedSizeFilterSlug));

    // Verify active filtering is shown and Clear All link is available
    await expect(activeFilteringButton, 'Active filtering button should be visible').toBeVisible();
    await expect(clearAllLink, 'Clear All link should be visible').toBeVisible();
  }

  /**
   * @feature Sort category page by price
   * @scenario User sorts category page by price
   * @given I am on the category page
   * @when I open the 'Sort' dropdown
   * @and I click the price button
   * @then the URL should reflect this filter
   * @and I should see products sorted by price
   */
  async sortProducts(attribute:string){
    const sortButton = this.page.getByLabel(UIReference.text.frontend.category.sortBy);
    await sortButton.selectOption(attribute);
    const sortRegex = new RegExp(`[?&]product_list_order=${attribute}`);
    await this.page.waitForURL(sortRegex);

    const selectedValue = await this.page.$eval(UIReference.selectors.frontend.category.sortBy, sel => (sel as HTMLSelectElement).value);

    // sortButton should now display attribute
    expect(selectedValue, `Sort button should now display ${attribute}`).toEqual(attribute);
    // URL now has ?product_list_order=${attribute}
    expect(this.page.url(), `URL should contain ?product_list_order=${attribute}`).toContain(`product_list_order=${attribute}`);
  }

  /**
   * @feature products per page
   * @scenario User updates the amount of products shown on the page
   * @given I am on the category page
   * @when I change the 'Show' dropdown
   * @then the URl should reflect this filter
   * @and the amount of items should be the new amount I've selected
   */
  async showMoreProducts(){
    const itemsPerPageButton = this.page.getByLabel(UIReference.text.frontend.common.itemsPerPage);
    const productGrid = this.page.locator(UIReference.selectors.frontend.category.productGrid);

    await itemsPerPageButton.selectOption('36');
    const itemsRegex = /[?&]product_list_limit=36/;
    await this.page.waitForURL(itemsRegex);

    const amountOfItems = await productGrid.locator('li').count();

    expect(this.page.url(), `URL should contain ?product_list_limit=36`).toContain(`?product_list_limit=36`);
    expect(amountOfItems, `Amount of items on the page should be 36`).toBe(36);
  }

  /**
   * @feature View switcher
   * @scenario User switches from the grid to the list view
   * @given I am on the category page
   * @when I click the grid or list mode button
   * @then the URl should reflect this updated view
   * @and the reported selected view should not be the same as it was before I clicked the button
   */
  async switchView(){
    const viewSwitcher = this.page.getByLabel(UIReference.text.frontend.category.viewSwitch, {exact: true}).locator(UIReference.selectors.frontend.category.activeView);
    const activeView = await viewSwitcher.getAttribute('title');

    if(activeView == 'Grid'){
      await this.page.getByLabel(UIReference.text.frontend.category.viewList).click();
    } else {
      await this.page.getByLabel(UIReference.text.frontend.category.viewGrid).click();
    }

    const viewRegex = /[?&]product_list_mode=list/;
    await this.page.waitForURL(viewRegex);

    const newActiveView = await viewSwitcher.getAttribute('title');
    expect(newActiveView, `View (now ${newActiveView}) should be switched (old: ${activeView})`).not.toEqual(activeView);
    expect(this.page.url(),`URL should contain ?product_list_mode=${newActiveView?.toLowerCase()}`).toContain(`?product_list_mode=${newActiveView?.toLowerCase()}`);
  }
}

export default CategoryPage;
