import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import toggles from './config/test-toggles.json';

// Accessibility checks
if(toggles.general.accessibility){
  test('Homepage_does_not_have_automatically_detectable_accessibility_issues',{ tag: '@accessibility',}, async ({page}, testInfo) => {
    await page.goto('');

    // Analyze page
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();  

    // attach scan results to reporter
    await testInfo.attach('accessibility-scan-results', {
      body: JSON.stringify(accessibilityScanResults, null, 2),
      contentType: 'application/json'
    });

    expect(accessibilityScanResults.violations).toEqual([]);
  });
}