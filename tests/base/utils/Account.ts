import {expect, Page} from '@playwright/test';
import slugs from '../fixtures/before/slugs.json';
import accountSelector from '../fixtures/during/selectors/account.json';
import accountValue from '../fixtures/during/input-values/account.json';
import accountExpected from '../fixtures/verify/expects/account.json';

export class Account {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login(email: string, password: string) {
    await this.page.goto(slugs.loginSlug);

    await this.page.fill(accountSelector.loginEmailAddressSelector, email);
    await this.page.fill(accountSelector.loginPasswordSelector, password);

    await this.page.click(accountSelector.loginButtonSelectorName);
    await expect(this.page).toHaveURL(new RegExp(`${slugs.afterLoginSlug}.*`));
  }

  async addAddress() {
    await this.page.goto(slugs.accountNewAddressSlug);
    await this.page.fill(accountSelector.registrationFirstNameSelector, accountValue.newAccountFirstName);
    await this.page.fill(accountSelector.registrationLastNameSelector, accountValue.newAccountLastName);
    await this.page.fill(accountSelector.accountTelephoneSelector, accountValue.newAddressTelephoneNumber);
    await this.page.fill(accountSelector.accountStreetAddressSelector, accountValue.newAddressStreetAddress);
    await this.page.fill(accountSelector.accountZipSelector, accountValue.newAddressZipCode);
    await this.page.fill(accountSelector.accountCitySelector, accountValue.newAddressCityName);
    await this.page.selectOption(accountSelector.accountProvinceSelector, {value: accountValue.newAddressProvinceValue});

    await this.page.click(accountSelector.accountAddressSaveButtonSelector);

    await expect(this.page.locator(`text=${accountExpected.accountAddressChangedNotificationText}`)).toBeVisible();
  }

  async logout() {
    await this.page.locator(accountSelector.accountMenuItemsSelector).nth(accountSelector.logoutMenuItemPosition).click();
    await expect(this.page).toHaveURL(new RegExp(`${slugs.afterLogoutSlug}.*`));
  }
}
