// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { requireEnv } from '@utils/env.utils';
import { UIReference } from '@config';


class AdminLogin {
	// General
	readonly page: Page;
	readonly pageHeadingOne: Locator;
	readonly saveConfigButton: Locator;
	// Input Fields
	readonly adminLoginEmailField: Locator;
	readonly adminLoginPasswordField: Locator;
	readonly adminLoginButton: Locator;
	// Navigation
	readonly mainMenuStoresButton: Locator;
	readonly storesConfigurationButton: Locator;
	readonly storesCustomersTab: Locator;
	readonly advancedSettingsTab: Locator;
	readonly customerConfigurationLink: Locator;
	readonly adminSettingsLink:Locator;
	// Settings
	readonly customerCaptchaAccordion: Locator;
	readonly adminSecurityAccordion: Locator;
	readonly storeFrontCaptchaOption: Locator;
	readonly adminSharingOption: Locator;
	readonly customerCAPTCHAInheritCheckbox: Locator;
	readonly adminInheritCheckbox: Locator;
	// reCAPTCHA settings
	readonly storesSecurityTab: Locator;
	readonly googleReCaptchaStorefrontLink: Locator;
	readonly storefrontReCaptchaAccordion: Locator;
	readonly customerCreateReCaptchaOption: Locator;
	readonly customerCreateReCaptchaInheritCheckbox: Locator;


	constructor(page: Page) {
		// General
		this.page = page;
		this.pageHeadingOne = page.locator(UIReference.selectors.shared.pageTitle);
		this.saveConfigButton = page.getByRole('button', { name: UIReference.text.admin.common.saveConfig });
		// Input Fields
		this.adminLoginEmailField = page.locator(UIReference.selectors.admin.login.username);
		this.adminLoginPasswordField = page.locator(UIReference.selectors.admin.login.password);
		this.adminLoginButton = page.locator(UIReference.selectors.admin.login.loginButton);
		// Navigation
		this.mainMenuStoresButton = page.locator(UIReference.selectors.admin.common.adminMenu).getByRole('link', {name: UIReference.text.admin.common.stores});
		this.storesConfigurationButton = page.getByRole('link', {name: UIReference.text.admin.common.configuration}).first();
		this.storesCustomersTab = page.locator(UIReference.selectors.admin.common.configTabs).getByText(UIReference.text.admin.common.customers);
		this.advancedSettingsTab = page.getByRole('strong').filter({hasText: UIReference.text.admin.common.advanced});
		this.customerConfigurationLink = page.getByRole('link', { name: UIReference.text.admin.common.customerConfiguration });
		this.adminSettingsLink = page.getByRole('link', {name: UIReference.text.admin.common.admin, exact: true});
		// Settings
		this.customerCaptchaAccordion = page.getByRole('link', { name: 'CAPTCHA' }).filter({hasNotText: 'documentation'});
		this.adminSecurityAccordion = page.getByRole('link', { name: UIReference.text.admin.common.security });
		this.storeFrontCaptchaOption = page.getByLabel(UIReference.text.admin.configuration.captchaEnabled);
		this.adminSharingOption = page.getByLabel(UIReference.text.admin.configuration.adminSharing);
		this.customerCAPTCHAInheritCheckbox = page.locator(UIReference.selectors.admin.configuration.captchaEnableInherit);
		this.adminInheritCheckbox = page.locator(UIReference.selectors.admin.configuration.accountSharingInherit);
		// reCAPTCHA settings
		this.storesSecurityTab = page.locator(UIReference.selectors.admin.common.configTabs).getByText(UIReference.text.admin.common.security, {exact:true});
		this.googleReCaptchaStorefrontLink = page.getByRole('link', { name: UIReference.text.admin.configuration.googleRecaptcha });
		this.storefrontReCaptchaAccordion = page.getByRole('link', { name: UIReference.text.admin.common.storefront }).filter({hasNotText: 'Google'});
		this.customerCreateReCaptchaOption = page.locator(UIReference.selectors.admin.configuration.recaptchaCustomerCreate);
		this.customerCreateReCaptchaInheritCheckbox = page.locator(UIReference.selectors.admin.configuration.recaptchaCustomerCreateInherit);
	}

	/**
	 * Disable the CAPTCHAs that prevent Playwright tests from functioning.
	 */
	async disableLoginCaptcha(){
		await this.storesCustomersTab.click();
		// Confirm the link for customer configuration is visible.
		await expect(async() => {
			await expect(this.customerConfigurationLink, `"Customer Configuration" link is visible`).toBeVisible();
		}).toPass();

		await this.customerConfigurationLink.click();

		// wait for Captcha Accordion to be visible before continuing.
		await this.customerCaptchaAccordion.waitFor();

		if(!await this.storeFrontCaptchaOption.isVisible()){
			// option not visible, tab is closed.
			await this.customerCaptchaAccordion.click();
			// Confirm captcha option is now open
			await expect(this.storeFrontCaptchaOption, `"enable CAPTCHA on storefront" option is open`).toBeVisible();
		}

		// if the 'use system value' checkbox is checked, uncheck it.
		if(await this.customerCAPTCHAInheritCheckbox.isChecked()) {
			await this.customerCAPTCHAInheritCheckbox.uncheck();
			await expect(this.storeFrontCaptchaOption, `CAPTCHA option can be changed`).toBeEnabled();
		}

		// check if CAPTCHA is already disabled
		if(await this.storeFrontCaptchaOption.inputValue() == '0'){
			await expect(this.storeFrontCaptchaOption, `CAPTCHA is disabled for customers`).toHaveValue('0');
		} else {
			// Disabled the CAPTCHA
			await this.storeFrontCaptchaOption.selectOption('0');
			await expect(this.storeFrontCaptchaOption, `CAPTCHA is disabled for customers`).toHaveValue('0');

			await this.saveConfigButton.click();
			await expect(this.page.locator(UIReference.selectors.admin.common.message),
				`Notification "Configuration Saved" is visible.`).toContainText(UIReference.text.admin.common.configurationSaved);
		}
	}


	/**
	 * Disable Google reCAPTCHA on the "Create New Customer Account" form key.
	 *
	 * The legacy Magento_Captcha module and Google reCAPTCHA are two separate systems;
	 * disableLoginCaptcha() only handles the former. The /rest/V1/customers REST endpoint
	 * is guarded by Magento_ReCaptchaWebapiRest, which reads the recaptcha_frontend/type_for/customer_create
	 * config — so this form key has to be set to "No" for the setup test to be able to
	 * create accounts via the API.
	 *
	 * Assumption is that we're already on the Stores → Configuration page.
	 */
	async disableReCAPTCHA() {
		await this.storesSecurityTab.click();
		// Confirm the link for Google reCAPTCHA Storefront is visible.
		await expect(async() => {
			await expect(this.googleReCaptchaStorefrontLink, `"Google reCAPTCHA Storefront" link is visible`).toBeVisible();
		}).toPass();

		await this.googleReCaptchaStorefrontLink.click();
		// wait for the Storefront accordion to be visible before continuing.
		await this.storefrontReCaptchaAccordion.waitFor();

		if(!await this.customerCreateReCaptchaOption.isVisible()){
			// option not visible, accordion is closed.
			await this.storefrontReCaptchaAccordion.click();
			// Confirm the option is now open
			await expect(this.customerCreateReCaptchaOption, `"Enable for Create New Customer Account" option is open`).toBeVisible();
		}

		// if the 'use system value' checkbox is checked, uncheck it.
		if(await this.customerCreateReCaptchaInheritCheckbox.isChecked()) {
			await this.customerCreateReCaptchaInheritCheckbox.uncheck();
			await expect(this.customerCreateReCaptchaOption, `reCAPTCHA option can be changed`).toBeEnabled();
		}

		// check if reCAPTCHA is already disabled (the "No" option has an empty value)
		if(await this.customerCreateReCaptchaOption.inputValue() == ''){
			await expect(this.customerCreateReCaptchaOption, `reCAPTCHA is disabled for customer creation`).toHaveValue('');
		} else {
			// Disable reCAPTCHA for the customer_create form key.
			await this.customerCreateReCaptchaOption.selectOption('');
			await expect(this.customerCreateReCaptchaOption, `reCAPTCHA is disabled for customer creation`).toHaveValue('');

			await this.saveConfigButton.click();
			await expect(this.page.locator(UIReference.selectors.admin.common.message),
				`Notification "Configuration Saved" is visible.`).toContainText(UIReference.text.admin.common.configurationSaved);
		}
	}

	/**
	 * Navigate to the Stores Settings in Magento Admin.
	 */
	async navigateToStoreSettings() {
		const configurationPageLabel = UIReference.text.admin.common.configuration;
		const generalTab = this.page.getByRole('tab', { name: UIReference.text.admin.common.generalTab });
		const generalOptions = this.page.getByRole('link', {name: UIReference.text.admin.common.general});

		// Re-open the Stores flyout if a pop-up dismissal collapses it between click and visibility check.
		await expect(async () => {
			await this.mainMenuStoresButton.click();
			await expect(this.storesConfigurationButton,
				`"Configuration" link in Stores flyout is visible`).toBeVisible();
		}).toPass();

		await this.storesConfigurationButton.click();

		// Confirm the page has loaded correctly by checking for the presence of text.
		await expect(async () => {
			await expect(this.pageHeadingOne, `Page title is '${configurationPageLabel}'`)
				.toContainText(`${configurationPageLabel}`);

			/**
			 * Highlite change
			 * General options does not seem open immediately
			 */
			if(await generalTab.isVisible() && await generalOptions.isHidden())  {
				await generalTab.click();
			}

			await expect(this.page.getByRole('link', {name: UIReference.text.admin.common.general}),
				`"General options" under General section is visible.`).toBeVisible();
		}).toPass();
	}

	/**
	 * Enable multiple admin logins
	 * Assumption is that we're in the 'Store Settings'.
	 */
	async enableMultipleAdminLogins() {
		await this.advancedSettingsTab.click();
		// Confirm the link for 'admin' settings is visible.
		await expect(async() => {
			await expect(this.adminSettingsLink, `"Admin" link under "Advanced" is visible`).toBeVisible();
		}).toPass();

		await this.adminSettingsLink.click();

		// wait for adminSecurityAccordion to be visible before continuing.
		await this.adminSecurityAccordion.waitFor();

		if(!await this.adminSharingOption.isVisible()){
			// tab is closed.
			await this.adminSecurityAccordion.click();
			await expect(this.adminSharingOption, `Security tab is opened`).toBeVisible();
		}

		// if the 'use system value' checkbox is checked, uncheck it.
		if(await this.adminInheritCheckbox.isChecked()) {
			await this.adminInheritCheckbox.uncheck();
			await expect(this.adminSharingOption, `Admin Account Sharing option can be changed`).toBeEnabled();
		}

		// check if Admin Account Sharing is already available
		if(await this.adminSharingOption.inputValue() == '1'){
			await expect(this.adminSharingOption, `Account sharing option enabled`).toHaveValue('1');
		} else {
			// Enable account sharing
			await this.adminSharingOption.selectOption('1');
			await expect(this.adminSharingOption, `Account sharing option enabled`).toHaveValue('1');

			await this.saveConfigButton.click();
			await expect(this.page.locator(UIReference.selectors.admin.common.message),
				`Notification "Configuration Saved" is visible.`).toContainText(UIReference.text.admin.common.configurationSaved);
		}

	}

	/**
	 * Log the admin user in to set up the Magento 2 environment
	 * @param username - admin's username, sourced from .env
	 * @param password - admin's password, sourced from .env
	 */
	async loginAdmin(username:string, password:string){
		const dashboardLabel = this.page.getByRole('heading', {name: UIReference.text.admin.common.dashboardTitle});
		const captchaNotification = this.page.locator(UIReference.selectors.shared.message).filter(
			{hasText : UIReference.text.shared.messages.captchaIncorrect}
		);
		const adminLoginHeading = this.page.locator('legend').getByText(UIReference.text.admin.login.welcome);

		if(await dashboardLabel.isVisible()){
			// already logged in
			return;
		}

		await this.page.goto(`${requireEnv(`MAGENTO_ADMIN_SLUG`)}`, { waitUntil: 'load'});

		// Confirm the page has loaded correctly by checking for the presence of text.
		await expect(async() => {
			await expect(adminLoginHeading, `"Please sign in" text is visible`).toBeVisible();
		}).toPass();

		await this.adminLoginEmailField.fill(username);
		await this.adminLoginPasswordField.fill(password);
		await this.adminLoginButton.click();

		if(await captchaNotification.isVisible()){
			throw new Error(`CAPTCHA field found, automated login failed.`);
		}

		// Confirm the page has loaded correctly by checking for the presence of text.
		await expect(async() => {
			await expect(dashboardLabel, `Dashboard Title is visible`).toBeVisible();
		}).toPass();

		// WORKAROUND
		// Add a timeout to ensure Magento has time to bind JS to buttons
		await this.page.waitForTimeout(3000);
	}
}

export default AdminLogin;
