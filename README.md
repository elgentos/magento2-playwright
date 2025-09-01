# elgentos Magento 2 Playwright BDD E2E Testing Suite

This package contains an end-to-end (E2E) testing suite for Magento 2, powered by [Playwright](https://playwright.dev/). It enables you to quickly set up, run, and extend automated browser tests for your Magento 2 store. Installation is simple via npm, allowing you to seamlessly integrate robust testing into your development workflow.

<mark>⚠️ Please note: if you’re not sure what each test does, **then you should only run this in a testing environment**! Some tests involve the database, and for the suite to run `setup.spec.ts` will disable the CATPCHA of your webshop.</mark>

🏃**Just want to install and get going?**

If you’re simply looking to install, check the [prerequisites](#prerequisites) and then go to [🧪 Installing the suite](#-installing-the-suite).

---

## Table of contents

- [Prerequisites](#Prerequisites)
- [Installing the suite](#-installing-the-suite)
- [Before your run](#-before-you-run)
- [Running the setup](#-run-setup-then-you-can-run-the-suite)
- [How to use the testing suite](#-how-to-use-the-testing-suite)
    - [Running tests](#running-tests)
    - [Skipping specific tests](#skipping-specific-tests)
    - [Tags and Annotations](#tags-and-annotations)
- [Customizing the testing suite](#-customizing-the-testing-suite)
  - [Examples](#examples)
- [How to help](#how-to-help)

---

## Prerequisites

* This testing suite has been designed to work within a Hÿva theme in Magento 2, but can work with other themes.
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

Lastly, simply run the command to install the elgentos Magento2 Playwright package, and the installation script will set things up for you! You will be prompted to input values for the `.env` variables, but these also come with default values.

```bash
npm install @elgentos/magento2-playwright
```

---

## ⏸️ Before you run

After the installation, a variety of folders will have been created. Most notable in these are `base-tests`, which contain the tests without alteration, and `tests`. **You should never make changes directly to the base-tests folder, as thisx may break functionality. However, note that the** `base-tests` **can be updated when you upgrade the package, so always review any changes after an update.**

> If you want to make changes to your iteration of the testing suite such as making changes to how the test works, updating element identifiers etc., see the section ‘Customizing the testing suite’ below.

---

## 🤖 Run setup… then you can run the suite!

Finally, before running the testing suite, you must run `setup.spec.ts`. This must be done as often as your server resets. You can run this using the following command:


```bash
npx playwright test --grep "@setup" --trace on
```

After that - you’re all set! 🥳 You can run the testing suite - feel free to skip the setup at this point:

```bash
npx playwright test --grep-invert "@setup" --trace on
```

---

## 🌐 Generate Translations

The Magento 2 Playwright Testing Suite supports translations, allowing you to run tests in multiple languages. This is particularly useful for international stores with multilingual sites.

### Setting Up Translations

1. **Directory Structure**: Ensure your playwright suite is located in the `app/design/Vendor/theme/web/playwright` directory within your Magento installation. This is crucial for the Playwright suite to locate and utilize the correct files from magento.


2. **(Optional) Create Test Files**: Go to step 3 when this is the NPM installed package. Create the following directories and file:
   - `i18n/app/nl_NL.csv`
   - `i18n/vendor/`

   After creating these, populate `nl_NL.csv` with entries that match texts from `./config/element-identifiers.json`. For instance, you might add `"Password", "Wachtwoord"`. Alternatively, you can copy a translation file from Magento into the `i18n/app` directory. 

3. **Generate translation files**: run following command: `node translate-json.js nl_NL`. `nl_NL` is the language you want to translate to. For example; it will look for nl_NL.csv

3. **Configuration**: Add or Update `MAGENTO_THEME_LOCALE` configuration in your `.env` file to specify which translations to use during testing.

By following these steps, you can seamlessly integrate language support into your testing workflow, ensuring that your Magento 2 store is thoroughly tested across different languages.

### Troubleshooting

When getting the following error:

```
Translating file:  i18n/nl_NL.csv
Error: Invalid Record Length: expect 2, got 1 on line 284
```

Go to line 284 to find what is wrong in your csv file.

---

## 🚀 How to use the testing suite

The Testing Suite offers a variety of tests for your Magento 2 application in Chromium, Firefox, and Webkit.

### Running tests

To run all tests, run the following command:

```bash
npx playwright test --grep-invert "@setup"
```

This command will run all tests located in the `base-tests` directory. If you have custom tests in the `tests` folder, these will be used instead of their `base-tests` counterpart.

You can also run a specific test file:

```bash
npx playwright test example.spec.ts
```

The above commands will run your tests, then offer a report. You can also use [the UI mode](https://playwright.dev/docs/running-tests#debug-tests-in-ui-mode) to see what the tests are doing, which is helpful for debugging. To open up UI mode, run this command:

```bash
npx playwright test --ui
```

Playwright also offers a trace view. While using the UI mode is seen as the default for developing and debugging tests, you may want to run the tests and collect a trace instead. This can be done with the following command:

```bash
npx playwright test --trace on
```

### Skipping specific tests

Certain `spec` files and specific tests are used as a setup. For example, all setup tests (such as creating an account and setting a coupon code in your Magento 2 environment) have the tag ‘@setup’. Since these only have to be used once (or in the case of our demo website every 24 hours), most of the time you can skip these. These means most of the time, using the following command is best. These tests, including `user_can_register_an_account` and all tests in `base-tests/setup.spec.ts` (or any custom setup in `tests/setup.spec.ts`), can be skipped most of the time.

```bash
npx playwright test –-grep-invert @setup
```

### Tags and Annotations

Most tests have been provided with a tag. This allows the user to run specific groups of tests, or skip specific tests. For example, tests that check the functionality of coupon codes are provided with the tag ‘@coupon-code’. To run only these tests, use:

```bash

npx playwright test –-grep @coupon-code
```

You can also run multiple tags with logic operators:

```bash

npx playwright test –-grep ”@coupon-code|@cart”
```

Use `--grep-invert` to run all tests **except** the tests with the specified test. Playwright docs offer more information: [Playwright: Tag Annotations](https://playwright.dev/docs/test-annotations#tag-tests). The following command, for example, skips all tests with the tag ‘@coupon-code’.

```bash

npx playwright test –-grep-invert @coupon-code
```

### Customizing the testing suite

The newly created `tests` folder will become your base of operations. In here, you should use the same folder structure that you see in `base-tests`. For example, if your login page works slightly differently from the demo website version, create a copy of `login.page.ts` and place it `tests/config/poms/frontend/` and make your edits in this file. The next time you run the testing suite, it will automatically use these custom files.

####  Module Imports

To keep the project structure clean and maintainable, we use **TypeScript path aliases** via `tsconfig.json`. This allows you to use the `@` prefix in imports instead of relative paths like `../../../`.

#### Guidelines

**Always use `@` imports** when importing from one of the core module folders, such as:

- `@poms` – Page Object Models
- `@config` – Test configuration and data
- `@utils` – Shared utility functions
- `@steps` – Common step definitions
- `@features` – (Optional) Gherkin feature files

**Correct Usage**

```ts
import { UIReference } from '@config';
import { requireEnv } from '@utils/env.utils';

import HomePage from '@poms/frontend/home.page';
```

**Wrong Usage**

```ts
// ❌ Don't use relative paths
import { UIReference } from '../config';
import { requireEnv } from '../utils/env.utils';

import HomePage from '../poms/frontend/home.page';
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

## Troubleshooting

If an `@` import doesn’t work, make sure your local `tsconfig.json` matches the one provided by the npm package.

---

## How to help

This package, and therefore the testing suite, is part of our open-source initiative to create an extensive library of end-to-end tests for Magento 2 stores. Do you want to help? Check out the [elgentos Magento 2 Playwright repo on Github](https://github.com/elgentos/magento2-playwright).
