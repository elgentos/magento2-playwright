import {expect, type Locator, type Page} from '@playwright/test';

import slugs from '../config/slugs.json';
import selectors from '../config/selectors/selectors.json';
import expected from '../config/expected/expected.json';

export class RegisterPage {
  readonly page: Page;
  readonly firstNameField: Locator;
  readonly lastNameField: Locator;
  readonly companyNameField: Locator;
  readonly phoneNumberField: Locator;
  readonly streetAddressField: Locator;
  readonly zipCodeField: Locator;
  readonly cityNameField: Locator;
  readonly countrySelect: Locator;
  readonly provinceSelect: Locator;
  readonly saveAddressButton: Locator;

  constructor(page: Page){
    this.page = page;
    this.firstNameField = page.getByLabel(selectors.registration.firstNameLabel);
    this.lastNameField = page.getByLabel(selectors.registration.lastNameLabel);
    this.companyNameField = page.getByLabel(selectors.registration.companyNameLabel);
    this.phoneNumberField = page.getByLabel(selectors.registration.phoneNumberLabel);
    this.streetAddressField = page.getByLabel(selectors.registration.streetAddressLabel, {exact: true});
    this.zipCodeField = page.getByLabel(selectors.registration.zipCodeLabel);
    this.cityNameField = page.getByLabel(selectors.registration.cityNameLabel);
    //TODO: countrySelect is used to change the country so it's not US.
    //TODO: provinceSelect should be provinceField if country is, for example, Netherlands.
    this.countrySelect = page.getByLabel(selectors.registration.countryLabel);
    this.provinceSelect = page.getByLabel(selectors.registration.provinceSelectLabel).filter({hasText: selectors.registration.provinceSelectFilterLabel});
    this.saveAddressButton = page.getByRole('button',{name: selectors.registration.saveAdressButton});
  }
}