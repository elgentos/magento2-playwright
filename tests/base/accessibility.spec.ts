import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import toggles from './config/test-toggles.json';

import slugs from './config/slugs.json';

/**
 * The tests below scan the page for accessibility issues that are detectable by an automated test.
 * This is not a fool-proof method; for example, automated tests can't detect all types of WCAG violations.
 * Playwright recommends combining these automated tests with manual testing and inclusive user testing.
 * For manual assessments, Playwright recommends Accessibility Insights for Web, a free and open source dev tool that walks you through assessing a website for WCAG 2.1 AA coverage.
 * See: https://accessibilityinsights.io/docs/web/overview/
 */

if(toggles.general.accessibility){

  /**
   * @feature Home page Automated Accessibility Scan
   * @scenario The home page is scanned to detect accessibility issues
   * @given I navigate to the home page
   * @when I scan the page for automatically detectable accessibility issues
   * @then I should not get any violations of the standards
   */
  test('Homepage_does_not_have_automatically_detectable_accessibility_issues',{ tag: '@accessibility',}, async ({page}, testInfo) => {
    await page.goto('');

    // Analyze page
    const accessibilityScanResults = await new AxeBuilder({ page })
    .disableRules([])
    .analyze();  

    // attach scan results to reporter
    await testInfo.attach('accessibility-scan-results', {
      body: JSON.stringify(accessibilityScanResults, null, 2),
      contentType: 'application/json'
    });

    expect(accessibilityScanResults.violations).toEqual([]);
  });


  /**
   * @feature Category Automated Accessibility Scan
   * @scenario The category page is scanned to detect accessibility issues
   * @given I navigate to the category page
   * @when I scan the page for automatically detectable accessibility issues
   * @then I should not get any violations of the standards
   */
  test('Category_page_does_not_have_automatically_detectable_accessibility_issues',{ tag: '@accessibility',}, async ({page}, testInfo) => {
    await page.goto(slugs.categoryPage.categorySlug);

    // Analyze page
    const accessibilityScanResults = await new AxeBuilder({ page })
    .disableRules([])
    .analyze();  

    // attach scan results to reporter
    await testInfo.attach('accessibility-scan-results', {
      body: JSON.stringify(accessibilityScanResults, null, 2),
      contentType: 'application/json'
    });

    expect(accessibilityScanResults.violations).toEqual([]);
  });


  /**
   * @feature Product page Automated Accessibility Scan
   * @scenario The product page is scanned to detect accessibility issues
   * @given I navigate to the product page
   * @when I scan the page for automatically detectable accessibility issues
   * @then I should not get any violations of the standards
   */
  test('Product_page_does_not_have_automatically_detectable_accessibility_issues',{ tag: '@accessibility',}, async ({page}, testInfo) => {
    await page.goto(slugs.productpage.simpleProductSlug);

    // Analyze page
    const accessibilityScanResults = await new AxeBuilder({ page })
    .disableRules([])
    .analyze();  

    // attach scan results to reporter
    await testInfo.attach('accessibility-scan-results', {
      body: JSON.stringify(accessibilityScanResults, null, 2),
      contentType: 'application/json'
    });

    expect(accessibilityScanResults.violations).toEqual([]);
  });  
}