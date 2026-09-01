// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, slugs } from '@config';
import { slugToRegex } from '@utils/url.utils';
import NotificationValidatorUtils from '@utils/notificationValidator.utils';
import { BaseMainMenuPage } from '@poms/frontend/mainmenu.page';

export class BaseLoginPage {
	constructor(public readonly page: Page) {}

	// ==============================================
	// Element getters
	// ==============================================

	// get comparePageTitle: returns title locator for comparison page.
	protected get loginPageTitle(): Locator {
		return this.page.getByRole('heading', {
			name: UIReference.text.frontend.login.title,
			level: 1,
		});
	}

	// get loginFormFields: returns the input and button locators of the login form.
	get loginFormFields() {
		return {
			emailField: this.page.getByRole('textbox', {
				name: UIReference.text.shared.forms.email,
				exact: true,
			}),
			passwordField: this.page.getByRole('textbox', {
				name: UIReference.text.shared.forms.password,
			}),
			loginButton: this.page.getByRole('button', {
				name: UIReference.text.shared.buttons.login,
			}),
		};
	}

	// ==============================================
	// Navigation methods
	// ==============================================

	/**
	 * Method to navigate to comparison page
	 */
	async goToLoginPage() {
		await this.page.goto(slugs.frontend.account.login);
		await this.page.waitForLoadState();

		await expect(this.loginPageTitle, 'Checkpoint: login page title is visible').toBeVisible();
	}

	// ==============================================
	// Authentication methods
	// ==============================================

	/**
	 * Method: log in with the provided credentials.
	 * @param email {string} - email address of the account to log in with.
	 * @param password {string} - password of the account to log in with.
	 */
	async login(email: string, password: string) {
		const mainmenu = new BaseMainMenuPage(this.page);

		await this.loginFormFields.emailField.fill(email);
		await this.loginFormFields.passwordField.fill(password);
		// usage of .press("Enter") to prevent webkit issues with button.click();
		await this.loginFormFields.loginButton.click();

		await this.page.waitForURL(slugToRegex(slugs.frontend.account.overview));
		expect(this.page.url()).toContain(slugs.frontend.account.overview);

		// Assertion to confirm the user is logged in.
		await expect(async () => {
			// Open the account menu, then check the 'Sign Out' button is visible.
			await mainmenu.mainMenuAccountButton.waitFor();
			await mainmenu.mainMenuAccountButton.click();
			await expect(
				mainmenu.mainMenuLogoutItem,
				'Sign Out button is visible, user is logged in',
			).toBeVisible();
		}).toPass();
	}

	/**
	 * Method: attempt to log in and expect to remain on the login page.
	 * @param email {string} - email address used in the login attempt.
	 * @param password {string} - password used in the login attempt.
	 * @param errorMessage {string} - error message expected to be shown.
	 */
	async loginExpectError(email: string, password: string, errorMessage: string) {
		await this.page.goto(slugs.frontend.account.login);
		await this.loginFormFields.emailField.fill(email);
		await this.loginFormFields.passwordField.fill(password);
		await this.loginFormFields.loginButton.press('Enter');
		await this.page.waitForLoadState('networkidle');

		// Assertion to confirm the login attempt failed.
		await expect(this.page, 'Should stay on login page').toHaveURL(
			slugToRegex(slugs.frontend.account.login),
		);
		if (errorMessage) {
			await new NotificationValidatorUtils(this.page).validate(errorMessage);
		} else {
			const validationMessage = await this.loginFormFields.passwordField.evaluate(
				(field: HTMLInputElement) => field.validationMessage,
			);
			expect(validationMessage, 'Password field should report a validation error').not.toBe(
				'',
			);
		}
	}
}
