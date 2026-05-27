// @ts-check

import { test } from '@playwright/test';
import { outcomeMarker } from '@config';
import NotificationValidatorUtils from "@utils/notificationValidator.utils";
import NewsletterPage from "@poms/frontend/newsletter.page";
import {requireEnv} from "@utils/env.utils";

import Footer from '@poms/frontend/footer.page';

test.describe('Footer', () => {

	test('Footer_is_available', {tag: ['@footer', '@cold']}, async ({page}) => {
			const footer = new Footer(page);

			await page.goto('');
			await footer.goToFooterElement();
	});

	/**
	 * May 27th, 2026 - this test is set to fixme:
	 * Caching issues on the demo website causes issues for the currency switching fuctionality.
	 * This means this test fails and causes the entire suite to fail.
	 * Unset 'fixme' when caching issue has been resolved.
	 */
	test.fixme('Footer_switch_currency', {tag: ['@footer', '@cold']}, async ({page}) => {
			const footer = new Footer(page);

			await page.goto('');
			await footer.switchCurrency();
	});

	test('Footer_newsletter_subscription', {tag: ['@footer', '@cold']}, async ({page}, testInfo) => {
			const newsletterPage = new NewsletterPage(page);

			await page.goto(requireEnv('PLAYWRIGHT_BASE_URL'));
			await newsletterPage.footerSubscribeToNewsletter();

			const subscriptionOutput = outcomeMarker.footerPage.newsletterSubscription;
			const notificationType = 'Newsletter subscription notification';

			const notificationValidator = new NotificationValidatorUtils(page, testInfo);
			await notificationValidator.validate(subscriptionOutput);
	});
})
