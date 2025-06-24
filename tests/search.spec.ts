// @ts-check

import { test, expect } from '@playwright/test';
import { UIReference, outcomeMarker, inputValues, slugs } from 'config';

import SearchPage from './poms/frontend/search.page';

test.describe('Search functionality', () => {
  test('Search query returns multiple results', async ({ page }) => {
    await page.goto('');
    const searchPage = new SearchPage(page);
    await searchPage.search(inputValues.search.queryMultipleResults);
    await expect(page).toHaveURL(new RegExp(slugs.search.resultsSlug));
    const results = page.locator(`${UIReference.categoryPage.productGridLocator} li`);
    await expect(results).toHaveCountGreaterThan(1);
  });

  test('User can find a specific product and navigate to its page', async ({ page }) => {
    await page.goto('');
    const searchPage = new SearchPage(page);
    await searchPage.search(inputValues.search.querySpecificProduct);
    await page.getByRole('link', { name: UIReference.productPage.simpleProductTitle }).first().click();
    await expect(page).toHaveURL(slugs.productpage.simpleProductSlug);
  });

  test('No results message is shown for unknown query', async ({ page }) => {
    await page.goto('');
    const searchPage = new SearchPage(page);
    await searchPage.search(inputValues.search.queryNoResults);
    await expect(page.getByText(outcomeMarker.search.noResultsMessage)).toBeVisible();
  });

  test('Suggestions appear while typing', async ({ page }) => {
    await page.goto('');
    const searchPage = new SearchPage(page);
    await searchPage.typeQuery(inputValues.search.queryMultipleResults);
    await expect(searchPage.suggestionBox).toBeVisible();
  });
});
