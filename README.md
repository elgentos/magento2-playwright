# Magento 2 Playwright BDD E2E testing suite
A Playwright End-To-End (E2E) testing suite for Magento 2 that helps you find (potential) issues on your webshop.

Or with more jargon: a Behavior Driven Development (BDD) End-To-End (E2E) testing suite for Magento 2 using Gherkin syntax in JSDoc and Playwright.

## Table of Contents

- [Introduction](#introduction)
- [Why BDD and Gherkin in JSDoc for Magento 2](#why-bdd-and-gherkin-in-jsdoc-for-magento-2)
- [Features](#features)
- [Getting Started](#getting-started)
	- [Prerequisites](#prerequisites)
	- [Installation](#installation)
	- [Before you run](#before-you-run)
- [How to use](#how-to-use)
	- [Running tests](#running-tests)
	- [Skipping specific tests](#skipping-specific-tests)
	- [Tags and Annotations](#tags-and-annotations)
- [Examples](#examples)
- [Contributing](#contributing)
	- [Writing tests](#writing-tests)
- [License](#license)
- [Contact](#contact)
- [Known issues](#known-issues)

## Introduction
Welcome to the Magento 2 BDD E2E Testing Suite! This project, referred to as “Testing Suite” from here on out, is an open-source initiative aimed at supporting developers in (end-to-end) testing their Magento 2 applications.

By combining the power of Behavior Driven Development (BDD) with the flexibility of Playwright and the clarity of Gherkin syntax embedded in JSDoc comments, we aim to make testing more accessible, readable, and maintainable for both developers and non-technical stakeholders.

<mark> Please note: this Testing Suite should only be run in a testing environment. </mark>

## Why BDD and Gherkin in JSDoc for Magento 2
Testing in Magento 2 can be complex due to its extensive functionality and customizable nature. Traditional testing methods often result in tests that are hard to read and maintain, especially as the application grows.

**Behavior Driven Development (BDD)** focuses on the behavior of the application from the user's perspective. It encourages collaboration between developers, QA engineers, and business stakeholders by using a shared language to describe application behavior.

[Gherkin syntax](https://cucumber.io/docs/gherkin/reference/) is a domain-specific language that uses natural language constructs to describe software behaviors. By embedding Gherkin steps directly into JSDoc comments, we achieve several benefits:

- **Readability**: tests become self-documenting and easier to understand.
- **Maintainability**: changes in requirements can be quickly reflected in the test descriptions.
- **Collaboration**: non-technical team members can read and even help write test cases.
- **Integration**: embedding in JSDoc keeps the test descriptions close to the implementation, reducing context switching.

[Playwright](https://playwright.dev/) is a powerful automation library that supports all modern browsers. It offers fast and reliable cross-browser testing, which is essential for ensuring Magento 2 applications work seamlessly across different environments.

By integrating these technologies, this testing suite provides a robust framework that simplifies the process of writing, running, and maintaining end-to-end tests for Magento 2.

## Features
- **Gherkin Syntax in JSDoc**: write human-readable test steps directly in your code comments.
- **Playwright integration**: utilize Playwright's powerful automation capabilities for testing across different browsers.
- **Magento 2 specific utilities**: predefined steps and helpers tailored for Magento 2's unique features.
- **Collaborative testing**: enable collaboration between technical and non-technical team members.
- **Extensible architecture**: easily extend and customize to fit your project's needs.


## Getting Started
Please note that this Testing Suite is currently in alpha testing. If you are having problems setting up the Testing Suite for your website, feel free to open a ticket in Github.

### Prerequisites
- **Node.js**: Ensure you have Node.js installed (version 14 or higher).
- **Magento 2 instance**: A running instance of Magento 2 for testing purposes. Elgentos sponsors a [Hyvä demo website](https://hyva-demo.elgentos.io/) for this project.
- **Git**: Version control system to clone the repository.



### 🧪 Installation

1. **Create a `playwright/` directory inside your theme’s `/web` folder**

   Navigate to your custom theme folder (e.g. `app/design/frontend/Vendor/Theme/web`) and create a `playwright/` directory:

   ```bash
   cd app/design/frontend/Vendor/Theme/web
   mkdir -p playwright
   cd playwright
   ```

2. **Initialize an npm project**

   If your `playwright/` directory doesn't yet have a `package.json`:

   ```bash
   npm init -y
   ```

3. **Install the test suite package**

   ```bash
   npm install @elgentos/magento2-playwright
   ```

4. **Copy configuration templates**

   After installation, copy the example config files from the package to your project root:

   ```bash
   cp node_modules/@elgentos/magento2-playwright/.env.example .env
   cp node_modules/@elgentos/magento2-playwright/playwright.config.example.ts playwright.config.ts
   cp node_modules/@elgentos/magento2-playwright/bypass-captcha.config.example.ts bypass-captcha.config.ts
   ```

   > ℹ️ The `.env` file still needs to be filled in with your actual environment settings (Magento base URL, credentials, etc).

5. **Install Playwright browsers**

   Run the following command once to install the necessary browser binaries:

   ```bash
   npx playwright install --with-deps
   ```

6. **Customize the configuration**

   Update the files in the `config/` folder to match your specific webshop setup:
    - Page slugs
    - DOM selectors
    - Expected static texts
    - Test-specific variables

7. **Add default scripts to package.json**

    ```json
    "scripts": {
       "build": "playwright install",
       "test": "playwright test",
       "ui": "npx playwright test --ui",
       "translate": "node node_modules/@elgentos/magento2-playwright/translate-json.js nl_NL"
    }
   ```

8. **Update .gitignore from magento project**

    add following to .gitignore file:

    ```bash
    # playwright
    /app/design/frontend/Hyva/demo/web/playwright/*
    !/app/design/frontend/Hyva/demo/web/playwright/tests/*
    !/app/design/frontend/Hyva/demo/web/playwright/package.json
    !/app/design/frontend/Hyva/demo/web/playwright/package-lock.json
    ```

   > ℹ If you want more files comitted to git then just add it to the list above (like: `.env` with credentials.);


### Before you run
Before you run our Testing Suite, you will need to perform a few steps to set-up your environment. Note that we are working on an update to automate these steps. Check out the [Contributing](#contributing) section if you want to help!

1. Create an account (and set up environment)

	The testing suite contains a test to ensure account creation is possible. Once again, due to the nature of running tests, it’s necessary to create an account before the other tests can be run. You can choose to run `register.spec.ts` to create an account or do it by hand, then update your `.env` variable to ensure tests can use an existing account. You can also run the following command, which will run `register.spec.ts` as well as `setup.spec.ts`:

	```bash
	npx playwright test --grep @setup
    ```
2. Create a coupon code in your Magento 2 environment and/or set an existing coupon code in the `.env` file.

	The Testing Suite offers multiple tests to ensure the proper functionality of coupon codes. To do this, you will need to either set an existing coupon code in your `.env` file, or create one and add it.

3. Note that the test “I can change my password” is set to `skip`.

	This is because updating your password in the middle of running tests will invalidate any subsequent test that requires a password. To test this functionality, change the line from `test.skip('I can change my password')` to `test.only('I can change my password')`. This will ensure *only* this test will be performed. Don’t forget to set it back to `test.skip()` after ensuring this functionality works. This issue is known and will be fixed in the future.


## How to use
The Testing Suite offers a variety of tests for your Magento 2 application in Chromium, Firefox, and Webkit.

### Running tests
To run ALL tests, run the following command.
**Note that this will currently not work. Please add `–-grep-invert @setup` to the command below to skip certain tests.** You can learn more about this in the following section.

```bash
npx playwright test
```

This command will run all tests located in the `tests` directory.

You can also run a specific test file:

```bash
npx playwright test tests/example.test.js
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
Certain `spec` files and specific tests are used as a setup. For example, all setup tests (such as creating an account and setting a coupon code in your Magento 2 environment) have the tag ‘@setup’. Since these only have to be used once (or in the case of our demo website every 24 hours), most of the time you can skip these. These means most of the time, using the following command is best. This command skips both the `user can register an account` test, as well as the whole of `base/setup.spec.ts`.

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


## Examples

Below are some example tests to illustrate how to write and structure your tests.

### User registration test

```javascript
/**
 * @feature User Registration
 *   @scenario User successfully registers on the website
 *     @given I am on the registration page
 *     @when I fill in the registration form with valid data
 *     @and I submit the form
 *     @then I should see a confirmation message
 */
test('User can register an account', async ({ page }) => {
  // Implementation details
});
```

### Checkout process test

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

## Contributing

We welcome contributions to enhance this project! Here's how you can get involved:

1. **Clone this repository**

   ```bash
   git clone https://github.com/elgentos/magento2-playwright
   ```

2. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**

4. **Commit your changes**

   ```bash
   git commit -m 'Add a new feature'
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a pull request**: Go to the original repository and open a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions, suggestions, or feedback, please open an issue on GitHub.

## Known issues
Running Playwright/the Testing Suite on Ubuntu has known issues with the Webkit browser engine (especially in headless mode). Please see [31615](https://github.com/microsoft/playwright/issues/31615), [13060](https://github.com/microsoft/playwright/issues/13060), [4235](https://github.com/microsoft/playwright/issues/4236), [Stack Overflow article](https://stackoverflow.com/questions/71589815/in-playwright-cant-use-page-goto-with-headless-webkit) for more information.

**A temporary (sort of) workaround**: if functions like `page.goto()` or `locator.click()` give issues, it can sometimes be fixed by deleting playwright, then reinstalling with dependencies (see below). Also note that you should not use a built-in terminal (like the one in VS Code), but rather run the tests using a separate terminal.

```bash
npx playwright uninstall
npx playwright install --with-deps
```
