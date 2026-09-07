# elgentos Magento 2 Playwright BDD E2E Testing Suite

This package contains an end-to-end (E2E) testing suite for Magento 2, powered by [Playwright](https://playwright.dev/). It enables you to quickly set up, run, and extend automated browser tests for your Magento 2 store. Installation is simple via npm, allowing you to seamlessly integrate robust testing into your development workflow.

<mark>⚠️ Please note: if you’re not sure what each test does, **then you should only run this in a testing environment**! Some tests involve the database, and the suite's `setup` project (`init.setup.ts`) will disable the CAPTCHA of your webshop on first run.</mark>

🏃**Just want to install and get going?**

If you’re simply looking to install, check the [prerequisites](#prerequisites) and then go to [🧪 Installing the suite](#-installing-the-suite).

---

## Table of contents

**Getting started**

- [Prerequisites](#prerequisites)
- [Installing the suite](#-installing-the-suite)
- [Before you run](#-before-you-run)
- [Running tests](#-running-tests)
- [Selecting what runs](#-selecting-what-runs)
- [Migrating from 6.x](#-migrating-from-6x)
- [Generate translations](#-generate-translations)

**Making it yours**

- [Customizing the testing suite](#-customizing-the-testing-suite)
    - [Module imports](#module-imports)
    - [Element identifiers](#element-identifiers)
    - [Slugs](#slugs)
    - [Examples](#examples)
- [Authentication & Fixtures](#-authentication--fixtures)
- [Conventions](#-conventions)
    - [Expose locators through getters](#expose-locators-through-getters)
    - [Only group locators you use together](#only-group-locators-you-use-together)
    - [Assert notifications by role, not by CSS class](#assert-notifications-by-role-not-by-css-class)
    - [Overriding a POM for your store](#overriding-a-pom-for-your-store)

**Reference**

- [Contributing](#contributing)
- [Troubleshooting imports](#troubleshooting-imports)
- [Scenarios](#scenarios)
- [Roadmap](#roadmap)

---

## Prerequisites

* **Node.js 18 or newer** — required by Playwright.
* This testing suite has been designed to work within a Hyvä theme in Magento 2, but can work with other themes.
* **Magento 2 instance:** A running instance of Magento 2 for testing purposes. Elgentos sponsors a [Hyvä demo website](https://hyva-demo.elgentos.io/) for this project.

---

## 🧪 Installing the suite

1. **Create a playwright/ directory inside your theme’s** `/web` **folder**

Navigate to the `web` folder of your theme. This is usually located in `app/design/frontend/{vendor}/{theme}/web`. Within this folder, create a `playwright` folder, then navigate to it:

```bash
cd app/design/frontend/demo-store/demo-theme/web
mkdir playwright
cd playwright
```

2. **Initialize an npm project:**

```bash
npm init -y
```

3. **Install the test suite package**

Lastly, simply run the command to install the elgentos Magento2 Playwright package, and the installation script will set things up for you!

```bash
npm install @elgentos/magento2-playwright
```

4. **Generate .env file and add playwright to .gitignore (optional)**

Normally, you should be prompted to provide values for the .env variables during installation.
Each variable also comes with sensible default values.

<mark>⚠️ Due to limitations in how npm runs dependency install scripts, the install.js script is not executed automatically when this package is installed as a dependency.</mark>

If you want to (re)generate the .env file and configure your environment variables, run the following command manually from your playwright root folder:

```bash
node node_modules/@elgentos/magento2-playwright/install.js
```

After running the command, you will be asked:

- Do you want to customize environment variables? (y/N)
- Do you want to add lines to the .gitignore of your project? (y/N)

---

## ⏸️ Before you run

After the installation, a variety of folders will have been created. Most notable in these are `base-tests`, which contain the tests without alteration, and `tests`. **You should never make changes directly to the base-tests folder, as this may break functionality. However, note that the** `base-tests` **can be updated when you upgrade the package, so always review any changes after an update.**

> If you want to make changes to your iteration of the testing suite such as making changes to how the test works, updating element identifiers etc., see the section ‘Customizing the testing suite’ below.

---

## 🤖 Running tests

The suite runs every test against Chromium, Firefox and WebKit.

`npx playwright test` is all you need:

```bash
npx playwright test
```

This runs every spec in `base-tests`, substituting your own version of a file whenever one exists in `tests` (see [Customizing the testing suite](#-customizing-the-testing-suite)).

Playwright always pulls in the `setup` project first — it is wired as a project dependency, so it runs no matter how you invoke the suite. Setup disables the admin login CAPTCHA, creates the test accounts, and, when the `couponCodes` toggle is enabled, ensures the coupon codes exist before any browser test starts. Every step is idempotent, so re-running against an already-configured environment is safe.

To run a subset, add a filename, `--grep`, or `--project`:

```bash
npx playwright test login.spec.ts
npx playwright test --grep "@hot"
npx playwright test --project=chromium
```

### Debugging a run

[UI mode](https://playwright.dev/docs/running-tests#debug-tests-in-ui-mode) is the default way to develop and debug tests — it shows you what the browser is doing step by step:

```bash
npx playwright test --ui
```

When you would rather run headless and inspect afterwards, collect a trace instead:

```bash
npx playwright test --trace on
```

---

## 🎯 Selecting what runs

There are two mechanisms, and they solve different problems. Use **tags** for a one-off selection on the command line; use **toggles** to permanently switch off a capability your store does not have.

### Tags — one-off selection

Most tests carry a tag, so you can run or skip a group. Coupon code tests, for example, are tagged `@coupon-code`:

```bash
npx playwright test --grep @coupon-code              # only these
npx playwright test --grep "@coupon-code|@cart"      # either tag
npx playwright test --grep-invert @coupon-code       # everything except these
```

See [Playwright: Tag Annotations](https://playwright.dev/docs/test-annotations#tag-tests) for the full syntax.

Setup tests never need to be skipped — they run as a project dependency rather than as part of the regular suite.

### Toggles — permanently disable a capability

Use `tests/config/test-toggles.json` to switch off tests for features your store does not provide. Defaults enable every capability, so coverage is unchanged after upgrading.

Your configuration is deep-merged with the defaults, so list only what differs:

```json
{
	"compare": false,
	"wishlist": false,
	"couponCodes": false
}
```

| Toggle | Tests affected |
|---|---|
| `compare` | Product comparison and comparison-page tests |
| `wishlist` | Product, account-menu, and comparison-page wishlist tests; comparison-page coverage also requires `compare` |
| `couponCodes` | Cart and checkout coupon tests, including coupon setup |
| `newsletter` | Account and footer newsletter tests |
| `reviews` | Product review tests |
| `contactForm` | Contact form test |
| `categoryFilters` | Layered-navigation attribute filter test |
| `fixedRateShipping` | Price calculation and order flows that require fixed-rate shipping |
| `checkMoneyOrder` | Payment and order flows that require check/money-order |
| `visualRegression` | Visual regression tests; regular smoke tests remain enabled |

Only the boolean `false` disables a capability. Disabled tests still appear in Playwright reports as skipped, with a reason, and keep their names and tags — so toggles combine freely with `--grep` and `--grep-invert`.

---

## 🔁 Migrating from 6.x

This major release moved setup from a tagged spec (`setup.spec.ts`) to a Playwright project dependency (`init.setup.ts`). For existing installs:

1. Open `playwright.config.example.ts` (refreshed by the new package). Copy these into your own `playwright.config.ts`:
   - the `getSetupFiles()` helper
   - the `EXCLUDED_SPEC_FILES` set inside `getTestFiles()`
   - the `setup` project block at the top of `projects:`
   - the `dependencies: ['setup']` line on each browser project
2. Add the `@base/*` alias to your existing root `tsconfig.json`, as the **first** entry under `paths`:

   ```json
   "@base/*": [
     "./base-tests/*"
   ],
   ```

   `build.js` never overwrites an existing `tsconfig.json`, so upgrading the package alone does not add this alias for you — it must be added by hand. Without it, any POM override in `tests/poms/` fails to resolve: `tsc` reports `TS2307` and Playwright fails at collection with a module-not-found error.
3. Add a `coupon.codes` block to your `tests/config/input-values.json`, keyed by uppercase browser name (e.g. `"CHROMIUM": "CHROMIUM321"`). One entry per browser project in your `playwright.config.ts`.
4. Remove `MAGENTO_COUPON_CODE_CHROMIUM`, `_FIREFOX`, and `_WEBKIT` from your `.env` — they are no longer read.
5. If you had a custom `tests/setup.spec.ts`, port its contents into a new `tests/init.setup.ts`.
6. Add the `globalSetup` key from `playwright.config.example.ts` to your own `playwright.config.ts`, beside `outputDir`. `build.js` never overwrites an existing `playwright.config.ts`, so upgrading the package alone does not add this for you — it must be added by hand. Without it, the CMP "Reject all" decision is never captured and the consent banner can intercept clicks in every test.

After these changes, `npx playwright test` runs setup automatically and you no longer need a separate `--grep "@setup"` invocation.

---

## 🌐 Generate Translations

The Magento 2 Playwright Testing Suite supports translations, allowing you to run tests in multiple languages. This is particularly useful for international stores with multilingual sites.

### Setting Up Translations

1. **Directory Structure**: Ensure your playwright suite is located in the `app/design/frontend/{vendor}/{theme}/web/playwright` directory within your Magento installation. This is crucial for the Playwright suite to locate and utilize the correct files from magento.


2. **(Optional) Create Test Files**: Go to step 3 when this is the NPM installed package. Create the following directories and file:
   - `i18n/app/nl_NL.csv`
   - `i18n/vendor/`

   After creating these, populate `nl_NL.csv` with entries that match texts from `./config/element-identifiers.json`. For instance, you might add `"Password", "Wachtwoord"`. Alternatively, you can copy a translation file from Magento into the `i18n/app` directory.

3. **Generate translation files**: run following command: `node translate-json.js nl_NL`. `nl_NL` is the language you want to translate to. For example; it will look for nl_NL.csv

By following these steps, you can seamlessly integrate language support into your testing workflow, ensuring that your Magento 2 store is thoroughly tested across different languages.

### Troubleshooting translations

When getting the following error:

```
Translating file:  i18n/app/nl_NL.csv
Error: Invalid Record Length: expect 2, got 1 on line 284
```

Go to line 284 to find what is wrong in your csv file.

---

## ✏️ Customizing the testing suite

The newly created `tests` folder will become your base of operations. In here, you should use the same folder structure that you see in `base-tests`. For example, if your login page works slightly differently from the demo website version, the preferred approach is to **subclass** the packaged POM rather than copy it wholesale: place a `login.page.ts` in `tests/poms/frontend/` that extends the base class through the `@base/*` alias and overrides only the method or getter that differs. See [§ Conventions → Overriding a POM for your store](#overriding-a-pom-for-your-store) for the full pattern. The next time you run the testing suite, it will automatically use these custom files.

Only fall back to a full copy of the packaged file when you need to rewrite a POM entirely — for example, when nearly every method differs. A full copy must still export the same symbol name as the packaged version, and stops receiving any future fixes made to that file in `base-tests/`.

### Module Imports

To keep the project structure clean and maintainable, we use **TypeScript path aliases** via `tsconfig.json`. This allows you to use the `@` prefix in imports instead of relative paths like `../../../`.

#### Guidelines

**Always use `@` imports** when importing from one of the core module folders:

| Alias | Resolves to | Use for |
|---|---|---|
| `@config` | your `tests/config`, else the packaged `base-tests/config` | `UIReference`, `slugs`, `inputValues`, `outcomeMarker`, `toggles` |
| `@poms/*` | your `tests/poms/*`, else `base-tests/poms/*` | Page Object Models |
| `@utils/*` | your `tests/utils/*`, else `base-tests/utils/*` | Shared utility functions |
| `@types/*` | your `tests/types/*`, else `base-tests/types/*` | TypeScript declarations |
| `@base/*` | `base-tests/*` **only** | Reaching the packaged original from a file that overrides it — see [Overriding a POM for your store](#overriding-a-pom-for-your-store) |

`@base/*` is the one alias that never resolves to your own `tests/` folder. That is deliberate: an override needs a way to name the file it is replacing, and `@poms/*` would resolve back to itself.

> `tsconfig.json` also defines `@fixtures/*`, resolving to your `tests/fixtures`, else the packaged `base-tests/fixtures`. It currently holds one file, `storage-state.ts`, which owns every storage-state path the suite uses and the cookie-consent seed reader — see [🔐 Authentication & Fixtures](#-authentication--fixtures).

**Correct Usage**

```ts
import { UIReference } from '@config';
import { requireEnv } from '@utils/env.utils';

import { HomePage } from '@poms/frontend/home.page';
```

**Wrong Usage**

```ts
// ❌ Don't use relative paths
import { UIReference } from '../config';
import { requireEnv } from '../utils/env.utils';

import { HomePage } from '../poms/frontend/home.page';
```

---

### Element identifiers

All element identifiers live in `config/element-identifiers.json` and are consumed through the `UIReference` export (`import { UIReference } from '@config'`). The file is organised along two axes so that identifiers stay easy to find and free of duplicates.

**1. Type — what kind of identifier it is:**

- `selectors` – CSS/DOM selectors (`#id`, `.class`, `[attr]`, …).
- `text` – text that is visible to the user (labels, headings, button captions, messages).

**2. Domain — where it is used, nested under each type:**

- `shared` – reused across the whole suite (e.g. the loading spinner, the header, generic buttons and form labels).
- `admin` – Magento admin panel.
- `frontend` – the storefront.

Within `admin` and `frontend`, identifiers are grouped into `common` (reused across multiple pages of that domain) and a key per `<page>` (`cart`, `checkout`, `product`, `account`, …). Under `text.shared` the elements are grouped further into `buttons`, `forms` and `messages`.

```json
{
  "selectors": {
    "shared":   { "spinner": "#container .spinner" },
    "admin":    { "common": { "adminMenu": ".admin__menu" }, "login": { "username": "#username" } },
    "frontend": { "common": { "region": "#region_id" }, "product": { "price": ".final-price .price-wrapper .price" } }
  },
  "text": {
    "shared":   { "buttons": { "save": "Save" }, "forms": { "email": "Email" } },
    "frontend": { "cart": { "title": "Shopping Cart" } }
  }
}
```

**Naming conventions:**

- Use `camelCase`, meaningful keys that do not repeat their namespace.
- **No type suffix.** The namespace already conveys the type, so drop `Locator`/`Field`/`Class`/`Id` under `selectors` and `Label`/`Text`/`Button` under `text`:
  - `regionLocator` → `selectors.frontend.common.region`
  - `saveButtonLabel` → `text.shared.buttons.save`
- Define a value **once** at the most shared level that applies (`shared` > domain `common` > `<page>`) and reference it from there, so no value is duplicated. Genuinely distinct elements that happen to share a default string (e.g. the "My Account" menu link vs. the account page heading) are kept separate on purpose.

**Usage:**

```ts
import { UIReference } from '@config';

await page.getByRole('button', { name: UIReference.text.shared.buttons.save }).click();
await page.locator(UIReference.selectors.frontend.product.price).isVisible();
```

---

### Slugs

URL slugs live in `config/slugs.json` and are consumed through the `slugs` export (`import { slugs } from '@config'`). The file follows the **same domain grouping** as the element identifiers: a top-level `frontend` / `admin` split, with a key per `<page>` underneath.

Conventions mirror the element identifiers:

- Use `camelCase` keys **without** a `Slug` suffix (`loginSlug` → `login`) and **without** a `Page` suffix on the page key (`categoryPage` → `category`).
- Use `index` for a page's main URL (`cartSlug` → `cart.index`). Every page is an object, even when it holds a single slug, so the depth stays predictable.

```json
{
  "frontend": {
    "product": { "simple": "/push-it-messenger-bag.html" },
    "checkout": { "index": "/checkout/", "success": "/checkout/onepage/success/" }
  },
  "admin": {
    "customers": { "index": "/customer/index/", "edit": "/customer/index/edit/" }
  }
}
```

```ts
import { slugs } from '@config';

await page.goto(slugs.frontend.product.simple);
```

---

### Examples

Below are some example tests to illustrate how to write and structure your tests.

**User registration test:**

```javascript

/**
 * @feature User Registration
 *   @scenario User successfully registers on the website
 *     @given I am on the registration page
 *     @when I fill in the registration form with valid data
 *     @and I submit the form
 *     @then I should see a confirmation message
 */
test('user_can_register_an_account', async ({ page }) => {
  // Implementation details
});
```

**Checkout process test:**

```javascript
/**
 * @feature Product Checkout
 *   @scenario User completes a purchase
 *     @given I have a product in my cart
 *     @when I proceed to checkout
 *     @and I complete the checkout process
 *     @then I should receive an order confirmation
 */
test('User can complete the checkout process', async ({ page }) => {
  // Implementation details
});
```

---

## 🔐 Authentication & Fixtures

`@utils/fixtures.utils` exports two test objects. Every storefront spec should import one of
them — never `@playwright/test` directly — because both fold the cookie-consent decision
captured by `globalSetup` into their storage state, so the consent banner never covers up
whatever the spec is about to click.

| Test object | Storage state | Use for |
|---|---|---|
| `test` | Per-worker authenticated session, plus the consent cookies | Specs that need a logged-in customer |
| `guestTest` | Consent cookies only, no login | Specs that run as a visitor |

```ts
// Needs a logged-in customer:
import { test, expect } from '@utils/fixtures.utils';

// Runs as a visitor:
import { guestTest as test, expect } from '@utils/fixtures.utils';

// A file with both: import both, and use guestTest.describe(...) for the guest group.
import { test, guestTest, expect } from '@utils/fixtures.utils';
```

**Never** drop authentication with `test.use({ storageState: { cookies: [], origins: [] } })`.
Besides logging the visitor out, it discards the consent cookies too — `test.use` values are
evaluated during Playwright's collection phase, which runs *before* `globalSetup` has written
the consent seed, so there is no way for a plain `test.use` override to include it. `guestTest`
exists for exactly this reason: its storage state is built inside a fixture, which runs after
collection, once the seed is on disk.

### `test`: per-worker authentication

- Logs in as a pre-provisioned account chosen by worker index
  (`playwright+{parallelIndex}@elgentos.nl`, created by `init.setup.ts`).
- Stores auth state at `.auth/{projectName}/worker_{parallelIndex}.json`, so chromium,
  firefox and webkit each keep their own state *file*. They do still share the same Magento
  *account* at a given worker index — that's safe because no spec mutates the shared login;
  `account.spec.ts` provisions its own throwaway account whenever it needs to change
  credentials.
- Logs in once per worker, validates the cached session — and that it still carries the
  consent cookies — before reusing the file, and rebuilds it otherwise.
- Re-authenticates inline mid-run via an `_authGuard` auto-fixture if a session dies between
  fixture setup and the test that uses it.

### `guestTest`: consent only

`guestTest`'s storage state carries the consent cookies and nothing else, with no dependency
on the login fixture, so requesting it never triggers a login. Reach for it in any spec, or
`describe` block, that should run as an anonymous visitor.

### The `.auth/` layout

| Path | Contents |
|---|---|
| `.auth/consentCookies.json` | The consent-cookie seed captured once by `globalSetup` |
| `.auth/{projectName}/worker_{parallelIndex}.json` | One authenticated storage state per (browser project, worker) |

`.auth/` lives outside `test-results/`, which Playwright clears at the start of every run, so
cached logins survive between runs. `@fixtures/storage-state` is the single owner of both
paths: `global-setup.ts` and `fixtures.utils.ts` both import them from there, so overriding
only one of those two files in your `tests/` can never leave a writer and a reader pointing at
different directories.

### Cookie-consent management (CMP) hosts

`global-setup.ts` matches the consent banner by text — `UIReference.text.frontend.common.cookieConsentTitle`
and `UIReference.text.shared.buttons.cookieReject`, which default to consentmanager.net's English
labels ("Consent to Cookies & Data" and "Reject all"). If your store runs a different CMP (Cookiebot,
Cookiefirst, …) or the same CMP in another language, override both strings in your own
`tests/config/element-identifiers.json` to match your banner's heading and reject-button labels.

If the banner is not present at all — a local Magento install or a review env with the CMP script
blocked — `globalSetup` detects this within ~5s, logs it informatively, and continues immediately
with an empty seed; tests run without a consent decision, which is correct because there is no banner
to intercept their clicks either.

If a banner IS present but the label strings do not match it, `globalSetup` retries for up to 30s
before logging a warning and running the suite with no consent decision — this is the first thing to
change when adopting this pattern on a different store.

Note also that the seed carries **cookies only**. A CMP that persists its decision in `localStorage`
instead of (or in addition to) cookies will not be captured, which makes this feature a no-op for
that store — check where your CMP stores its decision before relying on this.

If your store's CMP renders an overlay that can cover the login form, set
`COOKIE_CONSENT_CMP_HOST` in `.env` to its host (e.g. `consentmanager.net`). When set, the
`test` object aborts requests to that host in the throwaway browser context it uses to log in,
so the banner can never render there in the first place. It's unset by default and has no
effect on existing installs that don't set it.

### ESLint: register `guestTest` as a test alias

`eslint-plugin-playwright` only recognizes a test object literally named `test`. If your
project lints its `tests/` directory with `playwright.configs['flat/recommended']`, add this
setting to the same config block, or every `expect()` inside a `guestTest.describe(...)` group
is reported as `playwright/no-standalone-expect`:

```js
settings: { playwright: { globalAliases: { test: ['guestTest'] } } },
```

---

## 🧭 Conventions

Guidelines for writing consistent, maintainable Page Object Models (POMs).

### Expose locators through getters

Define locators as `get` accessors rather than assigning them in the constructor. Getters keep the constructor free of setup bloat and build each locator lazily — only when a test actually uses it — while callers still access them exactly like a property (`accountPage.genericSaveButton`).

**Correct Usage**

```ts
export class AccountPage {
  constructor(public readonly page: Page) {}

  get genericSaveButton(): Locator {
    return this.page.getByRole('button', { name: UIReference.text.shared.buttons.save });
  }
}
```

**Wrong Usage**

```ts
// ❌ Don't build locators eagerly in the constructor
export class AccountPage {
  readonly genericSaveButton: Locator;

  constructor(public readonly page: Page) {
    this.genericSaveButton = page.getByRole('button', { name: UIReference.text.shared.buttons.save });
  }
}
```

### Only group locators you use together

A getter may return an object of related locators, but **only group them when they're likely to be used together** — typically the fields of a single form that a method fills as a set. Grouping expresses a real relationship; bundling unrelated elements creates false cohesion and forces every locator in the group to be rebuilt each time any one of them is accessed.

Standalone elements (page landmarks, a shared save button, individual action buttons) should each have their own getter.

```ts
// ✅ Cohesive: these fields are filled together as one form
get accountAddressFields() {
  return {
    companyNameField: this.page.getByRole('textbox', { name: UIReference.text.shared.forms.company }),
    phoneNumberField: this.page.getByLabel(UIReference.text.shared.forms.phone),
    streetAddressField: this.page.getByLabel(UIReference.text.shared.forms.streetAddress, { exact: true }),
    // …
  };
}

// ✅ Standalone: no shared form, so keep it individual
get genericSaveButton(): Locator {
  return this.page.getByRole('button', { name: UIReference.text.shared.buttons.save });
}
```

```ts
// ❌ Don't bundle unrelated locators just to reduce the number of getters
get accountElements() {
  return {
    dashboardTitle: this.page.getByRole('heading', { name: UIReference.text.frontend.account.dashboardTitle }),
    saveButton: this.page.getByRole('button', { name: UIReference.text.shared.buttons.save }),
    deleteAddressButton: this.page.getByRole('link', { name: UIReference.text.frontend.account.deleteAddress }).first(),
  };
}
```

When you do use a grouped getter repeatedly within a method, destructure it once so the group is materialised a single time:

```ts
const { companyNameField, phoneNumberField, streetAddressField } = this.accountAddressFields;
await companyNameField.fill(company);
await phoneNumberField.fill(phone);
await streetAddressField.fill(street);
```

### Assert notifications by role, not by CSS class

Magento notification messages expose `role="alert"`, so target them with `getByRole('alert')` instead of a class selector like `.message.success`. Role locators survive Hyvä's Tailwind class changes and don't need a `UIReference.selectors` entry.

Message text is usually split across child nodes — Magento renders the product name and a link inside the sentence ("You added product X to the *comparison list*.") — so assert with `toContainText`, which normalizes whitespace and matches across those nodes.

```ts
// ✅ Role-based, matches across the link inside the message
await expect(this.page.getByRole('alert'),
  `${product} has been added to comparison`).toContainText(
  `${outcomeMarker.comparePage.productAddedNotificationTextOne} ${product}`);
```

```ts
// ❌ Class selector, and hasText can't span the message's child nodes reliably
await expect(this.page.locator('.message.success').filter(
  { hasText: `${outcomeMarker.productPage.simpleProductAddedNotification} ${product}` })).toBeVisible();
```

**Caveat: `getByRole('alert')` is strict.** If a page ever shows two messages at once, the locator resolves to multiple elements and the assertion throws a strict-mode violation instead of passing. When that happens, filter down to the one you mean rather than reaching for `.first()`:

```ts
await expect(this.page.getByRole('alert').filter(
  { hasText: `${outcomeMarker.comparePage.productAddedNotificationTextOne} ${product}` }),
  `${product} has been added to comparison`).toBeVisible();
```

Also give each notification its own marker in `outcome-markers.json`. Reusing a marker from a different flow looks like deduplication but breaks silently: the cart message reads "You added &lt;product&gt;" while the comparison message reads "You added **product** &lt;product&gt; to the comparison list.", so a shared marker matches neither everywhere.

### Overriding a POM for your store

Sometimes you only need to change one method of a packaged POM — not the whole
file. Rather than copying `login.page.ts` into your own `tests/` and
maintaining a full duplicate, subclass it and override just the part that
differs.

A file you place in `tests/poms/` completely replaces the packaged
`base-tests/` file of the same name, so it must export the same symbol name.
Reach the packaged version through the `@base/*` alias, which always points at
the original file regardless of your override — importing from `@poms/*`
instead would resolve back to your own file:

```ts
// tests/poms/frontend/login.page.ts
import { LoginPage as BaseLoginPage } from '@base/poms/frontend/login.page';

export class LoginPage extends BaseLoginPage {
  // only what differs for this store
  async login(email: string, password: string) {
    // custom implementation
  }
}
```

`npm run verify:seam` checks the suite's own override *mechanism* against a
throwaway fixture — it does not read your `tests/` folder or your
`tsconfig.json`, so it cannot confirm that *your* override resolves. For that,
run `npx tsc --noEmit` and `npx playwright test --list` in your own project and
confirm your override's file shows up where you expect.

---

## Contributing

This package, and therefore the testing suite, is part of our open-source initiative to create an extensive library of end-to-end tests for Magento 2 stores. Do you want to help? Check out the [elgentos Magento 2 Playwright repo on Github](https://github.com/elgentos/magento2-playwright).

When working on the suite itself, these scripts are available:

| Command | Purpose |
|---|---|
| `npm run lint` | ESLint over the whole project |
| `npm run typecheck` | `tsc --noEmit`; run `node build.js` first so `base-tests/` is current |
| `npm run format` | Prettier write; `npm run format:check` to verify only |
| `npm run verify:seam` | Verifies the POM override mechanism (see below) |

`npm run verify:seam` builds a throwaway consumer-shaped fixture in a temp dir and checks that a `tests/` file shadows its `base-tests/` counterpart, can extend it through `@base/*`, and is picked up when another POM composes it. **It is not part of CI** — run it locally before merging any change to a `paths` entry, a POM's class name or export style, a member's visibility, or the Playwright version.

That last trigger matters most: the override mechanism relies on Playwright resolving `paths` arrays last-match-wins, which is undocumented upstream, and this check is the only thing that would catch a change to it.

---

## Troubleshooting imports

If an `@` import doesn’t work, make sure your local `tsconfig.json` matches the one provided by the npm package (`tsconfig.example.json`).

**Upgrading from 6.x and a POM override won't resolve?** Check for the `@base/*` alias first. `build.js` never overwrites an existing `tsconfig.json`, so upgrading the package does not add it — it has to be added by hand. Without it, `tsc` reports `TS2307: Cannot find module '@base/…'` and Playwright fails at collection with a module-not-found error. See [Migrating from 6.x](#-migrating-from-6x), step 2.

---

## Scenarios

<details>
<summary>Every test currently in the suite (click to expand)</summary>

Up-to-date as of the `7.0.0` CHANGELOG entry.

| Spec file            | Group                              | Test                                                                              |
|----------------------|------------------------------------|-----------------------------------------------------------------------------------|
| account.spec.ts      | Account information actions        | :heavy_check_mark: Change_password                                                |
|                      |                                    | :heavy_check_mark:️ Update_my_e-mail_address                                      |
|                      | Account address book actions       | :heavy_check_mark: Add_an_address                                                 |
|                      |                                    | :heavy_check_mark: Edit_existing_address                                          |
|                      |                                    | :heavy_check_mark: Missing_required_field_prevents_creation                       |
|                      |                                    | :heavy_check_mark: Delete_an_address                                              |
|                      | Newsletter actions                 | :heavy_check_mark: Update_newsletter_subscription                                 |
| category.spec.ts     |                                    | :heavy_check_mark: Filter_category_on_size                                        |
|                      |                                    | :heavy_check_mark: Sort_category_by_price                                         |
|                      |                                    | :heavy_check_mark: Change_amount_of_products_shown                                |
|                      |                                    | :heavy_check_mark: Switch_from_grid_to_list_view                                  |
| footer.spec.ts       | Footer                             | :heavy_check_mark: Footer_is_available                                            |
|                      |                                    | :heavy_check_mark: Footer_switch_currency                                         |
|                      |                                    | :heavy_check_mark: Footer_newsletter_subscription                                 |
| mainmenu.spec.ts     | Guest tests (not logged in)        | :heavy_check_mark: User_navigates_to_login                                        |
|                      |                                    | :heavy_check_mark: User_navigates_to_create_account                               |
|                      |                                    | :heavy_check_mark: Navigate_to_category_page                                      |
|                      |                                    | :heavy_check_mark: Navigate_to_subcategory_page                                   |
|                      |                                    | :heavy_check_mark: Open_the_minicart                                              |
|                      |                                    | :heavy_check_mark: User_searches_for_product                                      |
|                      | User tests (logged in)             | :heavy_check_mark: User_logs_out                                                  |
|                      |                                    | :heavy_check_mark: Navigate_to_account_page                                       |
|                      |                                    | :heavy_check_mark: Navigate_to_wishlist                                           |
|                      |                                    | :heavy_check_mark: Navigate_to_orders                                             |
|                      |                                    | :heavy_check_mark: Navigate_to_address_book                                       |
| healthcheck.spec.ts  | Page health checks                 | :heavy_check_mark: Homepage_returns_200                                           |
|                      |                                    | :heavy_check_mark: Plp_returns_200                                                |
|                      |                                    | :heavy_check_mark: Pdp_returns_200                                                |
|                      |                                    | :heavy_check_mark: Checkout_returns_200                                           |
|                      | Visual regression                  | :heavy_check_mark: homepage_matches_visual_baseline                               |
|                      |                                    | :heavy_check_mark: plp_matches_visual_baseline                                    |
|                      |                                    | :heavy_check_mark: pdp_matches_visual_baseline                                    |
|                      |                                    | :heavy_check_mark: cart_matches_visual_baseline                                   |
| login.spec.ts        |                                    | :heavy_check_mark: User_logs_in_with_valid_credentials                            |
|                      |                                    | :heavy_check_mark: Invalid_credentials_are_rejected                               |
|                      |                                    | :heavy_check_mark: Login_fails_with_missing_password                              |
| home.spec.ts         |                                    | :heavy_check_mark: Add_product_on_homepage_to_cart                                |
| checkout.spec.ts     | Checkout (login required)          | :heavy_check_mark: Address_is_pre_filled_in_checkout                              |
|                      |                                    | :heavy_check_mark: Place_order_for_simple_product                                 |
|                      | Checkout (guest)                   | :heavy_check_mark: Add_coupon_code_in_checkout                                    |
|                      |                                    | :heavy_check_mark: Verify_price_calculations_in_checkout                          |
|                      |                                    | :heavy_check_mark: Remove_coupon_code_from_checkout                               |
|                      |                                    | :heavy_check_mark: Invalid_coupon_code_in_checkout_is_rejected                    |
|                      |                                    | :heavy_check_mark: Guest_can_select_payment_methods                               |
| minicart.spec.ts     | Minicart (simple products)         | :heavy_check_mark: Add_product_to_minicart_and_go_to_checkout                     |
|                      |                                    | :heavy_check_mark: Add_product_to_minicart_and_go_to_cart                         |
|                      |                                    | :heavy_check_mark: Change_product_quantity_in_minicart                            |
|                      |                                    | :heavy_check_mark: Delete_product_from_minicart                                   |
|                      |                                    | :heavy_check_mark: Pdp_price_matches_minicart_price                               |
|                      | Minicart (configurable products)   | :heavy_check_mark: Configurable_pdp_price_matches_minicart_price                  |
| orderhistory.spec.ts | Order history tests                | :heavy_check_mark: Recent_order_is_visible_in_history                             |
| compare.spec.ts      |                                    | :heavy_check_mark: Add_product_to_cart_from_comparison_page                       |
|                      |                                    | :heavy_check_mark: Guests_can_not_add_a_product_to_their_wishlist                 |
|                      |                                    | :heavy_check_mark: Add_product_to_wishlist_from_comparison_page                   |
| contact.spec.ts      |                                    | :heavy_check_mark: Send_message_through_contact_form                              |
| shoppingcart.spec.ts | Cart functionalities (guest)       | :heavy_check_mark: Add_product_to_cart                                            |
|                      |                                    | :heavy_check_mark: Product_remains_in_cart_after_login                            |
|                      |                                    | :heavy_check_mark: Remove_product_from_cart                                       |
|                      |                                    | :heavy_check_mark: Change_product_quantity_in_cart                                |
|                      |                                    | :heavy_check_mark: Add_coupon_code_in_cart                                        |
|                      |                                    | :heavy_check_mark: Remove_coupon_code_from_cart                                   |
|                      |                                    | :heavy_check_mark: Invalid_coupon_code_is_rejected                                |
|                      | Price checking tests               | :heavy_check_mark: Simple_product_cart_data_consistent_from_PDP_to_checkout       |
|                      |                                    | :heavy_check_mark: Configurable_product_cart_data_consistent_from_PDP_to_checkout |
| register.spec.ts     |                                    | :heavy_check_mark: User_registers_an_account                                      |
| product.spec.ts      | Product page tests                 | :heavy_check_mark: Add_product_to_compare                                         |
|                      |                                    | :warning: Add_product_to_wishlist (fixme: causes regular timeouts)                |
|                      |                                    | :warning: Leave a product review (Test currently fails due to error on website)   |
|                      |                                    | :heavy_check_mark: Open_pictures_in_lightbox_and_scroll                           |
|                      |                                    | :heavy_check_mark: Change_number_of_reviews_shown_on_product_page                 |
| search.spec.ts       | Search functionality               | :heavy_check_mark: Search_query_returns_multiple_results                          |
|                      |                                    | :heavy_check_mark: User_can_find_a_specific_product_and_navigate_to_its_page      |
|                      |                                    | :heavy_check_mark: No_results_message_is_shown_for_unknown_query                  |
| accessibility.spec.ts | Accessibility Tests: EEA compliance | :heavy_check_mark: homepage_passes_wcag2a_scan                                   |
|                      |                                    | :heavy_check_mark: plppage_passes_wcag2a_scan                                     |
|                      |                                    | :heavy_check_mark: pdppage_passes_wcag2a_scan                                     |
|                      |                                    | :heavy_check_mark: cartpage_passes_wcag2a_scan                                    |
| init.setup.ts        | Setting up the testing environment | :heavy_check_mark: Disable_login_captcha_and_enable_multiple_login                |
|                      |                                    | :heavy_check_mark: Set_coupon_codes                                               |
|                      |                                    | :heavy_check_mark: Create_test_accounts                                           |

</details>

---

## Roadmap

<details>
<summary>Planned tests, indicative priorities (click to expand)</summary>
The list below shows tests that will be written in the future. The list is subject to change and priorities/names are merely indicative.

| Spec file            | Group                 | Test                                                        | Priority |
|----------------------|-----------------------|-------------------------------------------------------------|----------|
| account.spec.ts      | Account overview      | Account_overview_shows_customer_name                        | Low      |
|                      |                       | Customer_can_change_their_name                              | Medium   |
|                      | Password              | User_can_reset_password                                     | High     |
|                      | Other                 | All_account_subpage_show_correct_titles                     | Low      |
| orderhistory.spec.ts | Order history         | Empty_order_history_can_be_viewed                           | Medium   |
| wishlist.spec.ts     | Wishlist Item Actions | Remove_product_from_wishlist                                | High     |
|                      |                       | Update_quantity_of_item_in_wishlist                         | Medium   |
|                      |                       | Add_comment_to_item_in_wishlist                             | Medium   |
|                      |                       | User_can_share_wishlist                                     | Low      |
|                      |                       | Add_all_wishlist_item_to_cart                               | High     |
| shoppingcart.spec.ts | Guest to user         | Carts_are_merged_from_guest_to_user                         | Medium   |
| checkout.spec.ts     |                       | Login_from_checkout_keeps_cart                              | Medium   |
|                      |                       | All_payment_methods_work                                    | Medium   |
|                      |                       | All_shipping_methods_work                                   | Medium   |
|                      |                       | User_receives_confirmation_mail_after_order                 | High     |
|                      |                       | User_receives_invoice_after_order                           | Medium   |
| category.spec.ts     | General               | Breadcrumbs_are_displayed_correctly                         | Low      |
|                      |                       | Pagination_works_correctly                                  | Low      |
| home.spec.ts         | General               | Navigate_to_home                                            | Low      |
|                      |                       | Cookiebanner_is_shown_if_no_cookies                         | Medium   |
|                      |                       | Cookies_can_be_accepted_if_cookiebanner                     | Medium   |
| backend.spec.ts      | Orders                | Placed_orders_show_up_in_backend                            | Medium   |
|                      |                       | Order_can_be_edited                                         | Medium   |
|                      |                       | Order_status_can_be_updated                                 | Medium   |
| product.spec.ts      | General               | Product_page_shows_title_and_image                          | Low      |
|                      |                       | Product_page_shows_price                                    | Low      |
|                      |                       | Breadcrumbs_are_displayed_correctly                         | Low      |
|                      |                       | User_can_see_reviews                                        | Low      |
|                      |                       | Place_review                                                | High     |
|                      |                       | Product_page_indicates_in_stock_status                      | High     |
|                      |                       | Product_cannot_be_added_to_cart_if_not_in_stock             | High     |
|                      | Configurable product  | Non_configured_products_cant_be_added_to_cart               | Low      |
|                      | Bundled product       | Product_name_is_rendered                                    | Low      |
|                      |                       | Price_goes_to_zero_when_all_associated_products_qty_is_zero | Low      |
|                      |                       | Price_is_correct_sum_of_parts                               | Low      |
|                      |                       | Qty_of_products_in_bundle_are_shown                         | Low      |
|                      |                       | Add_bundled_product_to_cart                                 | Low      |
| product.spec.ts      | Simple product        | Simple_tests_will_be_added_later                            | Low      |
| product.spec.ts      | Configurable product  | Configurable_tests_will_be_added_later                      | Low      |
| cmspages.spec.ts     | General               | Default_404_is_shown_on_nonexistent_url                     | Medium   |
| contact.spec.ts      | General               | Form_cannot_be_submitted_with_missing_field                 | Medium   |
| contact.spec.ts      | General               | Form_cannot_be_submitted_with_incorrect_emailaddress_format | Medium   |

</details>
