import { test, expect } from '@playwright/test';
import websites from './fixtures/before/websites.json';
import exampleExpects from './fixtures/verify/expects/example.json';
import exampleSelectors from './fixtures/during/selectors/example.json';

/**
 * @feature Playwright websites title verification
 *   @scenario User verifies the title of the Playwright website
 *     @given I navigate to the Playwright website
 *     @then the page title should contain "Playwright"
 */
test('User verifies the title of the Playwright website', async ({ page }) => {
  await page.goto(websites.playwrightWebsite);
  await expect(page).toHaveTitle(new RegExp(exampleExpects.playwrightPageTitle));
});

/**
 * @feature Get started navigation
 *    @scenario User navigates to the Installation page via the Get Started link
 *      @given  I am on the Playwright website
 *      @when   I click on the "Get started" link
 *      @then   I should see the "Installation" heading
 */
test('User navigates to the Installation page via the Get Started link', async ({ page }) => {
  await page.goto(websites.playwrightWebsite);
  await page.getByRole('link', { name: exampleSelectors.getStartedSelectorText }).click();
  await expect(page.getByRole('heading', { name: exampleExpects.playwrightHeader})).toBeVisible();
});
