// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, inputValues } from '@config';

class MagentoAdminPage {
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


  async addCartPriceRule(magentoCouponCode: string){

    // Force specific viewport size
    await this.page.setViewportSize({
        width: 1920,
        height: 1080
    })

    const mainMenuMarketingButton = this.page.getByRole('link', {name: UIReference.magentoAdminPage.navigation.marketingButtonLabel});
    const cartPriceRulesLink = this.page.getByRole('link', {name: UIReference.magentoAdminPage.subNavigation.cartPriceRulesButtonLabel});
    await expect(mainMenuMarketingButton).toBeVisible();
    await mainMenuMarketingButton.click();
    await expect(cartPriceRulesLink).toBeVisible();
    await cartPriceRulesLink.click();

    const addCartPriceRuleButton = this.page.getByRole('button', {name: UIReference.cartPriceRulesPage.addCartPriceRuleButtonLabel});
    await addCartPriceRuleButton.waitFor();

    const couponCellField = this.page.getByRole('cell', {name: magentoCouponCode});

    if(await couponCellField.isVisible()){
      const couponStatusField = this.page.locator('tr').filter({hasText:magentoCouponCode});
      const couponStatus = await couponStatusField.innerText();
      if(couponStatus.includes('Active')){
          console.log('Coupon already exists and is active');
          return;
      } else {
        // coupon has been found, but is not active.
        await couponCellField.click();
        const activeStatusWitcher = this.page.locator('.admin__actions-switch-label').first();
        const activeStatusLabel = this.page.locator('.admin__actions-switch-text').first();

        await expect(activeStatusLabel).toBeVisible();
        await activeStatusWitcher.click();

        const saveCouponButton = this.page.getByRole('button', {name:'Save', exact:true});
        await saveCouponButton.click();

        await expect(this.page.locator(UIReference.general.messageLocator)).toBeVisible();
      }
    } else {
      // coupon is not set
      await addCartPriceRuleButton.click();

      const websiteSelector = this.page.getByLabel(UIReference.cartPriceRulesPage.websitesSelectLabel);
      await websiteSelector.evaluate(select => {
        const s = select as HTMLSelectElement;
        for (const option of s.options) {
          option.selected = true;
        }
        select.dispatchEvent(new Event('change'));
      });

      const customerGroupsSelector = this.page.getByLabel(UIReference.cartPriceRulesPage.customerGroupsSelectLabel, { exact: true });
      await customerGroupsSelector.evaluate(select => {
        const s = select as HTMLSelectElement;
        for (const option of s.options) {
          option.selected = true;
        }
        select.dispatchEvent(new Event('change'));
      });

      await this.page.locator(UIReference.cartPriceRulesPage.couponTypeSelectField).selectOption({ label: inputValues.coupon.couponType });
      await this.page.getByLabel(UIReference.cartPriceRulesPage.couponCodeFieldLabel).fill(magentoCouponCode);

      await this.page.getByText(UIReference.cartPriceRulesPage.actionsSubtitleLabel, { exact: true }).click();
      await this.page.getByLabel(UIReference.cartPriceRulesPage.discountAmountFieldLabel).fill('10');

      const couponSaveButton = this.page.getByRole('button', { name: 'Save', exact: true });
      await couponSaveButton.scrollIntoViewIfNeeded();
      await couponSaveButton.click({force:true});
      await expect(this.page.locator(UIReference.general.messageLocator)).toBeVisible();
    }
  }

  async checkIfCustomerExists(email: string){
    const mainMenuCustomersButton = this.page.getByRole('link', {name: UIReference.magentoAdminPage.navigation.customersButtonLabel});
    const allCustomersLink = this.page.getByRole('link', {name: UIReference.magentoAdminPage.subNavigation.allCustomersButtonLabel});
    const customersSearchField = this.page.getByRole('textbox', {name: UIReference.customerOverviewPage.tableSearchFieldLabel});

    await mainMenuCustomersButton.click();
    await expect(allCustomersLink).toBeVisible();
    await allCustomersLink.click();

    // Wait for URL. If loading symbol is visible, wait for it to go away
    await this.page.waitForURL('**/beheer/customer/index/**');
    if (await this.page.locator('#container .spinner').isVisible()) {
      await this.page.locator('#container .spinner').waitFor({state: 'hidden'});
    }

    await customersSearchField.waitFor();
    await customersSearchField.fill(email);
    await this.page.getByRole('button', {name: 'Search'}).click();

    await this.page.getByText('records found').first().waitFor();

    // Return true (email found) or false (email not found)
    return await this.page.getByRole('cell', {name:email}).locator('div').isVisible();
  }

  /**
   * @feature Magento Admin Configuration
   * @scenario Disable the login CAPTCHA on the admin panel
   * @given the admin is logged into the Magento dashboard
   * @when the admin navigates to Stores > Configuration > Customers > Customer Configuration > CAPTCHA section
   * @and the "Use system value" checkbox for CAPTCHA is unchecked
   * @and the "Enable CAPTCHA on Admin Login" select field is visible
   * @and the current setting is "Yes"
   * @then the admin changes the setting to "No"
   * @and clicks the Save Config button
   * @then the system displays a success message confirming the configuration was saved
   */
  async disableLoginCaptcha() {
    const mainMenuStoresButton = this.page.getByRole('link', { name: UIReference.magentoAdminPage.navigation.storesButtonLabel});
    // selecting first specifically because plugins can place another 'configuration' link in this menu.
    const storeSettingsConfigurationLink = this.page.getByRole('link', { name: UIReference.magentoAdminPage.subNavigation.configurationButtonLabel }).first();
    await mainMenuStoresButton.click();
    await storeSettingsConfigurationLink.waitFor();
    await storeSettingsConfigurationLink.click();

    const customersTab = this.page.getByRole('tab', { name: UIReference.configurationPage.customersTabLabel });
    const customerConfigurationLink = this.page.getByRole('link', { name: UIReference.configurationPage.customerConfigurationTabLabel });
    await customersTab.click();
    await customerConfigurationLink.waitFor();
    await customerConfigurationLink.click();

    const captchaSettingsBlock = this.page.getByRole('link', { name: UIReference.configurationPage.captchaSectionLabel });
    const captchaSettingsSystemValueCheckbox = this.page.locator(UIReference.configurationPage.captchaSettingSystemCheckbox);

    await captchaSettingsBlock.waitFor();

    if(!await captchaSettingsSystemValueCheckbox.isVisible()) {
      await captchaSettingsBlock.click();
    }

    if(await captchaSettingsSystemValueCheckbox.isChecked()){
      await captchaSettingsSystemValueCheckbox.uncheck();
    }

    const captchaSettingSelectField = this.page.locator(UIReference.configurationPage.captchaSettingSelectField);
    const selectedOption = await captchaSettingSelectField.locator('option:checked').textContent();

    // We only have to perform these steps if the option is set to 'Yes'
    if(selectedOption == 'Yes') {
      await captchaSettingSelectField.selectOption({label: inputValues.captcha.captchaDisabled});

      const saveConfigButton = this.page.getByRole('button', { name: UIReference.configurationPage.saveConfigButtonLabel });
      await saveConfigButton.click();

      await expect(this.page.locator(UIReference.general.messageLocator)).toBeVisible();
    }
  }

  /**
   * @feature Enable multiple admin logins in Magento
   * @scenario Admin enables the ability for multiple users to log in with the same admin account
   * @given the user is on the Magento admin dashboard
   * @when the user navigates to Stores > Configuration > Advanced > Admin > Security
   * @and the "Allow Multiple Admin Account Login" field is visible
   * @and the "Use system value" checkbox is unchecked
   * @and the select field value is "No"
   * @then the user selects "Yes" from the dropdown
   * @and clicks the Save Config button
   * @then the system displays a success message
   */
  async enableMultipleAdminLogins() {
    const mainMenuStoresButton = this.page.getByRole('link', { name: UIReference.magentoAdminPage.navigation.storesButtonLabel});
    // selecting first specifically because plugins can place another 'configuration' link in this menu.
    const storeSettingsConfigurationLink = this.page.getByRole('link', { name: UIReference.magentoAdminPage.subNavigation.configurationButtonLabel }).first();
    await mainMenuStoresButton.click();
    await storeSettingsConfigurationLink.waitFor();
    await storeSettingsConfigurationLink.click();

    const advancedConfigurationTab = this.page.getByRole('tab', { name: UIReference.configurationPage.advancedTabLabel });
    const advancedConfigAdminLabel = this.page.getByRole('link', { name: UIReference.configurationPage.advancedAdministrationTabLabel, exact: true });
    await advancedConfigurationTab.click();
    await advancedConfigAdminLabel.waitFor();
    await advancedConfigAdminLabel.click();

    const advancedConfigSecuritySection = this.page.getByRole('link', { name: UIReference.configurationPage.securitySectionLabel });
    const multipleLoginsSystemCheckbox = this.page.locator(UIReference.configurationPage.allowMultipleLoginsSystemCheckbox);

    await advancedConfigSecuritySection.waitFor();
    if (!await multipleLoginsSystemCheckbox.isVisible()) {
      await advancedConfigSecuritySection.click();
    }

    await expect(multipleLoginsSystemCheckbox).toBeVisible();

    // make sure the 'use system value' option is not checked
    const adminAccountSharingSystemValueCheckbox = this.page.locator(UIReference.configurationPage.allowMultipleLoginsSystemCheckbox);
    if (await adminAccountSharingSystemValueCheckbox.isChecked()) {
      await adminAccountSharingSystemValueCheckbox.uncheck();
    }

    const allowMultipleLoginSelectField = this.page.locator(UIReference.configurationPage.allowMultipleLoginsSelectField);
    const selectedOption = await allowMultipleLoginSelectField.locator('option:checked').textContent();

    // We only have to perform these steps if the option is set to 'No'
    if(selectedOption == 'No') {
      await allowMultipleLoginSelectField.selectOption({label: inputValues.adminLogins.allowMultipleLogins});

      const saveConfigButton = this.page.getByRole('button', { name: UIReference.configurationPage.saveConfigButtonLabel });
      await saveConfigButton.click();

      await expect(this.page.locator(UIReference.general.messageLocator)).toBeVisible();
    }
  }

  /**
   * @feature Login to Magento admin dashboard
   * @scenario User logs in to admin dashboard
   * @given the admin slug environment variable is defined
   * @and the user navigates to the admin login page
   * @when the user enters a valid username and password
   * @and the user clicks the login button
   * @then the user should see the dashboard heading displayed
   */
  async login(username: string, password: string){
    if(!process.env.MAGENTO_ADMIN_SLUG) {
      throw new Error("MAGENTO_ADMIN_SLUG is not defined in your .env file.");
    }

    await this.page.goto(process.env.MAGENTO_ADMIN_SLUG);
    await this.page.waitForURL(`**/${process.env.MAGENTO_ADMIN_SLUG}`);

    if(await this.page.getByRole('heading', {name: UIReference.magentoAdminPage.dashboardHeadingText}).isVisible()) {
      // already logged in
      return;
    }

    await this.adminLoginEmailField.fill(username);
    await this.adminLoginPasswordField.fill(password);
    await this.adminLoginButton.click();

    // expect the H1 'Dashboard' to be visible
    await expect(this.page.getByRole('heading',{level:1, name: UIReference.magentoAdminPage.dashboardHeadingText})).toBeVisible();
  }
}

export default MagentoAdminPage;
