// @ts-check

/**
 * Copyright elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileOverview Adjusts necessary settings and records for testing purposes.
 *               Runs once as the 'setup' project (a dependency of the browser
 *               projects in playwright.config.ts).
 */

import { test, expect } from '@playwright/test';

import { requireEnv } from '@utils/env.utils';
import ApiClient from '@utils/apiClient.utils';

import { inputValues, UIReference } from '@config';

import AdminLogin from '@poms/admin/adminlogin.page';

const magentoAdminUsername = requireEnv(`MAGENTO_ADMIN_USERNAME`);
const magentoAdminPassword = requireEnv(`MAGENTO_ADMIN_PASSWORD`);
let APIClient : ApiClient;

/**
 * The Magento admin token endpoint can be CAPTCHA-blocked on a fresh
 * environment. The API tests below depend on that endpoint, so the
 * CAPTCHA-disable test must complete before they run. Serial mode enforces
 * that ordering inside this setup file. (Project dependencies handle ordering
 * relative to the browser projects, but not within a single setup file.)
 */
test.describe.configure({
	mode: 'serial'
});

// Set up an API Client
test.beforeAll(`Initialize API Client`, async() => {
	APIClient = await new ApiClient().create();
});

/**
 * Disable the Login CAPTCHA so Playwright can log in.
 *
 * @param page - Playwright Page instance (fixture)
 */
test('Disable_login_captcha_and_enable_multiple_login', async ({ page }) => {

	// Pop-up definitions. Each entry maps a trigger locator to its dismiss button.
	// ElasticSuite Telemetry, ElasticSuite Newsletters, Adobe Data Collection, Magento Incoming Message
	const popUpDismissals = [
		{
			locator: page.getByText(UIReference.text.admin.configuration.adobeDataCollection),
			button: page.getByRole('button', { name: UIReference.text.admin.configuration.declineDontAllow }),
		},
		{
			locator: page.getByText(UIReference.text.admin.configuration.elasticSuiteNewsletter),
			button: page.getByRole('button', { name: UIReference.text.admin.configuration.declineNoThanks }),
		},
		{
			locator: page.getByText(UIReference.text.admin.configuration.elasticSuiteTelemetry),
			button: page.getByRole('button', { name: UIReference.text.admin.common.ok }),
		},
		{
			locator: page.getByRole('heading', {name: UIReference.text.admin.configuration.magentoIncomingMessage}),
			button: page.locator(UIReference.selectors.admin.common.modalHeader).getByRole('button'),
		},
	];

	// Dismiss all visible pop-ups using dispatchEvent to bypass actionability checks.
	// This avoids getting stuck when one pop-up overlaps another's dismiss button.
	const dismissAllVisiblePopUps = async () => {
		for (const { locator, button } of popUpDismissals) {
			if (await locator.isVisible()) {
				await button.dispatchEvent('click');
			}
		}
	};

	for (const { locator } of popUpDismissals) {
		await page.addLocatorHandler(locator, dismissAllVisiblePopUps);
	}

	const adminLoginPage = new AdminLogin(page);

	await test.step(`Step: Login to admin environment`, async() => {
		await adminLoginPage.loginAdmin(magentoAdminUsername, magentoAdminPassword);
	});

	await test.step(`Step: Disable login CAPTCHA`, async() => {
		await adminLoginPage.navigateToStoreSettings();
		await adminLoginPage.disableReCAPTCHA();
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

/**
 * Set up test accounts through the Magento API.
 *
 */
test(`Create_test_accounts`, { tag: '@api' }, async ({}) => {
	test.slow(); // Mark as slow to double test time.

	const ACCOUNTS_PER_PROJECT = 13;
	const browserProjects = test.info().config.projects
		.map(p => p.name)
		.filter(name => name !== 'setup');

	await test.step(`Creating accounts for general testing`, async() => {
		// Fetch existing playwright+* accounts so we only create missing ones.
		const allCustomers = await APIClient.get(
			`/rest/V1/customers/search` +
			`?searchCriteria[filterGroups][0][filters][0][field]=email` +
			`&searchCriteria[filterGroups][0][filters][0][value]=%25playwright%2B%25` +
			`&searchCriteria[filterGroups][0][filters][0][conditionType]=like`);
		const existingEmails = new Set<string>(
			(allCustomers.items ?? []).map((c: { email: string }) => c.email)
		);

		const created: string[] = [];
		const skipped: string[] = [];

		for (let accountId = 0; accountId < ACCOUNTS_PER_PROJECT; accountId++) {
			const email = `playwright+${accountId}@elgentos.nl`;

			if (existingEmails.has(email)) {
				skipped.push(email);
				continue;
			}

			const customerPayload = {
				customer : {
					email,
					firstname: `${inputValues.account.firstName}`,
					lastname: `${inputValues.account.lastName}`,
					addresses: [{
						firstname: `${inputValues.account.firstName}`,
						lastname: `${inputValues.account.lastName}`,
						street: [inputValues.firstAddress.firstStreetAddressValue],
						city: inputValues.firstAddress.firstCityValue,
						region: { region: inputValues.firstAddress.firstProvinceValue },
						postcode: inputValues.firstAddress.firstZipCodeValue,
						country_id: inputValues.firstAddress.firstCountryId,
						telephone: inputValues.firstAddress.firstPhoneNumberValue,
						default_billing: true,
						default_shipping: true,
					}]
				},
				password: `${requireEnv('MAGENTO_ADMIN_PASSWORD')}`
			};

			await APIClient.post(`/rest/V1/customers`, customerPayload);
			created.push(email);
		}


		test.info().annotations.push({
			type: `accounts created`,
			description: `Created ${created.length} accounts, skipped ${skipped.length} pre-existing.\nCreated:\n${created.join('\n')}`,
		});
	});
});

/**
 * Set up coupon codes through the Magento API. Iterates over every entry in
 * inputValues.coupon.codes (keyed by uppercase browser name); creating the
 * coupon if missing, activating it if disabled, or just annotating it if it
 * already exists and is active.
 */
test(`Set_coupon_codes`, { tag: '@api' }, async () => {

	const couponCodeEntries = Object.entries(inputValues.coupon.codes) as [string, string][];

	for (const [browserKey, couponCode] of couponCodeEntries) {
		await test.step(`Ensure coupon "${couponCode}" (${browserKey}) exists and is active`, async () => {
			const couponCheckResponse = await APIClient.get(
				`/rest/V1/coupons/search` +
				`?searchCriteria[filter_groups][0][filters][0][field]=code` +
				`&searchCriteria[filter_groups][0][filters][0][value]=%${couponCode}%` +
				`&searchCriteria[filter_groups][0][filters][0][condition_type]=like`
			);
			const codePresent = couponCheckResponse.items.some(
				(item: { code: string; }) => item.code === `${couponCode}`);

			if (codePresent) {
				const coupon = couponCheckResponse.items.find((item: { code: string; }) => item.code === `${couponCode}`);
				const ruleId = coupon.rule_id;
				const rule = await APIClient.get(`/rest/V1/salesRules/${ruleId}`);

				if (!rule.is_active) {
					rule.is_active = true;
					const updateCoupon = await APIClient.put(`/rest/V1/salesRules/${ruleId}`, { rule: rule });

					if (updateCoupon.is_active) {
						test.info().annotations.push({
							type: 'Coupon notice',
							description: `Your code "${coupon.code}" was found, but we had to activate it manually.`
						});
					}
				} else {
					test.info().annotations.push({
						type: 'Coupon notice',
						description: `Your code "${coupon.code}" was found. Active status: ${rule.is_active}.`
					});
				}
			} else {
				// Not present. Create the rule + coupon.
				const websiteInfo = await APIClient.get(`/rest/V1/store/websites`);
				const customerGroups = await APIClient.get(`/rest/V1/customerGroups/search?searchCriteria=all`);
				const websiteIds: any[] = [];
				const customerGroupsIds: any[] = [];

				websiteInfo.forEach((website: { name: string; id: any; }) => {
					if (website.name !== 'admin') {
						websiteIds.push(website.id);
					}
				});

				customerGroups.items.forEach((customerGroup: { id: any; }) => {
					customerGroupsIds.push(customerGroup.id);
				});

				const newRule = {
					name : inputValues.coupon.couponCodeRuleName,
					website_ids: websiteIds,
					customer_group_ids: customerGroupsIds,
					from_date: new Date().toISOString().split('T')[0],
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
					coupon_type: 2, // 2 is 'SPECIFIC_COUPON'
					use_auto_generation: false,
					uses_per_coupon: 0
				};

				const newCouponRule = await APIClient.post(`/rest/V1/salesRules`, { rule: newRule });

				const couponAPIJSON = {
					rule_id: newCouponRule.rule_id,
					code: couponCode,
					times_used: 0,
					is_primary: true
				};

				const createNewCoupon = await APIClient.post(`/rest/V1/coupons`, { coupon: couponAPIJSON });
				test.info().annotations.push({
					type: `Coupon Created`,
					description: `Created coupon: ${JSON.stringify(createNewCoupon)}`
				});
			}
		});
	}
});
