// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { UIReference, outcomeMarker, slugs } from '@config';
import NotificationValidatorUtils from '@utils/notificationValidator.utils';

export class ContactPage {
	constructor(public readonly page: Page) {}

	// ==============================================
	// Element getters
	// ==============================================

	// get contactPageTitle: returns title locator for the contact page.
	protected get contactPageTitle(): Locator {
		return this.page.getByRole('heading', { name: UIReference.text.frontend.contact.title });
	}

	// get formFields - returns field locators for the contact form
	get formFields() {
		return {
			nameField: this.page.getByLabel(UIReference.text.shared.forms.name),
			emailField: this.page.getByRole('textbox', {
				name: UIReference.text.shared.forms.email,
				exact: true,
			}),
			messageField: this.page.locator(UIReference.selectors.frontend.contact.message),
			sendFormButton: this.page.getByRole('button', {
				name: UIReference.text.shared.buttons.submit,
			}),
		};
	}

	// ==============================================
	// Navigation methods
	// ==============================================

	/**
	 * Method to navigate to comparison page
	 */
	async goToContactPage() {
		await this.page.goto(slugs.frontend.contact.index);
		await this.page.waitForLoadState();

		// Final assertion to check steps have finsihed correctly.
		await expect(
			this.contactPageTitle,
			'Checkpoint: contact page title is visible',
		).toBeVisible();
	}

	// ==============================================
	// Interaction methods
	// ==============================================

	/**
	 * Method: fill out a contactform.
	 * Used in the test "Send_message_through_contact_form"
	 */
	async fillOutForm() {
		const messageSentConfirmationText = outcomeMarker.contactPage.messageSentConfirmationText;

		// // Add a wait for the form to be visible
		// await this.formFields.nameField.waitFor();

		await this.formFields.nameField.fill(faker.person.firstName());
		await this.formFields.emailField.fill(faker.internet.email());
		await this.formFields.messageField.fill(faker.lorem.paragraph());

		await this.formFields.sendFormButton.click();

		// Final assertions to confirm test performed correctly.
		await new NotificationValidatorUtils(this.page).validate(messageSentConfirmationText);
		await expect(this.formFields.nameField, 'name should be empty now').toBeEmpty();
		await expect(this.formFields.emailField, 'email should be empty now').toBeEmpty();
		await expect(this.formFields.messageField, 'message should be empty now').toBeEmpty();
	}
}
