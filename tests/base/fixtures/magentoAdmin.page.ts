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
    // Define 'Stores' button so we can wait for it's visibility.
    const storesButton = this.page.getByRole('link', { name: UIReference.magentoAdminPage.navigation.storesButtonLabel });

    if(!process.env.MAGENTO_ADMIN_SLUG) {
      throw new Error("MAGENTO_ADMIN_SLUG is not defined in your .env file.");
    }

    await this.page.goto(process.env.MAGENTO_ADMIN_SLUG);
    await this.adminLoginButton.waitFor();
    await this.adminLoginEmailField.fill(username);
    await this.adminLoginPasswordField.fill(password);
    await this.adminLoginButton.click();
    await storesButton.waitFor();
  }

  async addCartPriceRule(magentoCouponCode: string){
    const marketingButton = this.page.getByRole('link', {name: UIReference.magentoAdminPage.navigation.marketingButtonLabel});
    const cartPriceRulesButton = this.page.getByRole('link', {name: UIReference.magentoAdminPage.subNavigation.cartPriceRulesButtonLabel});
    const addCartPriceRuleButton = this.page.getByRole('button', {name: UIReference.cartPriceRulesPage.addCartPriceRuleButtonLabel});
    const cartPriceRuleField = this.page.getByLabel(UIReference.cartPriceRulesPage.ruleNameFieldLabel);

    await marketingButton.waitFor();
    await marketingButton.click();

    await cartPriceRulesButton.waitFor();
    await cartPriceRulesButton.click();

    // Before adding the coupon codes, we check if they are already present.
    const searchCouponButton = this.page.getByRole('button', {name: 'Search', exact: true});

    await this.page.locator(UIReference.magentoAdminPage.adminCouponCodeFieldLocator).fill(magentoCouponCode);
    await searchCouponButton.click();

    const couponResult = this.page.getByText(magentoCouponCode);

    if(await couponResult.isVisible()){
      // coupon already added!
      return false;
    }

    await addCartPriceRuleButton.waitFor();
    await addCartPriceRuleButton.click();

    await cartPriceRuleField.waitFor();
    await cartPriceRuleField.fill(values.coupon.couponCodeRuleName);

    // Apply coupon code to all store views
    const websiteSelector = this.page.getByLabel(UIReference.cartPriceRulesPage.websitesSelectLabel);
    await websiteSelector.evaluate(select => {
      const selectElement = select as HTMLSelectElement;
        for (const option of selectElement.options) {
            option.selected = true;
        }
        select.dispatchEvent(new Event('change'));
    });

    const customerGroupsSelector = this.page.getByLabel(UIReference.cartPriceRulesPage.customerGroupsSelectLabel, { exact: true });
    await customerGroupsSelector.evaluate(select => {
      const selectElement = select as HTMLSelectElement;
        for (const option of selectElement.options) {
        // for (const option of select.options) {
            option.selected = true;
        }
        select.dispatchEvent(new Event('change'));
    });

    await this.page.locator(UIReference.cartPriceRulesPage.couponTypeSelectField).selectOption({ label: values.coupon.couponType });
    await this.page.getByLabel(UIReference.cartPriceRulesPage.couponCodeFieldLabel).fill(magentoCouponCode);

    await this.page.getByText(UIReference.cartPriceRulesPage.actionsSubtitleLabel, { exact: true }).click();
    const discountAmountField = this.page.getByLabel(UIReference.cartPriceRulesPage.discountAmountFieldLabel);
    await discountAmountField.waitFor();
    await discountAmountField.fill('10');
    // await this.page.getByLabel(UIReference.cartPriceRulesPage.discountAmountFieldLabel).fill('10');

    await this.page.getByRole('button', { name: 'Save', exact: true }).click();

    // Wait for success message to be visible before moving on.
    const succesMessageLocator = this.page.locator(UIReference.general.successMessageLocator);
    await succesMessageLocator.waitFor();

    return true;
  }

  async enableMultipleAdminLogins() {
    // await this.page.waitForLoadState('networkidle');
    const storesButton = this.page.getByRole('link', { name: UIReference.magentoAdminPage.navigation.storesButtonLabel });
    const configurationButton = this.page.getByRole('link', { name: UIReference.magentoAdminPage.subNavigation.configurationButtonLabel });
    const advancedTab = this.page.getByRole('tab', { name: UIReference.configurationPage.advancedTabLabel });
    const advancedAdministrationTab = this.page.getByRole('link', { name: UIReference.configurationPage.advancedAdministrationTabLabel, exact: true });

    // this function is called after login, meaning we should wait for the stores button to be visible
    await storesButton.waitFor();
    await storesButton.click();

    // wait for Configuration button to be visible
    await configurationButton.waitFor();
    await configurationButton.click();

    // wait for Advanced tab to be visible
    await advancedTab.waitFor();
    await advancedTab.click();

    // wait for Advanced Administration tab to be visible
    await advancedAdministrationTab.waitFor();
    await advancedAdministrationTab.click();

    if (!await this.page.locator(UIReference.configurationPage.allowMultipleLoginsSystemCheckbox).isVisible()) {
      await this.page.getByRole('link', { name: UIReference.configurationPage.securitySectionLabel }).click();
    }

    await this.page.locator(UIReference.configurationPage.allowMultipleLoginsSystemCheckbox).uncheck();
    await this.page.locator(UIReference.configurationPage.allowMultipleLoginsSelectField).selectOption({ label: values.adminLogins.allowMultipleLogins });
    await this.page.getByRole('button', { name: UIReference.configurationPage.saveConfigButtonLabel }).click();
  }

  async disableLoginCaptcha() {
    // No longer required because we wait for success message in the previous method/step.
    // await this.page.waitForLoadState('networkidle');
    const storesButton = this.page.getByRole('link', { name: UIReference.magentoAdminPage.navigation.storesButtonLabel });
    const configurationButton = this.page.getByRole('link', { name: UIReference.magentoAdminPage.subNavigation.configurationButtonLabel });
    const customersTab = this.page.getByRole('tab', { name: UIReference.configurationPage.customersTabLabel });
    const customerConfigurationTab = this.page.getByRole('link', { name: UIReference.configurationPage.customerConfigurationTabLabel });

    await storesButton.waitFor();
    await storesButton.click();

    await configurationButton.waitFor();
    await configurationButton.click();

    await customersTab.waitFor();
    await customersTab.click();

    await customerConfigurationTab.waitFor();
    await customerConfigurationTab.click();

    // Wait for save config button to be visible
    await this.page.getByRole('button', { name: UIReference.configurationPage.saveConfigButtonLabel }).waitFor();    

    if (!await this.page.locator(UIReference.configurationPage.captchaSettingSystemCheckbox).isVisible()) {
      // await this.page.getByRole('link', { name: new RegExp(UIReference.configurationPage.captchaSectionLabel) }).click();
      await this.page.getByRole('link', { name: UIReference.configurationPage.captchaSectionLabel }).click();
    }

    await this.page.locator(UIReference.configurationPage.captchaSettingSystemCheckbox).uncheck();
    await this.page.locator(UIReference.configurationPage.captchaSettingSelectField).selectOption({ label: values.captcha.captchaDisabled });
    await this.page.getByRole('button', { name: UIReference.configurationPage.saveConfigButtonLabel }).click();
    // await this.page.waitForLoadState('networkidle');
        // Wait for success message to be visible before moving on.
        const succesMessageLocator = this.page.locator(UIReference.general.successMessageLocator);
        await succesMessageLocator.waitFor();
  }
}
