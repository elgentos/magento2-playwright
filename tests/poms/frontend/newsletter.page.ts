// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, outcomeMarker, inputValues } from '@config';
import { faker } from '@faker-js/faker';

export class BaseNewsletterSubscriptionPage {
	constructor(public readonly page: Page) {}

	// ==============================================
	// Element getters
	// ==============================================

	// get newsLetterFormFields - returns field locators to update newsletter subscription
	get newsLetterFormFields() {
		return {
			newsletterCheckElement: this.page.getByRole('switch', {
				name: UIReference.text.frontend.newsletter.generalSubscription,
			}),
			saveSubscriptionsButton: this.page.getByRole('button', {
				name: UIReference.text.shared.buttons.save,
			}),
		};
	}

	// ==============================================
	// Page-interaction methods
	// ==============================================

	/**
	 * Method: update subcsription to newsletter.
	 * @returns subscribed {boolean} - true if user is now subscribed,
	 * false if the user is unsubscribed.
	 */
	async updateNewsletterSubscription() {
		const { newsletterCheckElement, saveSubscriptionsButton } = this.newsLetterFormFields;

		let subscriptionUpdatedNotification = outcomeMarker.account.newsletterRemovedNotification;
		let subscribed = false;

		if (await newsletterCheckElement.isChecked()) {
			// user is already subscribed, test runs unsubscribe
			await newsletterCheckElement.uncheck();
			await saveSubscriptionsButton.click();
		} else {
			// user is not yet subscribed, test runs subscribe
			subscriptionUpdatedNotification = outcomeMarker.account.newsletterSavedNotification;

			await newsletterCheckElement.check();
			await saveSubscriptionsButton.click();

			subscribed = true;
		}

		await expect(this.page.getByText(subscriptionUpdatedNotification)).toBeVisible();
		return subscribed;
	}
}
