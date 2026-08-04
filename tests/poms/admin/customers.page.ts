// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference, inputValues, outcomeMarker, slugs } from '@config';
import { requireEnv } from "@utils/env.utils";
import { slugToRegex } from '@utils/url.utils';

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
   * @then reset the table filter
   * @then the system returns whether a customer with that email exists in the customer list
   */
  async checkIfCustomerExists(email: string){
	const mainMenuCustomersButton = this.page.getByRole('link', {name: UIReference.text.admin.common.customers}).first();
	const allCustomersLink = this.page.getByRole('link', {name: UIReference.text.admin.common.navigation.allCustomers});
	const customersSearchField = this.page.getByRole('textbox', {name: UIReference.text.admin.common.tableSearch});

	// loop clicking the 'Customers' button until clicking it show the subnavigation
	await expect(async() =>{
	  await mainMenuCustomersButton.press('Enter');
	  await expect(allCustomersLink, `Link to "All Customers" is visible`).toBeVisible({timeout: 5000});
	}).toPass();

	await allCustomersLink.click();

	// Wait for URL. If loading symbol is visible, wait for it to go away
	await this.page.waitForURL(slugToRegex(`/${requireEnv('MAGENTO_ADMIN_SLUG')}${slugs.admin.customers.index}`));
	if (await this.page.locator(UIReference.selectors.shared.spinner).isVisible()) {
	  await this.page.locator(UIReference.selectors.shared.spinner).waitFor({state: 'hidden'});
	}

	await customersSearchField.waitFor();
	await customersSearchField.fill(email);
	await this.page.getByRole('button', {name: UIReference.text.shared.buttons.search}).click();

	// Wait for the loader spinner to be hidden
	if (await this.page.locator(UIReference.selectors.shared.spinner).isVisible()) {
	  await this.page.locator(UIReference.selectors.shared.spinner).waitFor({state: 'hidden'});
	}

	// Loop to ensure the 'results found' text is visible
	await expect(
	  this.page.getByText(outcomeMarker.adminGeneral.activeFiltersText).first(),
	  "There are active filters."
	).toBeVisible();

	// Return true (email found) or false (email not found)
	const emailIsFound = await this.page.getByRole('cell', {name:email}).locator('div').isVisible();

	// Click 'Clear all' button on filtered table to reset the table state.
	await this.page.getByRole('button', {name: UIReference.text.shared.buttons.clearAll}).click();

	// Wait for the loader spinner to be hidden
	if (await this.page.locator(UIReference.selectors.shared.spinner).isVisible()) {
	  await this.page.locator(UIReference.selectors.shared.spinner).waitFor({state: 'hidden'});
	}

	await expect(
	  this.page.getByText(outcomeMarker.adminGeneral.activeFiltersText).first(),
	  "There are no filters active."
	).toBeHidden();

	return emailIsFound;
  }

  /**
   * @feature Customer Management
   * @scenario Create a new customer account
   * @given the admin is on the Magento dashboard
   * @when the admin navigates to Customers > All Customers
   * @and clicks the 'Create New Customer' button
   * @then the admin fills in the mandatory fields and optional fields for a new customer account
   * @and the system saves the customer account and navigates to the account edit page
   * @and displays a confirmation message that the customer was saved
   */
  async createNewCustomerAccount(
	firstName: string,
	lastName: string,
	email: string
  ) {
	const createNewCustomersLink = this.page.getByRole('button', {name: UIReference.text.admin.customers.createNew});
	await createNewCustomersLink.click();

	// Wait for URL. If loading symbol is visible, wait for it to go away
	await this.page.waitForURL(slugToRegex(`/${requireEnv('MAGENTO_ADMIN_SLUG')}${slugs.admin.customers.new}`));
	if (await this.page.locator(UIReference.selectors.shared.spinner).isVisible()) {
	  await this.page.locator(UIReference.selectors.shared.spinner).waitFor({state: 'hidden'});
	}

	const accountCreationFirstNameField = this.page.getByLabel(UIReference.text.shared.forms.firstName);
	const accountCreationLastNameField = this.page.getByLabel(UIReference.text.shared.forms.lastName);
	const accountCreationEmailField = this.page.getByLabel(UIReference.text.shared.forms.email, { exact: true});
	const accountCreationConfirmButton = this.page.getByRole('button', {name: UIReference.text.admin.customers.saveAndContinue});
	const customersSearchField = this.page.getByRole('textbox', {name: UIReference.text.admin.common.tableSearch});

	// Optional fields:
	const allowBulkPurchaseSwitcher = this.page.locator(UIReference.selectors.admin.cartPriceRules.activeStatusSwitcher).first();

	await accountCreationFirstNameField.fill(firstName);
	await accountCreationLastNameField.fill(lastName);
	await accountCreationEmailField.fill(email);
	await allowBulkPurchaseSwitcher.click();
	await accountCreationConfirmButton.click();

	await this.page.waitForURL(slugToRegex(`/${requireEnv('MAGENTO_ADMIN_SLUG')}${slugs.admin.customers.edit}`));
	if (await this.page.locator(UIReference.selectors.shared.spinner).isVisible()) {
	  await this.page.locator(UIReference.selectors.shared.spinner).waitFor({state: 'hidden'});

	  await expect(
		this.page.locator(UIReference.selectors.shared.message).filter({hasText: 'You saved the customer.'})
	  ).toBeVisible();
	}

	await this.approveAccount(email);
  }

  /**
   * @feature Customer Management
   * @scenario Approve a customer account
   * @given the admin is on the Magento dashboard
   * @when the admin navigates to Customers > All Customers
   * @and searches for a specific email address
   * @then the admin clicks on the 'Edit' link for the corresponding customer
   * @and approves the customer account
   * @and the system displays a confirmation message that the customer account has been approved
   */
  async approveAccount(email: string) {

	const customersSearchField = this.page.getByRole('textbox', {name: UIReference.text.admin.common.tableSearch});
	const editAccountButton = this.page.getByRole('link', {name: 'Edit'}).first()
	const approvalButtonAccountEdit = this.page.getByRole('button', {name: 'Approve'})

	await customersSearchField.waitFor();
	await customersSearchField.fill(email);
	await this.page.getByRole('button', {name: UIReference.text.shared.buttons.search}).click();

	if (await this.page.locator(UIReference.selectors.shared.spinner).isVisible()) {
	  await this.page.locator(UIReference.selectors.shared.spinner).waitFor({state: 'hidden'});
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

	await this.page.waitForURL(slugToRegex(`/${requireEnv('MAGENTO_ADMIN_SLUG')}${slugs.admin.customers.edit}`));
	if (await this.page.locator(UIReference.selectors.shared.spinner).isVisible()) {
	  console.log('Spinner is visible');
	  await this.page.locator(UIReference.selectors.shared.spinner).waitFor({state: 'hidden'});
	}

	// Press approval button when approval button is visible
	if (await approvalButtonAccountEdit.isVisible()) {
	  await approvalButtonAccountEdit.click();

	  await this.page.waitForURL(slugToRegex(`/${requireEnv('MAGENTO_ADMIN_SLUG')}${slugs.admin.customers.edit}`));
	  if (await this.page.locator(UIReference.selectors.shared.spinner).isVisible()) {
		console.log('Spinner is visible');
		await this.page.locator(UIReference.selectors.shared.spinner).waitFor({state: 'hidden'});
	  }
	  await expect(
		this.page
		  .locator(UIReference.selectors.shared.message)
		  .filter({ hasText: 'Customer account has been approved!' })
	  ).toBeVisible();
	}
  }
}

export default AdminCustomers;