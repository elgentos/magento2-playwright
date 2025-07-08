// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { UIReference, outcomeMarker, inputValues } from '@config';

import LoginPage from '@poms/frontend/login.page';

class AccountPage {
  readonly page: Page;
  readonly accountDashboardTitle: Locator;
  readonly firstNameField: Locator;
  readonly lastNameField: Locator;
  readonly companyNameField: Locator;
  readonly phoneNumberField: Locator;
  readonly loginPage: LoginPage;
  readonly streetAddressField: Locator;
  readonly zipCodeField: Locator;
  readonly cityField: Locator;
  readonly countrySelectorField: Locator;
  readonly stateSelectorField: Locator;
  readonly stateInputField: Locator;
  readonly saveAddressButton: Locator;
  readonly addNewAddressButton: Locator;
  readonly deleteAddressButton: Locator;
  readonly editAddressButton: Locator;
  readonly changePasswordCheck: Locator;
  readonly changeEmailCheck: Locator;
  readonly currentPasswordField: Locator;
  readonly newPasswordField: Locator;
  readonly confirmNewPasswordField: Locator;
  readonly genericSaveButton: Locator;
  readonly accountCreationFirstNameField: Locator;
  readonly accountCreationLastNameField: Locator;
  readonly accountCreationEmailField: Locator;
  readonly accountCreationPasswordField: Locator;
  readonly accountCreationPasswordRepeatField: Locator;
  readonly accountCreationConfirmButton: Locator;
  readonly accountInformationField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginPage = new LoginPage(page);
    this.accountDashboardTitle = page.getByRole('heading', { name: UIReference.accountDashboard.accountDashboardTitleLabel });
    this.firstNameField = page.getByLabel(UIReference.personalInformation.firstNameLabel);
    this.lastNameField = page.getByLabel(UIReference.personalInformation.lastNameLabel);
    this.companyNameField = page.getByLabel(UIReference.newAddress.companyNameLabel);
    this.phoneNumberField = page.getByLabel(UIReference.newAddress.phoneNumberLabel);
    this.streetAddressField = page.getByLabel(UIReference.newAddress.streetAddressLabel, { exact: true });
    this.zipCodeField = page.getByLabel(UIReference.newAddress.zipCodeLabel);
    this.cityField = page.getByLabel(UIReference.newAddress.cityNameLabel);
    this.countrySelectorField = page.getByLabel(UIReference.newAddress.countryLabel);

    this.stateInputField = page.getByLabel(UIReference.newAddress.provinceSelectLabel);
    this.stateSelectorField = this.stateInputField.filter({ hasText: UIReference.newAddress.provinceSelectFilterLabel });

    this.saveAddressButton = page.getByRole('button', { name: UIReference.newAddress.saveAdressButton });

    // Account Information elements
    this.changePasswordCheck = page.getByRole('checkbox', { name: UIReference.personalInformation.changePasswordCheckLabel });
    this.changeEmailCheck = page.getByRole('checkbox', { name: UIReference.personalInformation.changeEmailCheckLabel });
    this.currentPasswordField = page.getByLabel(UIReference.credentials.currentPasswordFieldLabel);
    this.newPasswordField = page.getByLabel(UIReference.credentials.newPasswordFieldLabel, { exact: true });
    this.confirmNewPasswordField = page.getByLabel(UIReference.credentials.newPasswordConfirmFieldLabel);
    this.genericSaveButton = page.getByRole('button', { name: UIReference.general.genericSaveButtonLabel });

    // Account Creation elements
    this.accountCreationFirstNameField = page.getByLabel(UIReference.personalInformation.firstNameLabel);
    this.accountCreationLastNameField = page.getByLabel(UIReference.personalInformation.lastNameLabel);
    this.accountCreationEmailField = page.getByLabel(UIReference.credentials.emailFieldLabel, { exact: true });
    this.accountCreationPasswordField = page.getByLabel(UIReference.credentials.passwordFieldLabel, { exact: true });
    this.accountCreationPasswordRepeatField = page.getByLabel(UIReference.credentials.passwordConfirmFieldLabel);
    this.accountCreationConfirmButton = page.getByRole('button', { name: UIReference.accountCreation.createAccountButtonLabel });

    this.accountInformationField = page.locator(UIReference.accountDashboard.accountInformationFieldLocator).first();

    // Address Book elements
    this.addNewAddressButton = page.getByRole('button', { name: UIReference.accountDashboard.addAddressButtonLabel });
    this.deleteAddressButton = page.getByRole('link', { name: UIReference.accountDashboard.addressDeleteIconButton }).first();
    this.editAddressButton = page.getByRole('link', { name: UIReference.accountDashboard.editAddressIconButton }).first();
  }

  async addNewAddress(values?: {
    company?: string;
    phone?: string;
    street?: string;
    zip?: string;
    city?: string;
    state?: string;
    country?: string;
  }) {
    let addressAddedNotification = outcomeMarker.address.newAddressAddedNotifcation;

    const phone = values?.phone || faker.phone.number();
    const streetName = values?.street || faker.location.streetAddress();
    const zipCode = values?.zip || faker.location.zipCode();
    const cityName = values?.city || faker.location.city();
    const stateName = values?.state || faker.location.state();
    const country = values?.country || faker.helpers.arrayElement(inputValues.addressCountries);

    await expect(this.firstNameField).not.toBeEmpty();
    await expect(this.lastNameField).not.toBeEmpty();

    if (values?.company) {
      await this.companyNameField.fill(values.company);
    }

    await this.phoneNumberField.fill(phone);
    await this.streetAddressField.fill(streetName);
    await this.zipCodeField.fill(zipCode);
    await this.cityField.fill(cityName);
    await this.countrySelectorField.selectOption({ label: country });

    if (await this.stateSelectorField.count()) {
      await this.stateSelectorField.selectOption(stateName);
    } else {
      await this.stateInputField.fill(stateName);
    }

    await this.saveAddressButton.click();
    await this.page.waitForLoadState();

    await expect.soft(this.page.getByText(addressAddedNotification)).toBeVisible();
    await expect(this.page.getByText(streetName).last()).toBeVisible();
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
  }) {
    let addressModifiedNotification = outcomeMarker.address.newAddressAddedNotifcation;

    const streetName = values?.street || faker.location.streetAddress();
    const zipCode = values?.zip || faker.location.zipCode();
    const cityName = values?.city || faker.location.city();
    const stateName = values?.state || faker.location.state();
    const firstName = values?.firstName || faker.person.firstName();
    const lastName = values?.lastName || faker.person.lastName();
    const country = values?.country || faker.helpers.arrayElement(inputValues.addressCountries);

    await this.editAddressButton.click();

    await expect(this.firstNameField).not.toBeEmpty();
    await expect(this.lastNameField).not.toBeEmpty();

    await this.firstNameField.fill(firstName);
    await this.lastNameField.fill(lastName);

    if (values?.company) await this.companyNameField.fill(values.company);
    if (values?.phone) await this.phoneNumberField.fill(values.phone);
    await this.streetAddressField.fill(streetName);
    await this.zipCodeField.fill(zipCode);
    await this.cityField.fill(cityName);
    await this.countrySelectorField.selectOption({ label: country });

    if (await this.stateSelectorField.count()) {
      await this.stateSelectorField.selectOption(stateName);
    } else {
      await this.stateInputField.fill(stateName);
    }

    await this.saveAddressButton.click();
    await this.page.waitForLoadState();

    await expect.soft(this.page.getByText(addressModifiedNotification)).toBeVisible();
    await expect(this.page.getByText(streetName).last()).toBeVisible();
  }

  async deleteFirstAddressFromAddressBook() {
    let addressDeletedNotification = outcomeMarker.address.addressDeletedNotification;
    let addressBookSection = this.page.locator(UIReference.accountDashboard.addressBookArea);

    this.page.on('dialog', async (dialog) => {
      if (dialog.type() === 'confirm') {
        await dialog.accept();
      }
    });

    let addressBookArray = await addressBookSection.allInnerTexts();
    let arraySplit = addressBookArray[0].split('\n');
    let addressToBeDeleted = arraySplit[7];

    await this.deleteAddressButton.click();
    await this.page.waitForLoadState();

    await expect(this.page.getByText(addressDeletedNotification)).toBeVisible();
    await expect(addressBookSection, `${addressToBeDeleted} should not be visible`).not.toContainText(addressToBeDeleted);
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    let passwordUpdatedNotification = outcomeMarker.account.changedPasswordNotificationText;
    await this.changePasswordCheck.check();
    await this.currentPasswordField.fill(currentPassword);
    await this.newPasswordField.fill(newPassword);
    await this.confirmNewPasswordField.fill(newPassword);
    await this.genericSaveButton.click();
    await this.page.waitForLoadState();
    await expect(this.page.getByText(passwordUpdatedNotification)).toBeVisible();
  }

  async updateEmail(currentPassword: string, newEmail: string) {
    let accountUpdatedNotification = outcomeMarker.account.changedPasswordNotificationText;
    await this.changeEmailCheck.check();
    await this.accountCreationEmailField.fill(newEmail);
    await this.currentPasswordField.fill(currentPassword);
    await this.genericSaveButton.click();
    await this.page.waitForLoadState();
    await this.loginPage.login(newEmail, currentPassword);
    await expect(this.accountInformationField, `Account information should contain email: ${newEmail}`).toContainText(newEmail);
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
      await expect.soft(this.page.getByText(addressDeletedNotification)).toBeVisible();
    }
  }
}

export default AccountPage;
