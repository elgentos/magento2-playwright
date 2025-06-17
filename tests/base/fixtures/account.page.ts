import {expect, type Locator, type Page} from '@playwright/test';
import {faker} from '@faker-js/faker';

import UIReference from '../config/element-identifiers/element-identifiers.json';
import outcomeMarker from '../config/outcome-markers/outcome-markers.json';
import slugs from '../config/slugs.json';

class AccountPage {
  readonly page: Page;
  readonly accountDashboardTitle: Locator;
  readonly firstNameField: Locator;
  readonly lastNameField: Locator;
  readonly phoneNumberField: Locator;
  readonly streetAddressField: Locator;
  readonly zipCodeField: Locator;
  readonly cityField: Locator;
  readonly countrySelectorField: Locator;
  readonly stateSelectorField: Locator;
  readonly saveAddressButton: Locator;
  readonly addNewAddressButton: Locator;
  readonly deleteAddressButton: Locator;
  readonly editAddressButton: Locator;
  readonly changePasswordCheck: Locator;
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


  constructor(page: Page){
    this.page = page;
    this.accountDashboardTitle = page.getByRole('heading', { name: UIReference.accountDashboard.accountDashboardTitleLabel });
    this.firstNameField = page.getByLabel(UIReference.personalInformation.firstNameLabel);
    this.lastNameField = page.getByLabel(UIReference.personalInformation.lastNameLabel);
    this.phoneNumberField = page.getByLabel(UIReference.newAddress.phoneNumberLabel);
    this.streetAddressField = page.getByLabel(UIReference.newAddress.streetAddressLabel, {exact:true});
    this.zipCodeField = page.getByLabel(UIReference.newAddress.zipCodeLabel);
    this.cityField = page.getByLabel(UIReference.newAddress.cityNameLabel);
    this.countrySelectorField = page.getByLabel(UIReference.newAddress.countryLabel);
    this.stateSelectorField = page.getByLabel(UIReference.newAddress.provinceSelectLabel).filter({hasText: UIReference.newAddress.provinceSelectFilterLabel});
    this.saveAddressButton = page.getByRole('button',{name: UIReference.newAddress.saveAdressButton});

    // Account Information elements
    this.changePasswordCheck = page.getByRole('checkbox', {name: UIReference.personalInformation.changePasswordCheckLabel});
    this.currentPasswordField = page.getByLabel(UIReference.credentials.currentPasswordFieldLabel);
    this.newPasswordField = page.getByLabel(UIReference.credentials.newPasswordFieldLabel, {exact:true});
    this.confirmNewPasswordField = page.getByLabel(UIReference.credentials.newPasswordConfirmFieldLabel);
    this.genericSaveButton = page.getByRole('button', { name: UIReference.general.genericSaveButtonLabel });

    // Account Creation elements
    this.accountCreationFirstNameField = page.getByLabel(UIReference.personalInformation.firstNameLabel);
    this.accountCreationLastNameField = page.getByLabel(UIReference.personalInformation.lastNameLabel);
    this.accountCreationEmailField = page.getByLabel(UIReference.credentials.emailFieldLabel, { exact: true});
    this.accountCreationPasswordField = page.getByLabel(UIReference.credentials.passwordFieldLabel, { exact: true });
    this.accountCreationPasswordRepeatField = page.getByLabel(UIReference.credentials.passwordConfirmFieldLabel);
    this.accountCreationConfirmButton = page.getByRole('button', {name: UIReference.accountCreation.createAccountButtonLabel});

    // Address Book elements
    this.addNewAddressButton = page.getByRole('button',{name: UIReference.accountDashboard.addAddressButtonLabel});
    this.deleteAddressButton = page.getByRole('link', {name: UIReference.accountDashboard.addressDeleteIconButton}).first();
    this.editAddressButton = page.getByRole('link', {name: UIReference.accountDashboard.editAddressIconButton}).first();
  }

  async addNewAddress(){
    let addressAddedNotification = outcomeMarker.address.newAddressAddedNotifcation;
    let streetName = faker.location.streetAddress();

    // Name should be filled in automatically.
    await expect(this.firstNameField).not.toBeEmpty();
    await expect(this.lastNameField).not.toBeEmpty();

    await this.phoneNumberField.fill(faker.phone.number());
    await this.streetAddressField.fill(streetName);
    await this.zipCodeField.fill(faker.location.zipCode());
    await this.cityField.fill(faker.location.city());
    await this.stateSelectorField.selectOption(faker.location.state());
    await this.saveAddressButton.click();
    await this.page.waitForLoadState();

    await expect.soft(this.page.getByText(addressAddedNotification)).toBeVisible();
    await expect(this.page.getByText(streetName).last()).toBeVisible();
  }


  async editExistingAddress(){
    // the notification for a modified address is the same as the notification for a new address.
    let addressModifiedNotification = outcomeMarker.address.newAddressAddedNotifcation;
    let streetName = faker.location.streetAddress();

    await this.editAddressButton.click();

    // Name should be filled in automatically, but editable.
    await expect(this.firstNameField).not.toBeEmpty();
    await expect(this.lastNameField).not.toBeEmpty();

    await this.firstNameField.fill(faker.person.firstName());
    await this.lastNameField.fill(faker.person.lastName());
    await this.streetAddressField.fill(streetName);
    await this.zipCodeField.fill(faker.location.zipCode());
    await this.cityField.fill(faker.location.city());
    await this.stateSelectorField.selectOption(faker.location.state());

    await this.saveAddressButton.click();
    await this.page.waitForLoadState();

    await expect.soft(this.page.getByText(addressModifiedNotification)).toBeVisible();
    await expect(this.page.getByText(streetName).last()).toBeVisible();
  }


  async deleteFirstAddressFromAddressBook(){
    let addressDeletedNotification = outcomeMarker.address.addressDeletedNotification;
    let addressBookSection = this.page.locator(UIReference.accountDashboard.addressBookArea);

    // Dialog function to click confirm
    this.page.on('dialog', async (dialog) => {
      if (dialog.type() === 'confirm') {
        await dialog.accept();
      }
    });

    // Grab addresses from the address book, split the string and grab the address to be deleted.
    let addressBookArray = await addressBookSection.allInnerTexts();
    let arraySplit = addressBookArray[0].split('\n');
    let addressToBeDeleted = arraySplit[7];

    await this.deleteAddressButton.click();
    await this.page.waitForLoadState();

    await expect(this.page.getByText(addressDeletedNotification)).toBeVisible();
    await expect(addressBookSection, `${addressToBeDeleted} should not be visible`).not.toContainText(addressToBeDeleted);
  }

  async updatePassword(currentPassword:string, newPassword: string){
    let passwordUpdatedNotification = outcomeMarker.account.changedPasswordNotificationText;
    await this.changePasswordCheck.check();

    await this.currentPasswordField.fill(currentPassword);
    await this.newPasswordField.fill(newPassword);
    await this.confirmNewPasswordField.fill(newPassword);

    await this.genericSaveButton.click();
    await this.page.waitForLoadState();

    await expect(this.page.getByText(passwordUpdatedNotification)).toBeVisible();
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
