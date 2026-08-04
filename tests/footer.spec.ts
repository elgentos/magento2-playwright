// @ts-check

import { test } from '@playwright/test';
import { BaseFooter } from '@poms/frontend/footer.page';

test.describe('Footer', () => {
	/**
	 * Test: confirm the footer is available
	 * Navigates to the home page, then scrolls to the footer if needed.
	 * Finally, checks footer is visible.
	 */
	test('Footer_is_available', { tag: ['@footer', '@cold'] }, async ({ page }) => {
		const footer = new BaseFooter(page);
		await footer.goToFooterElement();
	});

	/**
	 * May 27th, 2026 - this test is set to fixme:
	 * Caching issues on the demo website causes issues for the currency switching fuctionality.
	 * This means this test fails and causes the entire suite to fail.
	 * Unset 'fixme' when caching issue has been resolved.
	 */
	test.fixme('Footer_switch_currency', { tag: ['@footer', '@cold'] }, async ({ page }) => {
		const footer = new BaseFooter(page);
		await footer.goToFooterElement();
		await footer.switchCurrency();
	});

	/**
	 * Test: subscribe to the newsletter via the footer.
	 * Navigates to the home page, then scrolls to the footer if needed.
	 * Fills in the fields and clicks the subscribe button.
	 * Finally, checks if user is notified of success.
	 */
	test(
		'Footer_newsletter_subscription',
		{ tag: ['@footer', '@cold'] },
		async ({ page }, testInfo) => {
			const footer = new BaseFooter(page);
			await footer.goToFooterElement();
			await footer.subscribeToNewsletter();
		},
	);
});
