// @ts-check

import { expect, type Locator, type Page, test, TestInfo } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { UIReference, outcomeMarker, inputValues, slugs } from '@config';
import NotificationValidatorUtils from '@utils/notificationValidator.utils';
import { slugToRegex } from '@utils/url.utils';

export class BaseAccountPage {
	constructor(public readonly page: Page) {}

	// ==============================================
	// Element getters
	// ==============================================

	protected get accountDashboardTitle(): Locator {
		return this.page.getByRole('heading', { name: UIReference.text.frontend.account.dashboardTitle });
	}

	get changeEmailCheck(): Locator {
		return this.page.getByRole('switch', { name: UIReference.text.frontend.account.changeEmail });
	}

	get genericSaveButton(): Locator {
		return this.page.getByRole('button', { name: UIReference.text.shared.buttons.save });
	}

	get newAddressButton(): Locator {
		return this.page.getByRole('button', { name: 'New Address' });
	}

	get deleteAddressButton(): Locator {
		return this.page.getByRole('link', { name: UIReference.text.frontend.account.deleteAddress }).first();
	}

	get editAddressButton(): Locator {
		return this.page.getByRole('link', { name: UIReference.text.frontend.account.editAddress }).first();
	}

	/**
	 * get passwordFormElements
	 * Returns locators for the password form. Used for updatePassword() method
	 */
	get passwordFormElements() {
		return {
			changePasswordSwitch : this.page.getByRole('switch', { name: UIReference.text.frontend.account.changePassword }),
			confirmNewPasswordField : this.page.getByLabel(UIReference.text.shared.forms.newPasswordConfirm),
			currentPasswordField : this.page.getByLabel(UIReference.text.shared.forms.currentPassword),
			newPasswordField : this.page.getByLabel(UIReference.text.shared.forms.newPassword, { exact: true })
		}
	}

	/**
	 * get userNameFields
	 * Returns firstNameField and lastNameField
	 */
	get userNameFields() {
		return {
			firstNameField: this.page.getByLabel(UIReference.text.shared.forms.firstName),
			lastNameField: this.page.getByLabel(UIReference.text.shared.forms.lastName)
		}
	}

	/**
	 * get accountAddressFields
	 * Returns all input fields for account address forms
	 */
	get accountAddressFields() {
		return {
			companyNameField : this.page.getByRole('textbox', { name: UIReference.text.shared.forms.company }),
			phoneNumberField : this.page.getByLabel(UIReference.text.shared.forms.phone),
			streetAddressField : this.page.getByLabel(UIReference.text.shared.forms.streetAddress, { exact: true }),
			zipCodeField : this.page.getByLabel(UIReference.text.shared.forms.zipCode),
			cityField : this.page.getByLabel(UIReference.text.shared.forms.city),
			countrySelectorField : this.page.getByLabel(UIReference.text.shared.forms.country),
			stateInputField : this.page.getByLabel(UIReference.text.shared.forms.province),
			// Target the <select> directly: filtering by option text races the JS that populates the options.
			stateSelectorField : this.page.locator(UIReference.selectors.frontend.common.region),
			saveAddressButton : this.page.getByRole('button', { name: UIReference.text.frontend.account.saveAddress }),
		}
	}

	/**
	 * get accountCreationFields
	 * Returns inputfields (mainly) associated with account creation
	 */
	get accountCreationFields() {
		return {
			firstNameField : this.page.getByLabel(UIReference.text.shared.forms.firstName),
			lastNameField : this.page.getByLabel(UIReference.text.shared.forms.lastName),
			emailField : this.page.getByLabel(UIReference.text.shared.forms.email, { exact: true }),
			passwordField : this.page.getByLabel(UIReference.text.shared.forms.password, { exact: true }),
			passwordRepeatField : this.page.getByLabel(UIReference.text.shared.forms.passwordConfirm),
			confirmButton : this.page.getByRole('button', { name: UIReference.text.frontend.common.navigation.createAccount })
		}
	}


	// ==============================================
	// Address-related methods
	// ==============================================

	/**
	 * Add an address to test account
	 * @param values - Optional values to fill the form with
	 */
	async addNewAddress(values?: {
		company?: string;
		phone?: string;
		street?: string;
		zip?: string;
		city?: string;
		state?: string;
		country?: string;
	}) {
		const {
			companyNameField, phoneNumberField, streetAddressField, zipCodeField,
			cityField, countrySelectorField, stateSelectorField, saveAddressButton
		} = this.accountAddressFields;

		await expect(this.userNameFields.firstNameField, `first name should be pre-filled`).not.toBeEmpty();
		await expect(this.userNameFields.lastNameField, `last name should be pre-filled`).not.toBeEmpty();

		const phone = values?.phone || faker.phone.number({ style: 'national' }); // Use 'national' style to prevent input errors
		const streetName = values?.street || faker.location.streetAddress();
		const zipCode = values?.zip || faker.location.zipCode();
		const cityName = (values?.city || faker.location.city()).replace(/[^A-Za-z0-9\-' ]/g, '');
		const stateName = values?.state || faker.location.state();
		const country = values?.country || faker.helpers.arrayElement(inputValues.addressCountries);
		if (values?.company) {
			await companyNameField.fill(values.company);
		}

		await phoneNumberField.fill(phone);
		await streetAddressField.fill(streetName);
		await zipCodeField.fill(zipCode);
		await cityField.fill(cityName);

		// Wait for the country selector to hydrate before reading its value, otherwise the
		// short-circuit below can compare against a stale default.
		await expect(countrySelectorField).toBeEnabled();
		const defaultSelectedCountry = await countrySelectorField.evaluate(
			(select: HTMLSelectElement) => select.options[select.selectedIndex]?.text
		);

		if (country !== defaultSelectedCountry) {
			await countrySelectorField.selectOption({ label: country });
		}
		const regionDropdown = this.page.locator(UIReference.selectors.frontend.common.region);
		const regionInputField = this.page.getByRole('textbox', { name: UIReference.text.shared.forms.province });

		if (country !== 'United States') {
			await expect(regionDropdown, `Region dropdown should be hidden for non-US country`).toBeHidden();
			await expect(regionInputField, `Region input field should be visible for non-US country`).toBeVisible();

			await regionInputField.fill(stateName);
			await expect(regionInputField).toHaveValue(stateName);
		} else {
			await expect(regionInputField, `Region input field should be hidden for US country`).toBeHidden();
			await expect(regionDropdown, `Region dropdown should be visible for US country`).toBeVisible();
			await expect(regionDropdown, `Region dropdown should be editable`).toBeEditable();

			// The state list is populated by JS after the country switches; wait for real options.
			await expect(regionDropdown.locator('option')).not.toHaveCount(1);

			await stateSelectorField.selectOption({ label: stateName });
			// Replaces a hardcoded 1s wait for Alpine's input debounce — assert the value committed.
			await expect(stateSelectorField).toHaveValue(/.+/);
		}

		await saveAddressButton.scrollIntoViewIfNeeded();
		await saveAddressButton.click();
		// wait for the address index url
		await this.page.waitForURL(/customer\/address\/index/, { waitUntil: "load" });
		await new NotificationValidatorUtils(this.page).validate(outcomeMarker.address.newAddressAddedNotification);
	}



	async editExistingAddress(values?: {
		firstName?: string;
		lastName?: string;
		company?: string;
		phone?: string;
		street?: string;
		zip?: string;
		city?: string;
		state?: string;
		country?: string;
	}, defaultAddress: boolean = false) {
		const {
			companyNameField, phoneNumberField, streetAddressField, zipCodeField,
			cityField, countrySelectorField, stateSelectorField, saveAddressButton
		} = this.accountAddressFields;

		const firstName = values?.firstName || faker.person.firstName();
		const lastName = values?.lastName || faker.person.lastName();
		const companyName = values?.company || faker.company.name();
		const phone = values?.phone || faker.phone.number({ style: 'national' }); // Use 'national' style to prevent input errors
		const streetName = values?.street || faker.location.streetAddress();
		const zipCode = values?.zip || faker.location.zipCode();
		const cityName = (values?.city || faker.location.city()).replace(/[^A-Za-z0-9\-' ]/g, '');
		const stateName = values?.state || faker.location.state();
		const country = values?.country || faker.helpers.arrayElement(inputValues.addressCountries);

		// click the correct button based on if there's more than one address (defaultAddress boolean)
		defaultAddress ? await this.page.getByRole('link', { name: 'Change Shipping Address arrow' }).click() : await this.editAddressButton.click();

		let oldAddress = await streetAddressField.inputValue();

		await expect(this.userNameFields.firstNameField, `first name field should be filled in automatically`).not.toBeEmpty();
		await expect(this.userNameFields.lastNameField, `first name field should be filled in automatically`).not.toBeEmpty();

		// contact information section
		await this.userNameFields.firstNameField.fill(firstName);
		await this.userNameFields.lastNameField.fill(lastName);
		await companyNameField.fill(companyName);
		await phoneNumberField.fill(phone);

		// Address information section
		await streetAddressField.fill(streetName);
		await zipCodeField.fill(zipCode);
		await cityField.fill(cityName);

		// Wait for the country selector to hydrate before reading its value, otherwise the
		// short-circuit below can compare against a stale default.
		await expect(countrySelectorField).toBeEnabled();
		const defaultSelectedCountry = await countrySelectorField.evaluate((select: HTMLSelectElement) => select.options[select.selectedIndex]?.text);
		if (country !== defaultSelectedCountry) {
			await countrySelectorField.selectOption({ label: country });
		}

		const regionDropdown = this.page.locator(UIReference.selectors.frontend.common.region);
		const regionInputField = this.page.getByRole('textbox', { name: UIReference.text.shared.forms.province });

		if (country !== 'United States') {
			await expect(regionDropdown, `Region dropdown should be hidden for non-US country`).toBeHidden();
			await expect(regionInputField, `Region input field should be visible for non-US country`).toBeVisible();

			await regionInputField.fill(stateName);
			await expect(regionInputField).toHaveValue(stateName);
		} else {
			await expect(regionInputField, `Region input field should be hidden for US country`).toBeHidden();
			await expect(regionDropdown, `Region dropdown should be visible for US country`).toBeVisible();
			await expect(regionDropdown, `Region dropdown should be editable`).toBeEditable();

			// The state list is populated by JS after the country switches; wait for real options.
			await expect(regionDropdown.locator('option')).not.toHaveCount(1);

			await stateSelectorField.selectOption({ label: stateName });
			// Replaces a hardcoded 1s wait for Alpine's input debounce — assert the value committed.
			await expect(stateSelectorField).toHaveValue(/.+/);
		}

		await saveAddressButton.scrollIntoViewIfNeeded();
		await saveAddressButton.click();
		await this.page.waitForURL(/customer\/address\/index/, { waitUntil: "load" });
		await new NotificationValidatorUtils(this.page).validate(outcomeMarker.address.newAddressAddedNotification);

		// await expect(this.page.getByText(streetName).last()).toBeVisible();
		if (oldAddress != null) await expect(this.page.getByText(oldAddress)).not.toBeVisible();
	}

	async deleteFirstAddressFromAddressBook() {
		let addressDeletedNotification = outcomeMarker.address.addressDeletedNotification;
		let addressBookSection = this.page.locator(UIReference.selectors.frontend.account.addressBookArea);

		this.page.on('dialog', async (dialog) => {
			if (dialog.type() === 'confirm') {
				await dialog.accept();
			}
		});

    // Retrieve all text in the 'address book' section
    let addressBookArray = await addressBookSection.allInnerTexts();
    // split by each new line
    let arraySplit = addressBookArray[0].split('\n');
    // Retrieve index 6, because:
    // index 0 to 3 are the table headers (i.e. Name, Street Address etc.)
    // index 5 is name, index 6 is address.
    // if this table changes, the index number should change.
    let addressToBeDeleted = arraySplit[6];

		// Annotate the report so the user knows what address should be deleted
		test.info().annotations.push({ type: `Address to be deleted`, description: addressToBeDeleted });

		await this.deleteAddressButton.click();
		// wait for the address index url
		await this.page.waitForURL(/customer\/address\/(index|)/, { waitUntil: "load" });

		await new NotificationValidatorUtils(this.page).validate(addressDeletedNotification);
		await expect(addressBookSection, `${addressToBeDeleted} should not be visible`).not.toContainText(addressToBeDeleted);
	}


	// ==============================================
	// Account credential-related methods
	// ==============================================

	/**
	 * Function: update password associated to an account.
	 * @param currentPassword {string} - password currently associated with the account.
	 * @param newPassword {string} - new password to update to.
	 *
	 */
	async updatePassword(currentPassword: string, newPassword: string) {
		let passwordUpdatedNotification = outcomeMarker.account.changedCredentialsInformation;

		await this.passwordFormElements.changePasswordSwitch.check();
		await this.passwordFormElements.currentPasswordField.fill(currentPassword);
		await this.passwordFormElements.newPasswordField.fill(newPassword);
		await this.passwordFormElements.confirmNewPasswordField.fill(newPassword);
		await this.genericSaveButton.click();

		await this.page.waitForURL(slugToRegex(slugs.frontend.account.login));
		await new NotificationValidatorUtils(this.page).validate(passwordUpdatedNotification);
	}

	async updateEmail(currentPassword: string, newEmail: string) {
		let accountUpdatedNotification = outcomeMarker.account.changedCredentialsInformation;
		await this.changeEmailCheck.check();
		await this.accountCreationFields.emailField.fill(newEmail);
		await this.passwordFormElements.currentPasswordField.fill(currentPassword);
		await this.genericSaveButton.click();

		await this.page.waitForURL(slugToRegex(slugs.frontend.account.login));
		await new NotificationValidatorUtils(this.page).validate(accountUpdatedNotification);
	}

	async deleteAllAddresses() {
		let addressDeletedNotification = outcomeMarker.address.addressDeletedNotification;

		this.page.on('dialog', async (dialog) => {
			if (dialog.type() === 'confirm') {
				await dialog.accept();
			}
		});

		while (await this.deleteAddressButton.isVisible()) {
			await this.deleteAddressButton.click();
			await this.page.waitForLoadState();
			await new NotificationValidatorUtils(this.page).validate(addressDeletedNotification);
		}
	}


	/**
 * Checks that customer details have been filled in.
 * Fills in faker() values otherwise.
 */
	async ensureCustomerDetails() {
		const { streetAddressField, stateSelectorField, zipCodeField, cityField, phoneNumberField } = this.accountAddressFields;

		// the button 'New Address' is only visible if there is a default address.
		if (await this.newAddressButton.isHidden()) {
			await this.userNameFields.firstNameField.fill(faker.person.firstName());
			await this.userNameFields.lastNameField.fill(faker.person.lastName());
			await streetAddressField.fill(faker.location.streetAddress());
			await stateSelectorField.selectOption(faker.location.state());
			await zipCodeField.fill(faker.location.zipCode());
			await cityField.fill(faker.location.city().replace(/[^A-Za-z0-9\-' ]/g, ''));
			await phoneNumberField.fill(faker.phone.number());
		}

		return;
	}

}
