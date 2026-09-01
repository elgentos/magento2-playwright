// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, outcomeMarker, slugs } from '@config';
import { requireEnv } from '@utils/env.utils';
import { slugToRegex } from '@utils/url.utils';


export class RegisterPage {
	constructor(public readonly page: Page) { }

	// ==============================================
	// Element getters
	// ==============================================

	/**
	 * get categoryPageTitle
	 * Returns locator for category page title.
	 */
	protected get registerPageTitle(): Locator {
		return this.page.getByRole('heading', { name: UIReference.text.frontend.register.title });
	}

	/**
	 * get registerFormFields
	 * Returns the form fields associated with the 'create an account' form
	 */
	get registerForm() {
		return {
			firstNameField : this.page.getByLabel(UIReference.text.shared.forms.firstName),
			lastNameField : this.page.getByLabel(UIReference.text.shared.forms.lastName),
			emailField : this.page.getByRole('textbox', { name: UIReference.text.shared.forms.email, exact: true }),
			passwordField : this.page.getByRole('textbox', { name: UIReference.text.shared.forms.password, exact: true }),
			repeatPasswordField : this.page.getByRole('textbox', { name: UIReference.text.shared.forms.passwordConfirm }),
			createAccountButton : this.page.getByRole('button', { name: UIReference.text.frontend.common.navigation.createAccount })
		}
	}

	/**
	 * get accountInfoField:
	 * Returns the field that shows the user's emailaddress
	 * in the dashboard after creating an account.
	 */
	get accountInfoField() {
		return this.page.locator(UIReference.selectors.frontend.account.accountInformationField).first();
	}

	// ==============================================
	// Navigation methods
	// ==============================================

	/**
	 * Method to navigate to category page
	 */
	async goToRegisterPage() {
		await this.page.goto(slugs.frontend.account.create);
		await this.page.waitForLoadState();

		await expect(this.registerPageTitle).toBeVisible();
	}

	// ==============================================
	// Form interaction methods
	// ==============================================

	/**
	 * Method to create an account through the 'create an account' form.
	 * Used in the test 'User_registers_an_account'.
	 * @param firstName {string} - first name to use for the account.
	 * @param lastName {string} - last name to use for the account.
	 * @param email {string} - email to use for the account.
	 * @param password {string} - password to use for the account.
	 */
	async createNewAccount(firstName: string, lastName: string, email: string, password: string) {
		// declare form elements from getter here to simplify variables.
		const { firstNameField, lastNameField, emailField, passwordField, repeatPasswordField, createAccountButton } = this.registerForm;

		await firstNameField.fill(firstName);
		await lastNameField.fill(lastName);
		await emailField.fill(email);
		await passwordField.fill(password);
		await repeatPasswordField.fill(password);
		await createAccountButton.click();

		await this.page.waitForURL(slugToRegex(slugs.frontend.account.overview, true));

		// Checkpoint: success message visible.
		await expect(this.page.getByRole('alert'),`account has been created`)
			.toContainText(outcomeMarker.account.accountCreatedNotificationText
		);

		// Final assertion: navigate to account dashboard and confirm our email is visible
		await this.page.goto(slugs.frontend.account.overview);

		await expect(this.page.getByRole('heading',
			{ name: UIReference.text.frontend.account.dashboardTitle, level: 2 }),
			`Heading "${UIReference.text.frontend.account.dashboardTitle}" is visible`
		).toBeVisible();
		await expect(this.accountInfoField, `Account information should contain email: ${email}`).toContainText(email);
	}
}
