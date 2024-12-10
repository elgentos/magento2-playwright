import {expect, type Locator, type Page} from '@playwright/test';
import slugs from '../fixtures/before/slugs.json';
import accountSelector from '../fixtures/during/selectors/account.json';
import accountValue from '../fixtures/during/input-values/account.json';
import accountExpected from '../fixtures/verify/expects/account.json';

// TODO all variables should me moved to these kinds of folders.
// See constructor() to see what how to set up variable.
// This implementation allows for localization.
import newAccountSelectors from '../variables/selectors/account.page.json';
import accountImportValues from '../variables/input-values/account.page.json';
import accountExpectations from '../variables/expected-variables/account.page.json';

export class Account {
  page: Page;
  firstNameField: Locator;
  lastNameField: Locator;
  companyNameField: Locator;
  phoneNumberField: Locator;
  streetAddressField: Locator;
  zipCodeField: Locator;
  cityNameField: Locator;
  countrySelect: Locator;
  provinceSelect: Locator;
  saveAddressButton: Locator;
  loginEmailField: Locator;
  loginPasswordField: Locator;
  loginButton: Locator;
  myAccountMenuButton: Locator;
  menuLogOutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameField = page.getByLabel(newAccountSelectors.firstNameLabel);
    this.lastNameField = page.getByLabel(newAccountSelectors.lastNameLabel);
    this.companyNameField = page.getByLabel(newAccountSelectors.companyNameLabel);
    this.phoneNumberField = page.getByLabel(newAccountSelectors.phoneNumberLabel);
    this.streetAddressField = page.getByLabel(newAccountSelectors.streetAddressLabel, {exact: true});
    this.zipCodeField = page.getByLabel(newAccountSelectors.zipCodeLabel);
    this.cityNameField = page.getByLabel(newAccountSelectors.cityNameLabel);
    //TODO: countrySelect is used to change the country so it's not US.
    //TODO: provinceSelect should be provinceField if country is, for example, Netherlands.
    this.countrySelect = page.getByLabel(newAccountSelectors.countryLabel);
    this.provinceSelect = page.getByLabel(newAccountSelectors.provinceSelectLabel).filter({hasText: newAccountSelectors.provinceSelectFilterLabel});
    this.saveAddressButton = page.getByRole('button',{name: newAccountSelectors.saveAdressButton});

    //TODO: move labels to variable file
    this.loginEmailField = page.getByLabel('Email', {exact: true});
    this.loginPasswordField = page.getByLabel('Password', {exact: true});
    this.loginButton = page.getByRole('button', { name: 'Sign In' });
    this.myAccountMenuButton = page.getByLabel('My Account');
    this.menuLogOutButton = page.getByTitle('Sign Out');

  }

  async login(email: string, password: string) {
    await this.page.goto(slugs.loginSlug);

    await this.loginEmailField.fill(email);
    await this.loginPasswordField.fill(password);
    await this.loginButton.click();

    await expect(this.page).toHaveURL(new RegExp(`${slugs.afterLoginSlug}.*`));
  }

  async addAddress() {
    let addressAddedNotification = accountExpectations.newAddressAddedExpectedNotifcation;

    // TODO move slugs to variables folder.
    await this.page.goto(slugs.accountNewAddressSlug);

    // fill in required fields
    await this.firstNameField.fill(accountImportValues.accountFirstNameValue);
    await this.lastNameField.fill(accountImportValues.accountLastNameValue);
    await this.companyNameField.fill(accountImportValues.newAddressCompanyValue);
    await this.phoneNumberField.fill(accountImportValues.newAddressPhoneNumberValue);
    await this.streetAddressField.fill(accountImportValues.newAddressStreetValue);
    await this.zipCodeField.fill(accountImportValues.newAddressZipCodeValue);
    await this.cityNameField.fill(accountImportValues.newAddressCityValue);
    await this.provinceSelect.selectOption(accountImportValues.newAddressProvinceValue);
    await this.saveAddressButton.click();

    await expect(this.page.getByText(addressAddedNotification)).toBeVisible();
  }

  async logout() {
    await this.myAccountMenuButton.click();
    await this.menuLogOutButton.click();

    await expect(this.page).toHaveURL(new RegExp(`${slugs.afterLogoutSlug}.*`));
  }
}
