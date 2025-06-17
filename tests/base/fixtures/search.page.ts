import { expect, type Locator, type Page } from '@playwright/test';

import UIReference from '../config/element-identifiers/element-identifiers.json';
import outcomeMarker from '../config/outcome-markers/outcome-markers.json';
import slugs from '../config/slugs.json';

class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly suggestionNav: Locator;
  readonly toggleButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(UIReference.search.searchInputPlaceholder);
    this.suggestionNav = page.getByRole('navigation', { name: UIReference.search.suggestionNavLabel });
    this.toggleButton = page.getByLabel(UIReference.search.toggleButtonLabel);
  }

  async gotoHome() {
    await this.page.goto('');
    await this.toggleButton.click();
    await this.searchInput.waitFor({ state: 'visible' });
  }

  async type(term: string) {
    await this.searchInput.fill(term);
  }

  async submit() {
    await this.searchInput.press('Enter');
    await this.page.waitForURL(new RegExp(`${slugs.search.searchResultsSlug}.*`));
  }

  async search(term: string) {
    await this.type(term);
    await this.submit();
  }

  async expectMultipleResults() {
    const results = this.page.locator(UIReference.search.resultItemLinkLocator);
    const count = await results.count();
    expect(count, `Expected more than one result, got ${count}`).toBeGreaterThan(1);
  }

  async openProduct(product: string, slug: string) {
    await this.page.getByRole('link', { name: product, exact: true }).first().click();
    await expect(this.page).toHaveURL(new RegExp(`${slug}.*`));
  }

  async expectNoResults() {
    await expect(this.page.getByText(outcomeMarker.search.noResultsText)).toBeVisible();
  }

  async expectSuggestions() {
    const suggestions = this.suggestionNav.locator('button');
    const count = await suggestions.count();
    expect(count, `Expected suggestions to appear`).toBeGreaterThan(0);
  }
}

export default SearchPage;

