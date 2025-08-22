// @ts-check

import { test } from '@playwright/test';
import { outcomeMarker } from '@config';
import NotificationValidatorUtils from "@utils/notificationValidator.utils";

import NewsletterPage from "@poms/frontend/newsletter.page";
import Footer from '@poms/frontend/footer.page';

test.describe('Footer', () => {

	test(
		'Footer_is_available',
		{tag: ['@footer', '@cold']},
		async ({page}) => {
			const footer = new Footer(page);

			await page.goto('');
			await footer.goToFooterElement();
		}
	)

	test(
		'Footer_switch_currency',
		{tag: ['@footer', '@cold']},
		async ({page}) => {
      test.fixme(true, 'this test currently does not work due to an error on the website.');
			const footer = new Footer(page);

			await page.goto('');
			await footer.switchCurrency();
		}
	)

	test(
		'Footer_newsletter_subscription',
		{tag: ['@footer', '@cold']},
		async ({page}, testInfo) => {
			const newsletterPage = new NewsletterPage(page);

			await page.goto('');
			await newsletterPage.footerSubscribeToNewsletter();

			const subscriptionOutput = outcomeMarker.footerPage.newsletterSubscription;
			const notificationType = 'Newsletter subscription notification';

			const notificationValidator = new NotificationValidatorUtils(page, testInfo);
			await notificationValidator.validate(notificationType, subscriptionOutput);
		}
	)
})
