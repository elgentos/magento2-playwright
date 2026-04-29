# Setup as Playwright Project Dependency — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the user-run `setup.spec.ts` with a Playwright `setup` project that runs automatically as a dependency of the browser projects, so a single `npx playwright test` invocation handles everything.

**Architecture:** Add a chromium-only `setup` project that matches `*.setup.ts`. Each browser project (`chromium`, `firefox`, `webkit`) declares `dependencies: ['setup']`. Setup work moves from `tests/setup.spec.ts` to `tests/init.setup.ts`. Coupon codes move from per-browser env vars (`MAGENTO_COUPON_CODE_*`) to a `coupon.codes` map in `tests/config/input-values.json`, and the setup loops over that map.

**Tech Stack:** Playwright (`@playwright/test`), TypeScript, GitLab CI, Magento 2 REST API.

**Spec:** `docs/superpowers/specs/2026-04-29-setup-as-project-dependency-design.md`

**Branch context:** Work on `421-setup-tests-should-not-be-tests`. Per project conventions (see `AGENTS.md`), do **not** modify anything under `base-tests/` — the next npm release republishes `tests/` → `base-tests/` automatically.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `tests/config/input-values.json` | Modify | Add `coupon.codes` map keyed by uppercase browser name |
| `tests/checkout.spec.ts` | Modify | Read coupon from `inputValues.coupon.codes` instead of env |
| `tests/shoppingcart.spec.ts` | Modify | Same as above |
| `tests/init.setup.ts` | Create | New canonical setup file (replaces `tests/setup.spec.ts`) |
| `tests/setup.spec.ts` | Delete | Superseded by `init.setup.ts` |
| `playwright.config.ts` | Modify | Add `setup` project, `getSetupFiles()` helper, exclude `setup.spec.ts` |
| `playwright.config.example.ts` | Modify | Mirror of the above (template for new installs) |
| `.env` | Modify | Remove three `MAGENTO_COUPON_CODE_*` lines |
| `.env.example` | Modify | Remove three `MAGENTO_COUPON_CODE_*` lines |
| `install.js` | Modify | Remove three coupon entries from `envVars` dict |
| `.gitlab-ci.yml` | Modify | Collapse two-stage pipeline; drop `MAGENTO_COUPON_CODE_*` vars |
| `README.md` | Modify | Drop separate-setup section; update tags/scenarios; add migration note |
| `AGENTS.md` | Modify | Update CI/CD section; reference `init.setup.ts` |
| `CHANGELOG.md` | Modify | Add `## [Unreleased]` block with breaking-change entry |

---

## Task 1: Move coupon codes from env vars to `input-values.json`

**Files:**
- Modify: `tests/config/input-values.json` (the `coupon` group at lines 22–25)
- Modify: `tests/checkout.spec.ts` (lines 11, 116, 153)
- Modify: `tests/shoppingcart.spec.ts` (lines 18, 108, 121)

This task lands first because it leaves the suite working: the existing `tests/setup.spec.ts` still creates coupons (using env vars in its own logic), and the .env still contains the codes that match the new `inputValues.coupon.codes` values. The consumers just stop *reading* the env.

- [ ] **Step 1.1: Add `codes` map to the coupon group**

Edit `tests/config/input-values.json`. Replace the existing `coupon` block:

```json
"coupon": {
    "couponCodeRuleName": "Test coupon",
    "couponType": "Specific Coupon"
},
```

with:

```json
"coupon": {
    "couponCodeRuleName": "Test coupon",
    "couponType": "Specific Coupon",
    "codes": {
        "CHROMIUM": "CHROMIUM321",
        "FIREFOX": "FIREFOX321",
        "WEBKIT": "WEBKIT321"
    }
},
```

(Tabs for indentation — match the rest of the file.)

- [ ] **Step 1.2: Update `tests/checkout.spec.ts` imports**

At line 13, the file currently has:

```ts
import { UIReference, slugs } from '@config';
```

Replace with:

```ts
import { UIReference, slugs, inputValues } from '@config';
```

The `requireEnv` import at line 11 (`import { requireEnv } from '@utils/env.utils';`) is no longer used in this file after the next two steps. Remove that line.

- [ ] **Step 1.3: Update both coupon lookups in `tests/checkout.spec.ts`**

At line 116 (inside `Add_coupon_code_in_checkout`), replace:

```ts
const discountCode = requireEnv(`MAGENTO_COUPON_CODE_${browserEngine}`);
```

with:

```ts
const discountCode = inputValues.coupon.codes[browserEngine];
```

At line 153 (inside `Remove_coupon_code_from_checkout`), make the same replacement.

- [ ] **Step 1.4: Update `tests/shoppingcart.spec.ts` imports**

At line 18, the file currently has:

```ts
import { UIReference, slugs, outcomeMarker } from '@config';
```

Replace with:

```ts
import { UIReference, slugs, outcomeMarker, inputValues } from '@config';
```

Note: leave the `requireEnv` import at line 16 in place — it's still used at line 67 to read `MAGENTO_EXISTING_ACCOUNT_PASSWORD`.

- [ ] **Step 1.5: Update both coupon lookups in `tests/shoppingcart.spec.ts`**

At line 108 (inside `Add_coupon_code_in_cart`), replace:

```ts
const discountCode = requireEnv(`MAGENTO_COUPON_CODE_${browserEngine}`);
```

with:

```ts
const discountCode = inputValues.coupon.codes[browserEngine];
```

At line 121 (inside `Remove_coupon_code_from_cart`), make the same replacement.

- [ ] **Step 1.6: Type-check the modified files**

Run from repo root:

```bash
npx tsc --noEmit
```

Expected: no errors. (If TypeScript complains about the dynamic `[browserEngine]` index returning `any` because `inputValues` is loaded from JSON without a type, that's pre-existing — every other access to `inputValues` in the codebase has the same shape.)

- [ ] **Step 1.7: Commit**

```bash
git add tests/config/input-values.json tests/checkout.spec.ts tests/shoppingcart.spec.ts
git commit -m "Move coupon codes from env vars to input-values.json"
```

---

## Task 2: Create `tests/init.setup.ts`

**Files:**
- Create: `tests/init.setup.ts`

This file is the canonical setup. Right now nothing matches `*.setup.ts` in `playwright.config.ts`, so creating the file is inert — the suite still uses the old `tests/setup.spec.ts`. Wiring happens in Task 3.

- [ ] **Step 2.1: Write `tests/init.setup.ts`**

Create the file with the following contents (use tabs for indentation to match the codebase style):

```ts
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
			locator: page.getByText(UIReference.admin.adobeDataCollectionText),
			button: page.getByRole('button', { name: UIReference.admin.declineDontAllowButton }),
		},
		{
			locator: page.getByText(UIReference.admin.elasticSuiteNewsletterLabel),
			button: page.getByRole('button', { name: UIReference.admin.declineNoThanksButton }),
		},
		{
			locator: page.getByText(UIReference.admin.elasticSuiteTelemetryLabel),
			button: page.getByRole('button', { name: UIReference.admin.okButtonLabel }),
		},
		{
			locator: page.getByRole('heading', {name: UIReference.admin.magentoIncomingMessageLabel}),
			button: page.locator(UIReference.admin.magentoModelHeaderLocator).getByRole('button'),
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
 * @param testInfo - Playwright class that allows annotations to the report.
 */
test(`Create_test_accounts`, { tag: '@api' }, async ({}, testInfo) => {
	test.slow(); // Mark as slow to double test time.

	await test.step(`Creating accounts for general testing`, async() => {
		// Start by checking if the accounts already exist
		const allCustomers = await APIClient.get(
			`/rest/V1/customers/search` +
			`?searchCriteria[filterGroups][0][filters][0][field]=email` +
			`&searchCriteria[filterGroups][0][filters][0][value]=%25playwright_user%25` +
			`&searchCriteria[filterGroups][0][filters][0][conditionType]=like`);
		const testAccountsPresent = allCustomers.items ?? [];

		if(testAccountsPresent.length > 0) {
			test.info().annotations.push({
				type: `test accounts found`,
				description: `We found testing accounts. Please check if the following is correct:
				${JSON.stringify(testAccountsPresent, null, 2)}`
			});
		} else {
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

				test.info().annotations.push({
					type: `accounts created!`,
					description: `The following accounts have been created:
				${JSON.stringify(addCustomerResponse, null, 2)}`
				});
			}
		}
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
				return;
			}

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
		});
	}
});
```

Note the differences from `tests/setup.spec.ts`:
- File ends with `.setup.ts` so it can be matched by the `setup` project we add in Task 3.
- No `@setup` tag (`Create_test_accounts` and `Set_coupon_codes` keep `@api`).
- No `test.skip(browserName !== 'chromium', …)` calls (the setup project is chromium-only).
- No `browserName` parameter on any test.
- The serial-mode comment is rewritten to explain the real reason (admin token endpoint vs. CAPTCHA).
- `Set_coupon_codes` loops over `inputValues.coupon.codes` instead of taking `browserName`.
- `Create_test_accounts` keeps its existing logic but no longer skips on non-chromium.

- [ ] **Step 2.2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.3: Verify the file isn't yet picked up by any project**

```bash
npx playwright test --list 2>&1 | grep -c init.setup
```

Expected: `0` — the new file exists but isn't matched by any project until Task 3.

- [ ] **Step 2.4: Commit**

```bash
git add tests/init.setup.ts
git commit -m "Add tests/init.setup.ts as canonical setup file"
```

---

## Task 3: Add `setup` project + dependencies in `playwright.config.ts`

**Files:**
- Modify: `playwright.config.ts` (full rewrite of `getTestFiles` section + projects array)

After this task, `npx playwright test` will run the new `setup` project before any browser test.

- [ ] **Step 3.1: Add `getSetupFiles()` helper and `setup.spec.ts` exclusion**

Edit `playwright.config.ts`. Replace lines 11–53 (the entire `getTestFiles` definition and the `testFiles` constant) with:

```ts
// Files that should never be matched by the regular browser projects.
// setup.spec.ts is excluded because setup now runs as the 'setup' project
// (see init.setup.ts and the project block below). Defensive guard for any
// stray legacy or user copies as well.
const EXCLUDED_SPEC_FILES = new Set(['setup.spec.ts']);

function getTestFiles(baseDir: string, customDir?: string): string[] {
  const baseFiles = new Set(
      fs.readdirSync(baseDir)
          .filter(file => file.endsWith('.spec.ts'))
          .filter(file => !EXCLUDED_SPEC_FILES.has(file))
          .map(file => path.join(baseDir, file))
  );

  if (!customDir || !fs.existsSync(customDir)) {
    return Array.from(baseFiles);
  }

  const customFiles = fs.readdirSync(customDir)
      .filter(file => file.endsWith('.spec.ts'))
      .filter(file => !EXCLUDED_SPEC_FILES.has(file))
      .map(file => path.join(customDir, file));

  if (customFiles.length === 0) {
    return Array.from(baseFiles);
  }

  const testFiles = new Set<string>();

  // Get base files that have an override in custom
  for (const file of baseFiles) {
    const baseFilePath = path.join(baseDir, path.basename(file));
    const customFilePath = path.join(customDir, path.basename(file));

    testFiles.add(fs.existsSync(customFilePath) ? customFilePath : baseFilePath);
  }

  // Add custom tests that aren't in base
  for (const file of customFiles) {
    if (!baseFiles.has(path.basename(file))) {
      testFiles.add(file);
    }
  }

  return Array.from(testFiles);
}

function getSetupFiles(baseDir: string, customDir?: string): string[] {
  const baseFiles = new Set(
      fs.readdirSync(baseDir)
          .filter(file => file.endsWith('.setup.ts'))
          .map(file => path.join(baseDir, file))
  );

  if (!customDir || !fs.existsSync(customDir)) {
    return Array.from(baseFiles);
  }

  const customFiles = fs.readdirSync(customDir)
      .filter(file => file.endsWith('.setup.ts'))
      .map(file => path.join(customDir, file));

  if (customFiles.length === 0) {
    return Array.from(baseFiles);
  }

  const setupFiles = new Set<string>();

  for (const file of baseFiles) {
    const baseFilePath = path.join(baseDir, path.basename(file));
    const customFilePath = path.join(customDir, path.basename(file));
    setupFiles.add(fs.existsSync(customFilePath) ? customFilePath : baseFilePath);
  }

  for (const file of customFiles) {
    if (!baseFiles.has(path.basename(file))) {
      setupFiles.add(file);
    }
  }

  return Array.from(setupFiles);
}

const testFiles = getTestFiles(
    path.join(__dirname, 'base-tests'),
    path.join(__dirname, 'tests'),
);

const setupFiles = getSetupFiles(
    path.join(__dirname, 'base-tests'),
    path.join(__dirname, 'tests'),
);
```

- [ ] **Step 3.2: Add the `setup` project and wire up dependencies**

In the same file, find the `projects: [...]` array (around line 105 today) and replace its existing chromium/firefox/webkit blocks. The full replacement (preserving the trailing mobile/branded comments) is:

```ts
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: setupFiles,
      use: {
        ...devices['Desktop Chrome'],
        userAgent: 'Playwright',
        trace: 'on',
      },
    },

    {
      name: 'chromium',
      testMatch: testFiles,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        userAgent: 'Playwright'
      },
    },

    {
      name: 'firefox',
      testMatch: testFiles,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        userAgent: 'Playwright'
      },
    },

    {
      name: 'webkit',
      testMatch: testFiles,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Safari'],
        userAgent: 'Playwright'
      },
    },
```

Also delete the now-stale comment line near the top of `projects: [`:

```ts
    // Import our auth.setup.ts file
    //{ name: 'setup', testMatch: /.*\.setup\.ts/ },
```

(That commented-out fragment is replaced by the real `setup` project above.)

- [ ] **Step 3.3: Verify project graph**

```bash
npx playwright test --list 2>&1 | head -30
```

Expected output includes a `[setup]` group listing the three setup tests, plus the regular browser projects without any `setup.spec.ts` rows.

```bash
npx playwright test --list --project=chromium 2>&1 | grep -E "init\.setup|setup\.spec" || echo "no matches"
```

Expected: `no matches` — `init.setup.ts` is matched by `setup`, not by `chromium`, and `setup.spec.ts` is excluded everywhere.

```bash
npx playwright test --list --project=setup 2>&1 | head -10
```

Expected: shows `Disable_login_captcha_and_enable_multiple_login`, `Create_test_accounts`, `Set_coupon_codes`.

- [ ] **Step 3.4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.5: Commit**

```bash
git add playwright.config.ts
git commit -m "Add setup project as dependency of browser projects"
```

---

## Task 4: Mirror config changes in `playwright.config.example.ts`

**Files:**
- Modify: `playwright.config.example.ts`

`playwright.config.example.ts` is the template seeded into new downstream installs by `build.js`. Its content must mirror Task 3's changes so new installs get the new structure. (Existing installs keep their `playwright.config.ts` because `build.js` copies with `COPYFILE_EXCL`; that's covered by the migration notes in Task 8.)

- [ ] **Step 4.1: Replace the helpers block in `playwright.config.example.ts`**

Edit `playwright.config.example.ts`. Replace lines 11–53 (the entire `getTestFiles` definition through the `testFiles` constant) with this block — identical to Task 3's Step 3.1:

```ts
// Files that should never be matched by the regular browser projects.
// setup.spec.ts is excluded because setup now runs as the 'setup' project
// (see init.setup.ts and the project block below). Defensive guard for any
// stray legacy or user copies as well.
const EXCLUDED_SPEC_FILES = new Set(['setup.spec.ts']);

function getTestFiles(baseDir: string, customDir?: string): string[] {
  const baseFiles = new Set(
      fs.readdirSync(baseDir)
          .filter(file => file.endsWith('.spec.ts'))
          .filter(file => !EXCLUDED_SPEC_FILES.has(file))
          .map(file => path.join(baseDir, file))
  );

  if (!customDir || !fs.existsSync(customDir)) {
    return Array.from(baseFiles);
  }

  const customFiles = fs.readdirSync(customDir)
      .filter(file => file.endsWith('.spec.ts'))
      .filter(file => !EXCLUDED_SPEC_FILES.has(file))
      .map(file => path.join(customDir, file));

  if (customFiles.length === 0) {
    return Array.from(baseFiles);
  }

  const testFiles = new Set<string>();

  for (const file of baseFiles) {
    const baseFilePath = path.join(baseDir, path.basename(file));
    const customFilePath = path.join(customDir, path.basename(file));

    testFiles.add(fs.existsSync(customFilePath) ? customFilePath : baseFilePath);
  }

  for (const file of customFiles) {
    if (!baseFiles.has(path.basename(file))) {
      testFiles.add(file);
    }
  }

  return Array.from(testFiles);
}

function getSetupFiles(baseDir: string, customDir?: string): string[] {
  const baseFiles = new Set(
      fs.readdirSync(baseDir)
          .filter(file => file.endsWith('.setup.ts'))
          .map(file => path.join(baseDir, file))
  );

  if (!customDir || !fs.existsSync(customDir)) {
    return Array.from(baseFiles);
  }

  const customFiles = fs.readdirSync(customDir)
      .filter(file => file.endsWith('.setup.ts'))
      .map(file => path.join(customDir, file));

  if (customFiles.length === 0) {
    return Array.from(baseFiles);
  }

  const setupFiles = new Set<string>();

  for (const file of baseFiles) {
    const baseFilePath = path.join(baseDir, path.basename(file));
    const customFilePath = path.join(customDir, path.basename(file));
    setupFiles.add(fs.existsSync(customFilePath) ? customFilePath : baseFilePath);
  }

  for (const file of customFiles) {
    if (!baseFiles.has(path.basename(file))) {
      setupFiles.add(file);
    }
  }

  return Array.from(setupFiles);
}

const testFiles = getTestFiles(
    path.join(__dirname, 'base-tests'),
    path.join(__dirname, 'tests'),
);

const setupFiles = getSetupFiles(
    path.join(__dirname, 'base-tests'),
    path.join(__dirname, 'tests'),
);
```

- [ ] **Step 4.2: Replace the `projects:` array in `playwright.config.example.ts`**

In the same file, find the `projects: [...]` array and replace its existing chromium/firefox/webkit blocks with:

```ts
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: setupFiles,
      use: {
        ...devices['Desktop Chrome'],
        userAgent: 'Playwright',
        trace: 'on',
      },
    },

    {
      name: 'chromium',
      testMatch: testFiles,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        userAgent: 'Playwright'
      },
    },

    {
      name: 'firefox',
      testMatch: testFiles,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        userAgent: 'Playwright'
      },
    },

    {
      name: 'webkit',
      testMatch: testFiles,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Safari'],
        userAgent: 'Playwright'
      },
    },
```

Also delete the stale comment lines just inside the array opening:

```ts
    // Import our auth.setup.ts file
    //{ name: 'setup', testMatch: /.*\.setup\.ts/ },
```

Leave the top-level `use:` defaults (`video: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, `trace: 'retain-on-failure'`) and `timeout: 150_000` untouched — those are the deliberate differences between this template and `playwright.config.ts`.

- [ ] **Step 4.3: Diff the two configs to confirm they only differ where intended**

```bash
diff playwright.config.ts playwright.config.example.ts
```

Expected diff: only the top-level `use:` defaults (`video`, `screenshot`, `trace`) and the `timeout` value differ. No structural differences in the helpers or the `projects` array.

- [ ] **Step 4.4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.5: Commit**

```bash
git add playwright.config.example.ts
git commit -m "Mirror setup-project config changes to playwright.config.example.ts"
```

---

## Task 5: Delete the old `tests/setup.spec.ts`

**Files:**
- Delete: `tests/setup.spec.ts`

After Task 3, `tests/setup.spec.ts` is no longer matched by any project (the `setup` project matches `*.setup.ts`; the browser projects exclude `setup.spec.ts`). Delete it to avoid confusing readers.

- [ ] **Step 5.1: Verify the file is currently unmatched**

```bash
npx playwright test --list 2>&1 | grep -c "setup\.spec"
```

Expected: `0`.

- [ ] **Step 5.2: Delete the file**

```bash
git rm tests/setup.spec.ts
```

- [ ] **Step 5.3: Re-verify the project graph**

```bash
npx playwright test --list 2>&1 | head -30
```

Expected: setup project still lists three tests; browser projects unchanged.

- [ ] **Step 5.4: Commit**

```bash
git commit -m "Remove obsolete tests/setup.spec.ts (superseded by init.setup.ts)"
```

---

## Task 6: Remove `MAGENTO_COUPON_CODE_*` env vars

**Files:**
- Modify: `.env`
- Modify: `.env.example`
- Modify: `install.js`

Coupon codes now come from `inputValues.coupon.codes` (Task 1). The env vars are no longer read anywhere in `tests/` or root config.

- [ ] **Step 6.1: Remove the three coupon lines from `.env`**

Delete lines 17–19 of `.env`:

```
MAGENTO_COUPON_CODE_CHROMIUM=CHROMIUM321
MAGENTO_COUPON_CODE_FIREFOX=FIREFOX321
MAGENTO_COUPON_CODE_WEBKIT=WEBKIT321
```

Also remove the blank line above them if it leaves a stray double-blank.

- [ ] **Step 6.2: Remove the three coupon lines from `.env.example`**

Delete lines 20–22 of `.env.example`:

```
MAGENTO_COUPON_CODE_CHROMIUM=
MAGENTO_COUPON_CODE_FIREFOX=
MAGENTO_COUPON_CODE_WEBKIT=
```

- [ ] **Step 6.3: Remove coupon entries from `install.js`**

In `install.js`, edit the `envVars` object inside the `Install` constructor. Remove these three lines (currently 53–55):

```js
'MAGENTO_COUPON_CODE_CHROMIUM': { default: 'CHROMIUM321' },
'MAGENTO_COUPON_CODE_FIREFOX': { default: 'FIREFOX321' },
'MAGENTO_COUPON_CODE_WEBKIT': { default: 'WEBKIT321' }
```

Make sure the comma on the line before them (`'MAGENTO_EXISTING_ACCOUNT_CHANGED_PASSWORD': { default: 'AanpassenKan@0212' },`) is correct — it should become the last entry (no trailing comma needed, but a trailing comma is also fine in JS).

- [ ] **Step 6.4: Confirm no remaining references**

```bash
grep -rn "MAGENTO_COUPON_CODE" . --include="*.ts" --include="*.js" --include=".env*" --include="*.yml" --exclude-dir=node_modules --exclude-dir=base-tests
```

Expected output: only matches inside `.gitlab-ci.yml` (handled in Task 7) — nothing in `tests/`, root config files, `.env*`, or `install.js`.

- [ ] **Step 6.5: Commit**

```bash
git add .env .env.example install.js
git commit -m "Remove MAGENTO_COUPON_CODE_* env vars (codes live in input-values.json)"
```

---

## Task 7: Collapse the GitLab CI pipeline to a single stage

**Files:**
- Modify: `.gitlab-ci.yml`

- [ ] **Step 7.1: Remove `MAGENTO_COUPON_CODE_*` from `variables:`**

Delete lines 30–32 of `.gitlab-ci.yml`:

```yaml
  MAGENTO_COUPON_CODE_CHROMIUM: "$MAGENTO_COUPON_CODE_CHROMIUM"
  MAGENTO_COUPON_CODE_FIREFOX: "$MAGENTO_COUPON_CODE_FIREFOX"
  MAGENTO_COUPON_CODE_WEBKIT: "$MAGENTO_COUPON_CODE_WEBKIT"
```

- [ ] **Step 7.2: Remove the matching `check_var` lines from the debug template**

In `.gitlab-ci.yml`, inside `.debug-template.before_script`, delete the three lines (currently 91–93):

```bash
      check_var MAGENTO_COUPON_CODE_CHROMIUM
      check_var MAGENTO_COUPON_CODE_FIREFOX
      check_var MAGENTO_COUPON_CODE_WEBKIT
```

- [ ] **Step 7.3: Delete the entire `create_testing_suite` job**

In `.gitlab-ci.yml`, delete the whole `create_testing_suite:` block (currently lines 209–232). This removes the separate setup stage; the dependency is now expressed in `playwright.config.ts`.

- [ ] **Step 7.4: Update `run_testing_suite` to be the single test job**

Replace the entire `run_testing_suite:` block (currently lines 234–252) with:

```yaml
run_testing_suite:
  stage: testing_suite
  extends:
    - .debug-template
  script:
    - echo "Running test suite"
    - printf "elgentos\n" | npm install
    - CI=true npx playwright test --workers=1 --max-failures=1 --trace=retain-on-failure
  allow_failure: false
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
      - .env
```

Key changes vs. the original:
- `--grep-invert "@setup"` removed — there's no `@setup` tag anymore, and setup runs automatically via the project dependency.
- `needs: [create_testing_suite]` and `dependencies: [create_testing_suite]` keys removed — that job no longer exists.

`--workers=1` is preserved as before. The `setup` project's `trace: 'on'` (set in `playwright.config.ts`) ensures the setup tests still produce traces even though the CLI flag is `retain-on-failure`.

- [ ] **Step 7.5: Sanity-check the YAML**

```bash
ruby -e "require 'yaml'; YAML.load_file('.gitlab-ci.yml'); puts 'OK'"
```

Expected: `OK`. (Or use any YAML linter you have available; the goal is to confirm the file still parses.)

- [ ] **Step 7.6: Confirm only `mirror_to_github` and `run_testing_suite` jobs remain**

```bash
grep -E "^[a-z_]+:" .gitlab-ci.yml | grep -v "stages:\|variables:"
```

Expected: `run_testing_suite:`, `mirror_to_github:`, `test_mirror_pipeline:` (and possibly `.debug-template:` / `.slack-notification:` — those are template anchors, fine).

- [ ] **Step 7.7: Commit**

```bash
git add .gitlab-ci.yml
git commit -m "Collapse CI pipeline: setup runs as project dependency"
```

---

## Task 8: Update documentation

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 8.1: Update README — drop the separate-setup section**

In `README.md`, replace the section currently titled `## 🤖 Run setup… then you can run the suite!` (currently around lines 90–104). Replace the entire block (heading + body) with:

```markdown
## 🤖 Running the suite

`npx playwright test` is all you need:

```bash
npx playwright test --trace on
```

The first time you run on a fresh environment, Playwright executes the `setup` project automatically. It disables the admin login CAPTCHA, creates the test accounts, and ensures the coupon codes exist — once, before any browser tests run. Subsequent runs reuse the existing setup; they're idempotent, so re-running `setup` on top of an already-configured environment is safe.

You can run a subset by adding `--project=`, `--grep`, or a filename:

```bash
npx playwright test login.spec.ts
npx playwright test --grep "@hot"
npx playwright test --project=chromium
```

In every case Playwright pulls the `setup` project in automatically as a dependency.
```

In the README's table of contents (currently around line 18), update the entry:

```markdown
- [Running the setup](#-run-setup-then-you-can-run-the-suite)
```

to:

```markdown
- [Running the suite](#-running-the-suite)
```

- [ ] **Step 8.2: README — update the "Skipping specific tests" section**

In `README.md`, the section "Skipping specific tests" (currently around lines 173–180) references `@setup`. Replace the paragraph and example with:

```markdown
### Skipping specific tests

Use `--grep` and `--grep-invert` to run subsets by tag. For example, to skip coupon-related tests:

```bash
npx playwright test --grep-invert @coupon-code
```

Setup tests no longer need to be skipped — they run as a project dependency, not as part of the regular suite. (See "Running the suite" above.)
```

- [ ] **Step 8.3: README — update the scenarios table**

In `README.md`, find the row for `setup.spec.ts` in the scenarios table (currently around line 367). Replace `setup.spec.ts` with `init.setup.ts` and leave the three test names as they are.

- [ ] **Step 8.4: README — add migration note**

After the "Running the suite" section, add a new section:

```markdown
## 🔁 Migrating from 6.x

Version 7.0 moves setup from a tagged spec (`setup.spec.ts`) to a Playwright project dependency (`init.setup.ts`). For existing installs:

1. Open `playwright.config.example.ts` (refreshed by the new package). Copy these into your own `playwright.config.ts`:
   - the `getSetupFiles()` helper
   - the `EXCLUDED_SPEC_FILES` set inside `getTestFiles()`
   - the `setup` project block at the top of `projects:`
   - the `dependencies: ['setup']` line on each browser project
2. Add `coupon.codes` to your `tests/config/input-values.json` (or rely on the defaults from the package's `base-tests/config/input-values.json`).
3. Remove `MAGENTO_COUPON_CODE_CHROMIUM`, `_FIREFOX`, and `_WEBKIT` from your `.env` — they are no longer read.
4. If you had a custom `tests/setup.spec.ts`, port its contents into a new `tests/init.setup.ts`.

After these changes, `npx playwright test` runs setup automatically and you no longer need a separate `--grep "@setup"` invocation.
```

- [ ] **Step 8.5: AGENTS.md — update CI/CD Pipeline section**

In `AGENTS.md`, replace the "CI/CD Pipeline" section (currently lines 175–187) with:

```markdown
## CI/CD Pipeline

A single `testing_suite` stage in `.gitlab-ci.yml` runs `npx playwright test`. Setup (`init.setup.ts`, the `setup` Playwright project) runs automatically as a dependency of the chromium/firefox/webkit projects — no separate setup stage.

Run locally:

```bash
npx playwright test                                   # All tests, with setup auto-run
npx playwright test login.spec.ts                     # Single file (setup still runs)
npx playwright test --grep "@hot"                     # By tag (setup still runs)
npx playwright test --project=setup                   # Run setup only (rarely needed)
```
```

- [ ] **Step 8.6: AGENTS.md — update Critical Rule #7**

In the "Critical Rules for AI Agents" list, the rule currently reads:

```markdown
7. **`setup.spec.ts` must run first** before any other tests. It creates accounts and configures the Magento instance.
```

Replace with:

```markdown
7. **Setup runs as a project dependency.** `init.setup.ts` creates accounts, disables admin CAPTCHA, and sets up coupon codes. It runs automatically before any browser test via `dependencies: ['setup']` in `playwright.config.ts` — never invoke it manually.
```

- [ ] **Step 8.7: CHANGELOG.md — add `## [Unreleased]` block**

At the very top of `CHANGELOG.md` (after the introductory paragraph at line 4), insert:

```markdown
## [Unreleased]

### Changed
- Setup is now a Playwright **project dependency**, not a tagged spec. `npx playwright test` runs `init.setup.ts` (the `setup` project) once automatically before any browser test. The separate `npx playwright test --grep "@setup"` step is no longer required.
- Coupon codes moved from per-browser env vars (`MAGENTO_COUPON_CODE_*`) to a `coupon.codes` map in `input-values.json` (keyed by uppercase browser name). Adding a new browser is now a one-line config change.
- CI pipeline collapsed from two stages (`create_testing_suite` + `run_testing_suite`) to one — Playwright's project dependency handles ordering.

### Removed
- `tests/setup.spec.ts` (replaced by `tests/init.setup.ts`).
- `MAGENTO_COUPON_CODE_CHROMIUM`, `MAGENTO_COUPON_CODE_FIREFOX`, `MAGENTO_COUPON_CODE_WEBKIT` env vars.
- `@setup` tag (no longer needed; setup is gated by project dependency, not by tag filtering).

### Breaking changes
- Existing installs upgrading to this version must update their root `playwright.config.ts` to mirror `playwright.config.example.ts` (new `setup` project + `getSetupFiles()` helper + `dependencies: ['setup']` on browser projects). Without this update, setup will not run and downstream tests will fail. See README → "Migrating from 6.x".
- CI pipelines that filter on `@setup` (e.g. `--grep @setup`, `--grep-invert @setup`) no longer match anything — replace with the appropriate flag-less invocation.
```

- [ ] **Step 8.8: Type-check (sanity)**

```bash
npx tsc --noEmit
```

Expected: no errors. (No TypeScript files changed in this task, but doesn't hurt to confirm.)

- [ ] **Step 8.9: Commit**

```bash
git add README.md AGENTS.md CHANGELOG.md
git commit -m "Update README/AGENTS/CHANGELOG for setup-as-project-dependency"
```

---

## Final Validation

These steps require a working Magento backend. Run them on a fresh test environment to confirm the migration end-to-end. They are not gating commits — the per-task checks above are sufficient for the implementation. Treat this section as a manual smoke test before merging.

- [ ] **V1: One-shot run from a clean state**

On an environment where the admin login CAPTCHA is enabled (i.e., setup has not been run):

```bash
npx playwright test --trace on
```

Expected:
- The `setup` project runs first; `Disable_login_captcha_and_enable_multiple_login`, `Create_test_accounts`, `Set_coupon_codes` all pass.
- Then chromium / firefox / webkit projects run in parallel.
- HTML report shows a `setup` group (3 rows) plus the three browser groups.
- All coupon-related tests in `checkout.spec.ts` and `shoppingcart.spec.ts` pass with codes from `inputValues.coupon.codes`.

- [ ] **V2: Single-spec run pulls in setup**

```bash
npx playwright test --project=chromium login.spec.ts
```

Expected: the `setup` project's three tests run before `login.spec.ts`. (This is Playwright's documented dependency behavior; if it doesn't happen, the `dependencies: ['setup']` wiring is wrong.)

- [ ] **V3: `@setup` tag is gone**

```bash
npx playwright test --grep "@setup" --list
```

Expected: zero tests matched.

- [ ] **V4: CI dry-run**

Push the branch and confirm the GitLab pipeline has a single `run_testing_suite` job that succeeds.

---

## Notes for Reviewers

- All changes deliberately stay out of `base-tests/`. The next npm release republishes `tests/` → `base-tests/`, so the new structure propagates downstream automatically. See the spec for the release-pipeline rationale.
- The serial-mode block inside `init.setup.ts` is intentional and load-bearing on fresh environments. Don't remove it because "project dependencies handle ordering" — that handles ordering *between* projects, not *within* the setup file.
- The `EXCLUDED_SPEC_FILES` set in `getTestFiles()` is a permanent safety net even after the next release deletes `base-tests/setup.spec.ts`. Leave the comment explaining why.
