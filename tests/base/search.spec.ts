import { test } from '@playwright/test';
import SearchPage from './fixtures/search.page';
import UIReference from './config/element-identifiers/element-identifiers.json';
import slugs from './config/slugs.json';

/**
 * @feature Search functionality
 */

test.describe('Search features', { tag: '@search' }, () => {
  test.beforeEach(async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.gotoHome();
  });

  /**
   * @scenario A search query returns multiple results
   */
  test('Search shows multiple results', async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.search('bag');
    await searchPage.expectMultipleResults();
  });

  /**
   * @scenario Find specific product and open product page
   */
  test('User can open product from search results', async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.search(UIReference.productPage.simpleProductTitle);
    await searchPage.openProduct(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
  });

  /**
   * @scenario Display page when no results are found
   */
  test('No results page is shown for unknown query', async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.search('unfindable-product-name');
    await searchPage.expectNoResults();
  });
});

