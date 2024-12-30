import {expect, type Locator, type Page} from '@playwright/test';

import selectors from '../config/selectors/selectors.json';
import values from '../config/input-values/input-values.json';

import account from '../fixtures/account.page';

export class MagentoAdminPage {
  readonly page: Page;
  readonly adminLoginEmailField: Locator;
  readonly adminLoginPasswordField: Locator;
  readonly adminLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.adminLoginEmailField = page.getByLabel(selectors.magentoAdminPage.usernameFieldLabel);
    this.adminLoginPasswordField = page.getByLabel(selectors.magentoAdminPage.passwordFieldLabel);
    this.adminLoginButton = page.getByRole('button', {name: selectors.magentoAdminPage.loginButtonLabel});
  }

  async login(username: string, password: string){
    if(!process.env.MAGENTO_ADMIN_SLUG) {
      throw new Error("MAGENTO_ADMIN_SLUG is not defined in your .env file.");
    }

    await this.page.goto(process.env.MAGENTO_ADMIN_SLUG);
    await this.adminLoginEmailField.fill(username);
    await this.adminLoginPasswordField.fill(password);
    await this.adminLoginButton.click();
  }

  async addCartPriceRule(magentoCouponCode: string){
    if(!process.env.MAGENTO_COUPON_CODE) {
      throw new Error("MAGENTO_COUPON_CODE is not defined in your .env file.");
    }

    await this.page.getByRole('link', {name: selectors.magentoAdminPage.navigation.marketingButtonLabel}).click();
    await this.page.getByRole('link', {name: selectors.magentoAdminPage.subNavigation.cartPriceRulesButtonLabel}).click();
    await this.page.getByRole('button', {name: selectors.cartPriceRulesPage.addCartPriceRuleButtonLabel}).click();
    await this.page.getByLabel(selectors.cartPriceRulesPage.ruleNameFieldLabel).fill(values.coupon.couponCodeRuleName);

    const websiteSelector = await this.page.getByLabel(selectors.cartPriceRulesPage.websitesSelectLabel);
    await websiteSelector.evaluate(select => {
        for (const option of select.options) {
            option.selected = true;
        }
        select.dispatchEvent(new Event('change'));
    });

    const customerGroupsSelector = await this.page.getByLabel(selectors.cartPriceRulesPage.customerGroupsSelectLabel, { exact: true });
    await customerGroupsSelector.evaluate(select => {
        for (const option of select.options) {
            option.selected = true;
        }
        select.dispatchEvent(new Event('change'));
    });

    await this.page.locator(selectors.cartPriceRulesPage.couponTypeSelectField).selectOption({ label: values.coupon.couponType });
    await this.page.getByLabel(selectors.cartPriceRulesPage.couponCodeFieldLabel).fill(magentoCouponCode);

    await this.page.getByText(selectors.cartPriceRulesPage.actionsSubtitleLabel, { exact: true }).click();
    await this.page.getByLabel(selectors.cartPriceRulesPage.discountAmountFieldLabel).fill('10');

    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
  }

  async disableLoginCaptcha() {
    await this.page.getByRole('link', { name: selectors.magentoAdminPage.navigation.storesButtonLabel }).click();
    await this.page.getByRole('link', { name: selectors.magentoAdminPage.subNavigation.configurationButtonLabel }).click();
    await this.page.getByRole('tab', { name: selectors.configurationPage.customersTabLabel }).click();
    await this.page.getByRole('link', { name: selectors.configurationPage.customerConfigurationTabLabel }).click();

    if (!await this.page.locator(selectors.configurationPage.captchaSettingSystemCheckbox).isVisible()) {
        await this.page.getByRole('link', { name: /${selectors.configurationPage.captchaSectionLabel}/ }).click();
    }

    await this.page.locator(selectors.configurationPage.captchaSettingSystemCheckbox).uncheck();
    await this.page.locator(selectors.configurationPage.captchaSettingSelectField).selectOption({ label: values.captcha.captchaDisabled });
    await this.page.getByRole('button', { name: selectors.configurationPage.saveConfigButtonLabel }).click();
  }
}
