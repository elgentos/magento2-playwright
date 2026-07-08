// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, slugs } from '@config';
import { slugToRegex } from '@utils/url.utils';
import MainmenuPage from '@poms/frontend/mainmenu.page';

class LoginPage {
	readonly page: Page;
	readonly loginEmailField: Locator;
	readonly loginPasswordField: Locator;
	readonly loginButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.loginEmailField = page.getByRole('textbox', { name: UIReference.credentials.emailFieldLabel, exact: true });
		this.loginPasswordField = page.getByRole('textbox', { name: UIReference.credentials.passwordFieldLabel });
		this.loginButton = page.getByRole('button', { name: UIReference.credentials.loginButtonLabel });
	}

	async login(email: string, password: string) {
		const mainmenu = new MainmenuPage(this.page);

		await this.page.goto(slugs.account.loginSlug);
		await this.loginEmailField.fill(email);
		await this.loginPasswordField.fill(password);
		// usage of .press("Enter") to prevent webkit issues with button.click();
		// await this.loginButton.press("Enter");
		await this.loginButton.click();

		await this.page.waitForURL(slugToRegex(slugs.account.accountOverviewSlug));

		/**
		 * CACHING ISSUE WORKAROUND
		 * Due to caching issues, the main menu might not update properly with a logged-in state.
		 * We therefore navigate to the page again to ensure proper functionality.
		 */
		await this.page.goto(slugs.account.accountOverviewSlug);


		// await expect(this.page.getByRole('link', {name: 'Sign Out'}), 'Sign out button on account page is visible').toBeVisible();

		// Open the account menu, then check the 'Sign Out' button is visible.
		await mainmenu.mainMenuAccountButton.waitFor();
		await mainmenu.mainMenuAccountButton.click();
		await expect(mainmenu.mainMenuLogoutItem, 'Sign Out button is visible, user is logged in').toBeVisible();
	}

	async loginExpectError(email: string, password: string, errorMessage: string) {
		await this.page.goto(slugs.account.loginSlug);
		await this.loginEmailField.fill(email);
		await this.loginPasswordField.fill(password);
		await this.loginButton.press('Enter');
		await this.page.waitForLoadState('networkidle');

		await expect(this.page, 'Should stay on login page').toHaveURL(slugToRegex(slugs.account.loginSlug));
	}
}

export default LoginPage;
