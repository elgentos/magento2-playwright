// @ts-check

import { expect, Locator, type Page } from '@playwright/test';
import { UIReference, outcomeMarker } from '@config';
import { faker } from '@faker-js/faker';

export class Footer {
	constructor(public readonly page: Page) {}

	// ==============================================
	// Element getters
	// ==============================================

	// get footerElement: returns the locator for the footer element.
	get footerElement() {
		return this.page.locator(UIReference.selectors.frontend.footer.footer);
	}

	// get newsLetterFormItems: returns the fields
	// of the newsletter subscription form in the footer.
	get newsLetterFormItems() {
		return {
			emailField: this.page.getByRole('textbox', {
				name: UIReference.text.frontend.footer.newsletterInput,
			}),
			subscribeButton: this.page.getByRole('button', {
				name: UIReference.text.frontend.footer.newsletterSubscribe,
			}),
		};
	}

	// get messageLocators: return message locators
	get messageLocators() {
		return {
			generalMessage: this.page.locator(UIReference.selectors.shared.message),
			successMessage: this.page.locator(UIReference.selectors.shared.successMessage),
		};
	}

	// ==============================================
	// Navigation methods
	// ==============================================

	/**
	 * Method to navigate to the footer.
	 * Navigates to the homepage, then ensures the footer is visible.
	 */
	async goToFooterElement() {
		await this.page.goto('', { waitUntil: 'load' });
		await this.footerElement.scrollIntoViewIfNeeded();

		// Final assertion to ensure footer is visible.
		await expect(this.footerElement, 'Footer is visible').toBeVisible();
	}

	// ==============================================
	// Footer interaction methods
	// ==============================================

	/**
	 * Method to subscribe switch shown currency on the page.
	 * Used in the test "Footer_switch_currency"
	 */
	async switchCurrency() {
		await this.goToFooterElement();

		const isUsdActive = await this.page
			.getByRole('button', {
				name: UIReference.text.frontend.footer.currencyDollar,
			})
			.isVisible();

		const currencyToOpen = isUsdActive
			? UIReference.text.frontend.footer.currencyDollar
			: UIReference.text.frontend.footer.currencyEuro;
		const currencyToSelect = isUsdActive
			? UIReference.text.frontend.footer.currencyEuro
			: UIReference.text.frontend.footer.currencyDollar;

		await this.page.getByRole('button', { name: currencyToOpen }).click();

		await expect(
			this.page.getByRole('navigation', {
				name: UIReference.text.frontend.footer.currencyLabel,
			}),
			'Footer navigation is visible',
		).toBeVisible();

		await this.page.getByRole('link', { name: currencyToSelect }).click();

		await this.goToFooterElement();

		await expect(
			this.page.getByRole('button', { name: currencyToSelect }),
			'Currency selector is visible',
		).toBeVisible();
	}

	/**
	 * Method to subscribe to the newsletter through the footer.
	 * Used in the test "Footer_newsletter_subscription"
	 */
	async subscribeToNewsletter() {
		const subscriptionOutput = outcomeMarker.footerPage.newsletterSubscription;
		await expect(
			this.newsLetterFormItems.emailField,
			'Confirm newsletter form in footer is visible',
		).toBeVisible();

		await this.newsLetterFormItems.emailField.fill(faker.internet.email());
		await this.newsLetterFormItems.subscribeButton.click();
		await this.messageLocators.successMessage.waitFor();

		// Final assertion to confirm test ran correctly.
		await expect(this.messageLocators.successMessage).toContainText(subscriptionOutput);
	}
}
