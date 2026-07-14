// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, outcomeMarker, inputValues } from '@config';
import { faker } from '@faker-js/faker'

class NewsletterSubscriptionPage {
	readonly page: Page;
	readonly newsletterCheckElement: Locator;
	readonly saveSubscriptionsButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.newsletterCheckElement = page.getByRole('switch', { name: UIReference.text.frontend.newsletter.generalSubscription });
		this.saveSubscriptionsButton = page.getByRole('button', { name: UIReference.text.shared.buttons.save });
	}

	async updateNewsletterSubscription() {

		let subscriptionUpdatedNotification = outcomeMarker.account.newsletterRemovedNotification;
		let subscribed = false;

		if (await this.newsletterCheckElement.isChecked()) {
			// user is already subscribed, test runs unsubscribe
			await this.newsletterCheckElement.uncheck();
			await this.saveSubscriptionsButton.click();

		} else {
			// user is not yet subscribed, test runs subscribe
			subscriptionUpdatedNotification = outcomeMarker.account.newsletterSavedNotification;

			await this.newsletterCheckElement.check();
			await this.saveSubscriptionsButton.click();

			subscribed = true;
		}

		await expect(this.page.getByText(subscriptionUpdatedNotification)).toBeVisible();
		return subscribed;
	}

	async footerSubscribeToNewsletter() {
		await expect(this.page.getByRole('textbox', { name: UIReference.text.frontend.footer.newsletterInput })).toBeVisible();
		await this.page.getByRole('textbox', { name: UIReference.text.frontend.footer.newsletterInput }).fill(faker.internet.email());
		await this.page.getByRole('button', { name: UIReference.text.frontend.footer.newsletterSubscribe }).click();
	}
}

export default NewsletterSubscriptionPage;
