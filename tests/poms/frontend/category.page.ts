// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, slugs } from '@config';
import { slugToRegex, isLocalhost } from '@utils/url.utils';

export class BaseCategoryPage {
	constructor(public readonly page: Page) { }

	// ==============================================
	// Element getters
	// ==============================================

	/**
	 * get categoryPageTitle
	 * Returns locator for category page title.
	 */
	protected get categoryPageTitle(): Locator {
		return this.page.getByRole('heading', { name: UIReference.text.frontend.category.title });
	}

	/**
	 * get categoryFilterItems
	 * Returns category filter locators.
	 */
	get categoryFilterItems() {
		const filterRegion = this.page.getByRole('region', { name: UIReference.text.frontend.category.filterRegion });
		return {
			filterRegion,
			attributeFilterButton : filterRegion.getByRole('button', { name: UIReference.text.frontend.category.sizeFilter }),
			attributeOption : filterRegion.getByRole('link', { name: UIReference.text.frontend.category.sizeM }),
			activeFilteringButton : this.page.getByRole('button', { name: UIReference.text.frontend.category.activeFilter }),
			clearAllLink : this.page.getByRole('link', { name: UIReference.text.shared.buttons.clearAll })
		}
	}

	get moreProductItems() {
		return {
			itemsPerPageButton : this.page.getByLabel(UIReference.text.frontend.common.itemsPerPage),
			productGrid : this.page.locator(UIReference.selectors.frontend.category.productGrid)
		}
	}

	/**
	 * get sortButton
	 * Returns locator for category sort button.
	 */
	get sortButton() {
		return this.page.getByLabel(UIReference.text.frontend.category.sortBy);
	}

	get viewSwitcher() {
		return this.page.getByLabel(UIReference.text.frontend.category.viewSwitch, { exact: true }).locator(UIReference.selectors.frontend.category.activeView);
	}

	// ==============================================
	// Navigation methods
	// ==============================================

	/**
	 * Method to navigate to category page
	 */
	async goToCategoryPage() {
		await this.page.goto(slugs.frontend.category.index);
		await this.page.waitForLoadState();

		await expect(this.categoryPageTitle).toBeVisible();
	}


	// ==============================================
	// Page-interaction methods
	// ==============================================


	/**
	 * Method to filter category on an attribute.
	 * Default attribute is size,
	 * but locators can be updated to filter on different attribute.
	 */
	async filterOnAttribute() {
		// declare 'this.categoryFilterItems' once to avoid having to use it everywhere.
		const { attributeFilterButton, attributeOption, activeFilteringButton, clearAllLink } = this.categoryFilterItems;

		// Scroll to the attribute filter to trigger Alpine.js deferred initialization
		await attributeFilterButton.scrollIntoViewIfNeeded();

		// Check if the size filter is already opened, if not open it
		await expect(async () => {
			const isExpanded = await attributeFilterButton.getAttribute('aria-expanded');

			if (isExpanded !== 'true') {
				await attributeFilterButton.click();
			}

			await expect(attributeOption).toBeVisible();
		}).toPass();

		// Determine the expected size filter slug based on the environment
		let expectedSizeFilterSlug: string;
		isLocalhost(this.page.url()) ? expectedSizeFilterSlug = 'size=168' : expectedSizeFilterSlug = 'size=M';


		await attributeOption.click();
		await this.page.waitForURL(slugToRegex(expectedSizeFilterSlug));

		// Verify active filtering is shown and Clear All link is available
		await expect(activeFilteringButton, 'Active filtering button should be visible').toBeVisible();
		await expect(clearAllLink, 'Clear All link should be visible').toBeVisible();
	}


	/**
	 * Method to sort products on category price by attribute.
	 * default attribute given in test is price.
	 */
	async sortProducts(attribute: string) {
		const sortRegex = new RegExp(`[?&]product_list_order=${attribute}`);

		await this.sortButton.selectOption(attribute);
		await this.page.waitForURL(sortRegex);

		const selectedValue = await this.page.$eval(UIReference.selectors.frontend.category.sortBy, sel => (sel as HTMLSelectElement).value);

		// Verification:
		// Sort button should show selected attribute, and url should have ordering appended
		expect(selectedValue, `Sort button should now display ${attribute}`).toEqual(attribute);
		expect(this.page.url(), `URL should contain ?product_list_order=${attribute}`).toContain(`product_list_order=${attribute}`);
	}


	/**
	 * Method for the test "Change_amount_of_products_shown"
	 * Selects a higher 'items per page button' than currently shown,
	 * then confirms these changes have taken effect.
	 */
	async showMoreProducts() {
		const { itemsPerPageButton, productGrid } = this.moreProductItems;

		await itemsPerPageButton.selectOption('36');
		const itemsRegex = /[?&]product_list_limit=36/;
		await this.page.waitForURL(itemsRegex);

		const amountOfItems = await productGrid.locator('li').count();

		expect(this.page.url(), `URL should contain ?product_list_limit=36`).toContain(`?product_list_limit=36`);
		expect(amountOfItems, `Amount of items on the page should be 36`).toBe(36);
	}

	/**
	 * Method to update the view begin used.
	 * Retrieves current view (grid or list) and switches to the other.
	 */
	async switchView() {
		const activeView = await this.viewSwitcher.getAttribute('title');
		const viewRegex = /[?&]product_list_mode=list/;

		if (activeView == 'Grid') {
			await this.page.getByLabel(UIReference.text.frontend.category.viewList).click();
		} else {
			await this.page.getByLabel(UIReference.text.frontend.category.viewGrid).click();
		}

		await this.page.waitForURL(viewRegex);

		const newActiveView = await this.viewSwitcher.getAttribute('title');
		expect(newActiveView, `View (now ${newActiveView}) should be switched (old: ${activeView})`).not.toEqual(activeView);
		expect(this.page.url(), `URL should contain ?product_list_mode=${newActiveView?.toLowerCase()}`).toContain(`?product_list_mode=${newActiveView?.toLowerCase()}`);
	}
}
