import {expect, type Locator, type Page} from '@playwright/test';

import UIReference from '../config/element-identifiers/element-identifiers.json';
import values from '../config/input-values/input-values.json';

export class MagentoAdminPage {
  readonly page: Page;
  readonly adminLoginEmailField: Locator;
  readonly adminLoginPasswordField: Locator;
  readonly adminLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.adminLoginEmailField = page.getByLabel(UIReference.magentoAdminPage.usernameFieldLabel);
    this.adminLoginPasswordField = page.getByLabel(UIReference.magentoAdminPage.passwordFieldLabel);
    this.adminLoginButton = page.getByRole('button', {name: UIReference.magentoAdminPage.loginButtonLabel});
  }

  async login(username: string, password: string){
    if(!process.env.MAGENTO_ADMIN_SLUG) {
      throw new Error("MAGENTO_ADMIN_SLUG is not defined in your .env file.");
    }

    await this.page.goto(process.env.MAGENTO_ADMIN_SLUG);
    await this.page.waitForLoadState('networkidle');
    await this.adminLoginEmailField.fill(username);
    await this.adminLoginPasswordField.fill(password);
    await this.adminLoginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async addCartPriceRule(magentoCouponCode: string){
    if(!process.env.MAGENTO_COUPON_CODE_CHROMIUM || !process.env.MAGENTO_COUPON_CODE_FIREFOX || !process.env.MAGENTO_COUPON_CODE_WEBKIT) {
      throw new Error("MAGENTO_COUPON_CODE_CHROMIUM, MAGENTO_COUPON_CODE_FIREFOX or MAGENTO_COUPON_CODE_WEBKIT is not defined in your .env file.");
    }

    await this.page.getByRole('link', {name: UIReference.magentoAdminPage.navigation.marketingButtonLabel}).click();
    await this.page.waitForLoadState('networkidle');
    //await this.page.getByRole('link', {name: UIReference.magentoAdminPage.subNavigation.cartPriceRulesButtonLabel}).waitFor();
    await expect(this.page.getByRole('link', {name: UIReference.magentoAdminPage.subNavigation.cartPriceRulesButtonLabel})).toBeVisible();
    await this.page.getByRole('link', {name: UIReference.magentoAdminPage.subNavigation.cartPriceRulesButtonLabel}).click();
    await this.page.waitForLoadState('networkidle');
    await this.page.getByRole('button', {name: UIReference.cartPriceRulesPage.addCartPriceRuleButtonLabel}).click();
    await this.page.getByLabel(UIReference.cartPriceRulesPage.ruleNameFieldLabel).fill(values.coupon.couponCodeRuleName);

    const websiteSelector = this.page.getByLabel(UIReference.cartPriceRulesPage.websitesSelectLabel);
    await websiteSelector.evaluate(select => {
        for (const option of select.options) {
            option.selected = true;
        }
        select.dispatchEvent(new Event('change'));
    });

    const customerGroupsSelector = this.page.getByLabel(UIReference.cartPriceRulesPage.customerGroupsSelectLabel, { exact: true });
    await customerGroupsSelector.evaluate(select => {
        for (const option of select.options) {
            option.selected = true;
        }
        select.dispatchEvent(new Event('change'));
    });

    await this.page.locator(UIReference.cartPriceRulesPage.couponTypeSelectField).selectOption({ label: values.coupon.couponType });
    await this.page.getByLabel(UIReference.cartPriceRulesPage.couponCodeFieldLabel).fill(magentoCouponCode);

    await this.page.getByText(UIReference.cartPriceRulesPage.actionsSubtitleLabel, { exact: true }).click();
    await this.page.getByLabel(UIReference.cartPriceRulesPage.discountAmountFieldLabel).fill('10');

    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
  }

  async enableMultipleAdminLogins() {
    await this.page.waitForLoadState('networkidle');
    await this.page.getByRole('link', { name: UIReference.magentoAdminPage.navigation.storesButtonLabel }).click();
    await this.page.getByRole('link', { name: UIReference.magentoAdminPage.subNavigation.configurationButtonLabel }).first().click();
    await this.page.getByRole('tab', { name: UIReference.configurationPage.advancedTabLabel }).click();
    await this.page.getByRole('link', { name: UIReference.configurationPage.advancedAdministrationTabLabel, exact: true }).click();

    if (!await this.page.locator(UIReference.configurationPage.allowMultipleLoginsSystemCheckbox).isVisible()) {
      await this.page.getByRole('link', { name: UIReference.configurationPage.securitySectionLabel }).click();
    }

    await this.page.locator(UIReference.configurationPage.allowMultipleLoginsSystemCheckbox).uncheck();
    await this.page.locator(UIReference.configurationPage.allowMultipleLoginsSelectField).selectOption({ label: values.adminLogins.allowMultipleLogins });
    await this.page.getByRole('button', { name: UIReference.configurationPage.saveConfigButtonLabel }).click();
  }

  async disableLoginCaptcha() {
    await this.page.waitForLoadState('networkidle');
    await this.page.getByRole('link', { name: UIReference.magentoAdminPage.navigation.storesButtonLabel }).click();
    await this.page.getByRole('link', { name: UIReference.magentoAdminPage.subNavigation.configurationButtonLabel }).first().click();
    await this.page.waitForLoadState('networkidle');
    await this.page.getByRole('tab', { name: UIReference.configurationPage.customersTabLabel }).click();
    await this.page.getByRole('link', { name: UIReference.configurationPage.customerConfigurationTabLabel }).click();
    await this.page.waitForLoadState('networkidle');

    if (!await this.page.locator(UIReference.configurationPage.captchaSettingSystemCheckbox).isVisible()) {
      // await this.page.getByRole('link', { name: new RegExp(UIReference.configurationPage.captchaSectionLabel) }).click();
      await this.page.getByRole('link', { name: UIReference.configurationPage.captchaSectionLabel }).click();
    }

    await this.page.locator(UIReference.configurationPage.captchaSettingSystemCheckbox).uncheck();
    await this.page.locator(UIReference.configurationPage.captchaSettingSelectField).selectOption({ label: values.captcha.captchaDisabled });
    await this.page.getByRole('button', { name: UIReference.configurationPage.saveConfigButtonLabel }).click();
    await this.page.waitForLoadState('networkidle');
  }
}
