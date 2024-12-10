import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';
import verify from '../config/expected/expected.json';

export class AccountPage {
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

  // fields below are not required when adding an address.
  /*
  readonly companyField: Locator;
  readonly streetAddressFieldTwo: Locator;
  readonly streetAddressFieldThree: Locator;
  */

  // TODO: Update these functionalities to be able to take in non-required fields.

  constructor(page: Page){
    this.page = page;
    this.accountDashboardTitle = page.getByRole('heading', { name: selectors.accountDashboard.accountDashboardTitleLabel });
    this.firstNameField = page.getByLabel(selectors.personalInformation.firstNameLabel);
    this.lastNameField = page.getByLabel(selectors.personalInformation.lastNameLabel);
    this.phoneNumberField = page.getByLabel(selectors.newAddress.phoneNumberLabel);
    this.streetAddressField = page.getByLabel(selectors.newAddress.streetAddressLabel, {exact:true});
    this.zipCodeField = page.getByLabel(selectors.newAddress.zipCodeLabel);
    this.cityField = page.getByLabel(selectors.newAddress.cityNameLabel);
    //TODO: countrySelect is used to change the country so it's not US.
    //TODO: provinceSelect should be provinceField if country is, for example, Netherlands.
    this.countrySelectorField = page.getByLabel(selectors.newAddress.countryLabel);
    this.stateSelectorField = page.getByLabel(selectors.newAddress.provinceSelectLabel).filter({hasText: selectors.newAddress.provinceSelectFilterLabel});
    this.saveAddressButton = page.getByRole('button',{name: selectors.newAddress.saveAdressButton});
    //unrequired fields
    // this.companyField = page.getByLabel(selectors.newAddress.companyNameLabel);

    // Account Information elements
    this.changePasswordCheck = page.getByRole('checkbox', {name: selectors.personalInformation.changePasswordCheckLabel});
    //TODO: Fix these once I can log in again
    this.currentPasswordField = page.getByLabel('Current Password');
    this.newPasswordField = page.getByLabel('New Password', {exact:true});
    this.confirmNewPasswordField = page.getByLabel('Confirm New Password')
    this.genericSaveButton = page.getByRole('button', { name: selectors.general.genericSaveButtonLabel });


    // Address Book elements
    this.addNewAddressButton = page.getByRole('button',{name: selectors.accountDashboard.addAddressButtonLabel});
    this.deleteAddressButton = page.getByRole('link', {name: selectors.accountDashboard.addressDeleteIconButton}).first();
    this.editAddressButton = page.getByRole('link', {name: selectors.accountDashboard.editAddressIconButton}).first();
  }

  //TODO: Add ability to choose different country other than US
  async addNewAddress(phonenumber: string,streetName: string, zipCode: string, cityName: string, state: string){
    let addressAddedNotification = verify.address.newAddressAddedNotifcation;
    

    // Name should be filled in automatically.
    await expect(this.firstNameField).not.toBeEmpty();
    await expect(this.lastNameField).not.toBeEmpty();

    await this.phoneNumberField.fill(phonenumber);
    await this.streetAddressField.fill(streetName);
    await this.zipCodeField.fill(zipCode);
    await this.cityField.fill(cityName);
    await this.stateSelectorField.selectOption(state);
    await this.saveAddressButton.click();

    await expect(this.page.getByText(addressAddedNotification)).toBeVisible();
    await expect(this.page.getByText(streetName).last()).toBeVisible();
  }

  async editExistingAddress(firstName: string, lastName: string, streetName: string, zipCode: string, cityName: string, state: string){
    // the notification for a modified address is the same as the notification for a new address.
    let addressModifiedNotification = verify.address.newAddressAddedNotifcation;

    await this.editAddressButton.click();
    
    // Name should be filled in automatically, but editable.
    await expect(this.firstNameField).not.toBeEmpty();
    await expect(this.lastNameField).not.toBeEmpty();

    await this.firstNameField.fill(firstName);
    await this.lastNameField.fill(lastName);
    await this.streetAddressField.fill(streetName);
    await this.zipCodeField.fill(zipCode);
    await this.cityField.fill(cityName);
    await this.stateSelectorField.selectOption(state);
    await this.saveAddressButton.click();

    await expect(this.page.getByText(addressModifiedNotification)).toBeVisible();
    await expect(this.page.getByText(streetName).last()).toBeVisible();
  }


  // TODO: Update function to remove random address from address book?
  // deleteAddressButton is currently the first instance it finds.
  async deleteFirstAddressFromAddressBook(){
    let addressDeletedNotification = verify.address.addressDeletedNotification;
    // Dialog function to click confirm
    this.page.on('dialog', async (dialog) => {
      if (dialog.type() === 'confirm') {
        await dialog.accept();
      }
    });

    await this.deleteAddressButton.click();
    await expect(this.page.getByText(addressDeletedNotification)).toBeVisible();
  }


  async updatePassword(currentPassword:string, newPassword: string){
    let passwordUpdatedNotification = verify.account.changedPasswordNotificationText;
    await this.changePasswordCheck.check();

    await this.currentPasswordField.fill(currentPassword);
    await this.newPasswordField.fill(newPassword);
    await this.confirmNewPasswordField.fill(newPassword);

    await this.genericSaveButton.click();

    await expect(this.page.getByText(passwordUpdatedNotification)).toBeVisible();
    console.log(`Password has been changed! Please update your .env file password with "${newPassword}"`);
  }
}