// @ts-check

/**
 * Copyright elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileOverview adjusts necessary settings and records for testing purposes.
 */

import { test, expect } from '@playwright/test';

import { requireEnv } from '@utils/env.utils';
import ApiClient from '@utils/apiClient.utils';

import { inputValues } from '@config';

import AdminLogin from '@poms/admin/adminlogin.page';
import AdminMarketing from '@poms/admin/marketing.page';

/**
 * Set variables we'll be using throughout the file.
 */
const magentoAdminUsername = requireEnv(`MAGENTO_ADMIN_USERNAME`);
const magentoAdminPassword = requireEnv(`MAGENTO_ADMIN_PASSWORD`);
let APIClient : ApiClient;

// Set up an API Client
test.beforeAll(`Initialize API Client`, async() => {
	APIClient = await new ApiClient().create();
});

/**
 * Disable the Login CAPTCHA to ensure Playwright can log in.
 *
 * @param page - Playwright Page instance (fixture)
 * @param browserName - the name of the browser running the test.
 */
test('Disable_login_captcha_and_enable_multiple_login', {
	tag: '@setup'}, async ({ page, browserName }) => {

	test.skip( browserName !== 'chromium',
		`Disabling login captcha through Chromium. This is ${browserName}, therefore test is skipped.`
	);

	const adminLoginPage = new AdminLogin(page);

	await test.step(`Step: Login to admin environment`, async() => {
		await adminLoginPage.loginAdmin(magentoAdminUsername, magentoAdminPassword);
	});

	await test.step(`Step: Disable login CAPTCHA`, async() => {
		await adminLoginPage.navigateToStoreSettings();
		await adminLoginPage.disableLoginCaptcha();
	});

	await test.step(`Step: Enable multiple admin login`, async() => {
		await expect(async () => {
			await expect(page.getByRole('link', {name: 'Customer Configuration'}),
				`"Customer Configuration" under General section is visible.`).toBeVisible();
		}).toPass();

		await adminLoginPage.enableMultipleAdminLogins();
	});

});


test(`Create_test_accounts`, {
	tag: ['@setup', '@api']}, async ({ browserName }, testInfo) => {
	// Mark as slow to double test time.
	test.slow();

	test.skip( browserName !== 'chromium',
		`Accounts are made through API call - only one browser is required.`
	);

	// Start by checking if the accounts already exist
	const allCustomers = await APIClient.get(`/rest/V1/customers/search?searchCriteria=all`);
	const testAccountsPresent = allCustomers.items.filter((item: { email: string; }) => item.email.includes('playwright_user'));

	if(testAccountsPresent.length > 0) {
		testInfo.annotations.push({
			type: `test accounts found`,
			description: `We found testing accounts. Please check if the following is correct:
			${JSON.stringify(testAccountsPresent, null, 2)}`}
		);
	} else {
		// Create 12 test accounts for 12 workers.
		for(let accountId = 0; accountId < 13; accountId++) {
			const customerPayload = {
				customer : {
					email: `playwright_user_${accountId}@elgentos.nl`,
					firstname: `${inputValues.account.firstName}`,
					lastname: `${inputValues.account.lastName}`
				},
				password: `${requireEnv('MAGENTO_ADMIN_PASSWORD')}`
			};

			const addCustomerResponse = await APIClient.post(`/rest/V1/customers`, customerPayload);
			testInfo.annotations.push({
				type: `accounts created!`,
				description: `The following accounts have been created:
			${JSON.stringify(addCustomerResponse, null, 2)}`}
			);
		}
	}
});


test(`Set_coupon_codes`, {
	tag: ['@setup', '@api']}, async ({ browserName }, testInfo) => {

	// TODO: Remove all console.log calls
	// TODO: Clean up code
	// TODO: Move to marketing.page.ts

	const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
	const couponCode = requireEnv(`MAGENTO_COUPON_CODE_${browserEngine}`);

	// Find all coupon codes, then check if testing coupon exists
	const couponCheckResponse = await APIClient.get(`/rest/V1/coupons/search?searchCriteria=all`);
	const codePresent = couponCheckResponse.items.some((item: { code: string; }) => item.code === `${couponCode}`);

	// If coupon is present, check if it's enabled.
	if(codePresent) {
		// Retrieve sales rule
		const coupon = couponCheckResponse.items.find((item: { code: string; }) => item.code === `${couponCode}`);
		const ruleId = coupon.rule_id;
		const rule = await APIClient.get(`/rest/V1/salesRules/${ruleId}`);

		// If not active, set to active.
		if(!rule.is_active) {
			rule.is_active = true;
			const updateCoupon = await APIClient.put(`/rest/V1/salesRules/${ruleId}`, { rule: rule });

			if(updateCoupon.is_active) {
				testInfo.annotations.push({type: 'Coupon notice', description: `Your code "${coupon.code}" was found, but we had to activate it manually.`});
			}
			return;
		} else {
			// code is present and enabled.
			testInfo.annotations.push({type: 'Coupon notice', description: `Your code "${coupon.code}" was found. Active status: ${rule.is_active}.`});
			return;
		}

	} else {
		// Not present. Set coupon code, then check.
		const rules = await APIClient.get(`/rest/V1/salesRules/search?searchCriteria=all`);
		const websiteInfo = await APIClient.get(`/rest/V1/store/websites`);
		const customerGroups = await APIClient.get(`/rest/V1/customerGroups/search?searchCriteria=all`);
		let websiteIds: any[] = [];
		let customerGroupsIds: any[] = [];

		websiteInfo.forEach((website: { name: string; id: any; }) => {
			if(website.name !== 'admin') {
				websiteIds.push(website.id);
			}
		});

		customerGroups.items.forEach((customerGroup: { id: any; }) => {
			customerGroupsIds.push(customerGroup.id);
		});

		// console.log(websiteIds, customerGroupsIds);

		const newRule = {
			name : 'Test Coupon',
			website_ids: websiteIds,
			customer_group_ids: customerGroupsIds,
			from_date: '2025-01-20',
			uses_per_customer: 0,
			is_active: true,
			stop_rules_processing: true,
			is_advanced: true,
			sort_order: 0,
			discount_amount: 10,
			discount_step: 0,
			apply_to_shipping: false,
			times_used: 0,
			is_rss: true,
			coupon_type: 'SPECIFIC_COUPON',
			use_auto_generation: false,
			uses_per_coupon: 0
		};

		const newCouponRule = await APIClient.post(`/rest/V1/salesRules`, {rule: newRule});
		// console.log(newCouponRule);

		// TODO: Now create the actual coupon
		const couponAPIJSON = {
			rule_id: newCouponRule.rule_id,
			code: couponCode,
			times_used: 0,
			is_primary: true
		};

		const createNewCoupon = await APIClient.post(`/rest/V1/coupons`, {coupon: couponAPIJSON});
		// console.log(createNewCoupon);
		testInfo.annotations.push({type: `Coupon Created`, description: `Created coupon: ${JSON.stringify(createNewCoupon)}`});
	}
});


// // @ts-check

// import { test } from '@playwright/test';
// import { faker } from '@faker-js/faker';
// import { inputValues } from '@config';
// import { requireEnv } from '@utils/env.utils';
// import { createLogger } from '@utils/logger';

// import AdminLogin from '@poms/adminhtml/login.page';
// import AdminMarketing from '@poms/adminhtml/marketing.page';
// import AdminCustomers from '@poms/adminhtml/customers.page';

// import RegisterPage from '@poms/frontend/register.page';

// const logger = createLogger('Setup');

// const magentoAdminUsername = requireEnv('MAGENTO_ADMIN_USERNAME');
// const magentoAdminPassword = requireEnv('MAGENTO_ADMIN_PASSWORD');

// test.beforeEach(async ({ page }, testInfo) => {
//   const adminLoginPage = new AdminLogin(page);
//   await adminLoginPage.login(magentoAdminUsername, magentoAdminPassword);
// });

// test.describe('Setting up the testing environment', () => {
//   // Set tests to serial mode to ensure the order is followed.
//   test.describe.configure({mode:'serial'});

//   /**
//    * @feature Magento Admin Configuration (disable login CAPTCHA)
//    * @scenario Disable login CAPTCHA in admin settings via Chromium browser
//    * @given the test is running in a Chromium-based browser
//    * @when the admin logs in to the Magento dashboard
//    * @and the admin navigates to the security configuration section
//    * @and the "Enable CAPTCHA on Admin Login" setting is updated to "No"
//    * @then the configuration is saved successfully
//    * @but if the browser is not Chromium
//    * @then the test is skipped with an appropriate message
//    */
//   test('Disable_login_captcha', { tag: '@setup' }, async ({ page, browserName }, testInfo) => {
//     test.skip(browserName !== 'chromium', `Disabling login captcha through Chromium. This is ${browserName}, therefore test is skipped.`);

//     const adminLoginPage = new AdminLogin(page);
//     await adminLoginPage.disableLoginCaptcha();
//   });

//   /**
//    * @feature Magento Admin Configuration (Enable multiple admin logins)
//    * @scenario Enable multiple admin logins only in Chromium browser
//    * @given the
//    * @scenario Enable multiple admin logins only in Chromium browser
//    * @given the test is running in a Chromium-based browser
//    * @when the admin logs in to the Magento dashboard
//    * @and the admin navigates to the configuration page
//    * @and the "Allow Multiple Admin Account Login" setting is updated to "Yes"
//    * @then the configuration is saved successfully
//    * @but if the browser is not Chromium
//    * @then the test is skipped with an appropriate message
//    */
//   test('Enable_multiple_admin_logins', { tag: '@setup' }, async ({ page, browserName }, testInfo) => {
//     test.skip(browserName !== 'chromium', `Disabling login captcha through Chromium. This is ${browserName}, therefore test is skipped.`);

//     const adminLoginPage = new AdminLogin(page);
//     await adminLoginPage.enableMultipleAdminLogins();
//   });

//   /**
//    * @feature Cart Price Rules Configuration
//    * @scenario Set up a coupon code for the current browser environment
//    * @given a valid coupon code environment variable exists for the current browser engine
//    * @when the admin navigates to the Cart Price Rules section
//    * @and the admin creates a new cart price rule with the specified coupon code
//    * @then the coupon code is successfully saved and available for use
//    */
//   test('Set_up_coupon_codes', { tag: '@setup'}, async ({page, browserName}, testInfo) => {
//     const adminMarketingPage = new AdminMarketing(page);
//     const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
//     const couponCode = requireEnv(`MAGENTO_COUPON_CODE_${browserEngine}`);

//     const addCouponCodeResult = await adminMarketingPage.addCartPriceRule(couponCode);
//     testInfo.annotations.push({type: 'notice', description: addCouponCodeResult});
//   });

//   /**
//    * @feature Customer Account Setup
//    * @scenario Create a test customer account for the current browser environment
//    * @given valid environment variables for email and password exist for the current browser engine
//    * @when the user navigates to the registration page
//    * @and submits the registration form with first name, last name, email, and password
//    * @then a new customer account is successfully created for testing purposes
//    */
//   test('Create_test_accounts', { tag: '@setup'}, async ({page, browserName}, testInfo) => {
//     const adminCustomersPage = new AdminCustomers(page);
//     const registerPage = new RegisterPage(page);
//     const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
//     const accountEmail = requireEnv(`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`);
//     const accountPassword = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');

//     await test.step(`Check if ${accountEmail} is already registered`, async () => {
//       const customerLookUp = await adminCustomersPage.checkIfCustomerExists(accountEmail);
//       if(customerLookUp){
//         testInfo.skip(true, `${accountEmail} was found in user table, this step is skipped. If you think this is incorrect, consider removing user from the table and try running the setup again.`);
//       }
//     });

//     await test.step('Create new customer', async () => {
//       await registerPage.createNewAccount(
//         inputValues.accountCreation.firstNameValue,
//         inputValues.accountCreation.lastNameValue,
//         accountEmail,
//         accountPassword,
//         true
//       );
//     });
//   });
// });
