// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, slugs } from '@config';
import { slugToRegex } from '@utils/url.utils';

export class BaseSearchPage {
	constructor(public readonly page: Page) {}

	// ==============================================
	// Element getters
	// ==============================================

	/**
	 * get SearchForm
	 * Returns the elements associated with the search form
	 */
	get SearchForm() {
		return {
			toggle: this.page.locator(UIReference.selectors.frontend.search.toggle),
			inputField: this.page.locator(UIReference.selectors.frontend.search.input),
			suggestedResultsBox: this.page.locator(
				UIReference.selectors.frontend.search.suggestionBox,
			),
		};
	}

	// ==============================================
	// Search Interaction Methods
	// ==============================================

	/**
	 * Method to open the search form.
	 * Used in the tests in search.spec.ts.
	 */
	async openSearch() {
		await this.SearchForm.toggle.waitFor({ state: 'visible' });
		await this.SearchForm.toggle.click();

		// Final assertion: confirm search field is now visible
		await expect(this.SearchForm.inputField, `search field is visible`).toBeVisible();
	}

	/**
	 * Method to search for something using the search form.
	 * @param query {string} - what to search for.
	 * Used in the tests in search.spec.ts.
	 */
	async search(query: string) {
		await this.openSearch();
		await this.SearchForm.inputField.fill(query);
		await this.SearchForm.inputField.press('Enter');

		// Final assertion within method: wait for page to navigate to results
		await this.page.waitForURL(slugToRegex(slugs.frontend.search.results));
	}
}
