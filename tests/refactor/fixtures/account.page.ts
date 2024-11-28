import {expect, type Locator, type Page} from '@playwright/test';
import {LoginPage} from './login.page';

import slugs from '../config/slugs.json';
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

  // fields below are not required when adding an address.
  /*
  readonly companyField: Locator;
  readonly streetAddressFieldTwo: Locator;
  readonly streetAddressFieldThree: Locator;
  */

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

    this.addNewAddressButton = page.getByRole('button',{name: selectors.accountDashboard.addAddressButtonLabel});
    //unrequired fields
    // this.companyField = page.getByLabel(selectors.newAddress.companyNameLabel);

    /*
    //TODO: move labels to variable file
    this.loginEmailField = page.getByLabel('Email', {exact: true});
    this.loginPasswordField = page.getByLabel('Password', {exact: true});
    this.loginButton = page.getByRole('button', { name: 'Sign In' });
    this.myAccountMenuButton = page.getByLabel('My Account');
    this.menuLogOutButton = page.getByTitle('Sign Out');
    */
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

    //TODO: Add expect check to confirm address by looking for streetname or something on the new page?
    await expect(this.page.getByText(addressAddedNotification)).toBeVisible();
    await expect(this.page.getByText(streetName).last()).toBeVisible();
  }
}