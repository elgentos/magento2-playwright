// @ts-check

/**
 * Copyright Elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileoverview Various tests to maintain accessibility.
 * For more info, see the European Accessibility Act (EAA):
 * https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/european-accessibility-act-eaa_en
 * For more info on Web Content Accessibility Guidelines (WCAG), see:
 * https://www.w3.org/WAI/WCAG2A-Conformance
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { UIReference, slugs } from '@config';

/**
 * Test group for accessibility tests.
 * Creates a loop with an array of pages to check,
 * because the steps are identical for each page.
 */
test.describe('Accessibility Tests: EEA compliance', () => {

	const pagesToCheck: { label: string; slug: string; pageTitle: string }[] = [
		{ label: 'home', slug: '/', pageTitle: UIReference.text.frontend.home.title },
		{ label: 'plp', slug: slugs.frontend.category.index, pageTitle: UIReference.text.frontend.category.title},
		{ label: 'pdp', slug: slugs.frontend.product.simple, pageTitle: UIReference.text.frontend.product.simpleProduct },
		{ label: 'cart', slug: slugs.frontend.cart.index, pageTitle: UIReference.text.frontend.cart.title },
	];

	for (const { label, slug, pageTitle } of pagesToCheck) {
		/**
		 * Test: confirm the page does not have critical accessibility issues.
		 * @param page - Playwright page instance used for interacting with the website.
		 */
		test(`${label}page_passes_wcag2a_scan`, { tag: '@accessibility', }, async ({ page }, testInfo) => {
			await page.goto(slug);
			await page.waitForLoadState();
			let pageHeading = page.getByRole('heading', {name : pageTitle}).first();

			await expect(pageHeading,`Checkpoint: ${label} page title is visible`).toBeVisible();

			// Analyze page
			const axe = new AxeBuilder({ page }).withTags(['wcag2aa']);
			const accessibilityScanResults = await axe.analyze();

			// attach scan results to reporter
			await testInfo.attach(`${label}page_accessibility-scan-results`, {
				body: JSON.stringify(accessibilityScanResults, null, 2),
				contentType: 'application/json'
			});

			expect(accessibilityScanResults.violations).toEqual([]);
		});
	}
});
