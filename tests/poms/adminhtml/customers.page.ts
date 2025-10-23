// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, inputValues, outcomeMarker } from '@config';
import { requireEnv } from "@utils/env.utils";

class AdminCustomers {
  readonly page: Page;

  constructor(page: Page) {
	this.page = page;
  }

  /**
   * @feature Customer Management
   * @scenario Check if a customer exists by email address
   * @given the admin is on the Magento dashboard
   * @when the admin navigates to Customers > All Customers
   * @and the customer table is fully loaded
   * @and the admin searches for a specific email address
   * @then the system returns whether a customer with that email exists in the customer list
   */
  async checkIfCustomerExists(email: string){
	const mainMenuCustomersButton = this.page.getByRole('link', {name: UIReference.adminPage.navigation.customersButtonLabel}).first();
	const allCustomersLink = this.page.getByRole('link', {name: UIReference.adminPage.subNavigation.allCustomersButtonLabel});
	const customersSearchField = this.page.getByRole('textbox', {name: UIReference.customerOverviewPage.tableSearchFieldLabel});

	// loop clicking the 'Customers' button until clicking it show the subnavigation
	await expect(async() =>{
	  await mainMenuCustomersButton.press('Enter');
	  await expect(allCustomersLink, `Link to "All Customers" is visible`).toBeVisible({timeout: 5000});
	}).toPass();

	await allCustomersLink.click();

	// Wait for URL. If loading symbol is visible, wait for it to go away
	await this.page.waitForURL(`**/${requireEnv('MAGENTO_ADMIN_SLUG')}/customer/index/**`);
	if (await this.page.locator(UIReference.general.loadingSpinnerLocator).isVisible()) {
	  await this.page.locator(UIReference.general.loadingSpinnerLocator).waitFor({state: 'hidden'});
	}

	await customersSearchField.waitFor();
	await customersSearchField.fill(email);
	await this.page.getByRole('button', {name: UIReference.general.searchButtonLabel}).click();


	if (await this.page.locator(UIReference.general.loadingSpinnerLocator).isVisible()) {
	  await this.page.locator(UIReference.general.loadingSpinnerLocator).waitFor({state: 'hidden'});
	}

	// Loop to ensure the 'results found' text is visible
	await expect(async() =>{
	  await this.page.getByText(outcomeMarker.customerOverviewPage.searchResultsFoundText).first();
	}).toPass();

	// Return true (email found) or false (email not found)
	return await this.page.getByRole('cell', {name:email}).locator('div').isVisible();
  }

  async createNewCustomerAccount (
	firstName: string,
	lastName: string,
	email: string
  ) {
	const createNewCustomersLink = this.page.getByRole('button', {name: UIReference.adminCustomers.createNewCustomerButtonLabel});
	await createNewCustomersLink.click();

	// Wait for URL. If loading symbol is visible, wait for it to go away
	await this.page.waitForURL(`**/${requireEnv('MAGENTO_ADMIN_SLUG')}/customer/index/new/**`);
	if (await this.page.locator(UIReference.adminGeneral.loadingSpinnerLocator).isVisible()) {
	  await this.page.locator(UIReference.adminGeneral.loadingSpinnerLocator).waitFor({state: 'hidden'});
	}

	const accountCreationFirstNameField = this.page.getByLabel(UIReference.personalInformation.firstNameLabel);
	const accountCreationLastNameField = this.page.getByLabel(UIReference.personalInformation.lastNameLabel);
	const accountCreationEmailField = this.page.getByLabel(UIReference.credentials.emailFieldLabel, { exact: true});
	const accountCreationConfirmButton = this.page.getByRole('button', {name: UIReference.adminCustomers.registration.createAccountSaveAndContinueButtonLabel});
	const customersSearchField = this.page.getByRole('textbox', {name: UIReference.adminGeneral.tableSearchFieldLabel});

	// Optional fields:
	const allowBulkPurchaseSwitcher = this.page.locator(UIReference.cartPriceRulesPage.activeStatusSwitcherLocator).first();

	await accountCreationFirstNameField.fill(firstName);
	await accountCreationLastNameField.fill(lastName);
	await accountCreationEmailField.fill(email);
	await allowBulkPurchaseSwitcher.click();
	await accountCreationConfirmButton.click();

	await this.page.waitForURL(`**/${requireEnv('MAGENTO_ADMIN_SLUG')}/customer/index/edit/**`);
	if (await this.page.locator(UIReference.adminGeneral.loadingSpinnerLocator).isVisible()) {
	  await this.page.locator(UIReference.adminGeneral.loadingSpinnerLocator).waitFor({state: 'hidden'});

	  await expect(
		this.page.locator(UIReference.general.messageLocator).filter({hasText: 'You saved the customer.'})
	  ).toBeVisible();
	}

	// REMOVE THIS
	// requires module
	const passwordField =  this.page.locator("[name='new_customer_pwd']");
	const passwordInputValue = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');
	const updatePasswordButton = this.page.getByRole('button', {name: 'Update Password'})
	// Adding password to customer user
	await passwordField.fill(passwordInputValue);
	await updatePasswordButton.click();
	await expect(
	  this.page
		.locator(UIReference.general.messageLocator)
		.filter({ hasText: 'Password has been updated successfully.' })
	).toBeVisible();

	await this.approveAccount(email)
	// REMOVE THIS
  }

  async approveAccount(email: string) {
	console.log('Approve Account Actions');

	const customersSearchField = this.page.getByRole('textbox', {name: UIReference.adminGeneral.tableSearchFieldLabel});
	const editAccountButton = this.page.getByRole('link', {name: 'Edit'}).first()
	const approvalButtonAccountEdit = this.page.getByRole('button', {name: 'Approve'})

	await customersSearchField.waitFor();
	await customersSearchField.fill(email);
	await this.page.getByRole('button', {name: UIReference.adminGeneral.searchButtonLabel}).click();

	if (await this.page.locator(UIReference.adminGeneral.loadingSpinnerLocator).isVisible()) {
	  await this.page.locator(UIReference.adminGeneral.loadingSpinnerLocator).waitFor({state: 'hidden'});
	}

	// Loop to ensure the 'results found' text is visible
	await expect(async() =>{
	  await this.page.getByText(outcomeMarker.customerOverviewPage.searchResultsFoundText).first();
	}).toPass();

	// Return true (email found) or false (email not found)
	await this.page.getByRole('cell', {name:email}).locator('div').isVisible();

	await expect(async() => {
	  editAccountButton.click();
	}).toPass();

	await this.page.waitForURL(`**/${requireEnv('MAGENTO_ADMIN_SLUG')}/customer/index/edit/**`);
	if (await this.page.locator(UIReference.general.loadingSpinnerLocator).isVisible()) {
	  console.log('Spinner is visible');
	  await this.page.locator(UIReference.general.loadingSpinnerLocator).waitFor({state: 'hidden'});
	}

	// Press approval button when approval button is visible
	if (await approvalButtonAccountEdit.isVisible()) {
	  await approvalButtonAccountEdit.click();

	  await this.page.waitForURL(`**/${requireEnv('MAGENTO_ADMIN_SLUG')}/customer/index/edit/**`);
	  if (await this.page.locator(UIReference.general.loadingSpinnerLocator).isVisible()) {
		console.log('Spinner is visible');
		await this.page.locator(UIReference.general.loadingSpinnerLocator).waitFor({state: 'hidden'});
	  }
	  await expect(
		this.page
		  .locator(UIReference.general.messageLocator)
		  .filter({ hasText: 'Customer account has been approved!' })
	  ).toBeVisible();
	}
  }
}

export default AdminCustomers;