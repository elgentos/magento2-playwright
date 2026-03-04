# elgentos Magento 2 Playwright BDD E2E Testing Suite

This package contains an end-to-end (E2E) testing suite for Magento 2, powered by [Playwright](https://playwright.dev/). It enables you to quickly set up, run, and extend automated browser tests for your Magento 2 store. Installation is simple via npm, allowing you to seamlessly integrate robust testing into your development workflow.

<mark>⚠️ Please note: if you’re not sure what each test does, **then you should only run this in a testing environment**! Some tests involve the database, and for the suite to run `setup.spec.ts` will disable the CAPTCHA of your webshop.</mark>

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

The newly created `tests` folder will become your base of operations. In here, you should use the same folder structure that you see in `base-tests`. For example, if your login page works slightly differently from the demo website version, create a copy of `login.page.ts` and place it `tests/poms/frontend/` and make your edits in this file. The next time you run the testing suite, it will automatically use these custom files.

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

## Scenarios

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
|                      |                                    | :warning: Footer_switch_currency (fixme: does not work due to error on website)   |
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
| cart.spec.ts         | Cart functionalities (guest)       | :heavy_check_mark: Add_product_to_cart                                            |
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
|                      |                                    | :warning: Leave_a_product_review (fixme: fails due to error on website)           |
|                      |                                    | :heavy_check_mark: Open_pictures_in_lightbox_and_scroll                           |
|                      |                                    | :heavy_check_mark: Change_number_of_reviews_shown_on_product_page                 |
|                      | Simple product tests               | :warning: Simple_tests_will_be_added_later                                        |
|                      | Configurable product tests         | :warning: Configurable_tests_will_be_added_later                                  |
| search.spec.ts       | Search functionality               | :heavy_check_mark: Search_query_returns_multiple_results                          |
|                      |                                    | :heavy_check_mark: User_can_find_a_specific_product_and_navigate_to_its_page      |
|                      |                                    | :heavy_check_mark: No_results_message_is_shown_for_unknown_query                  |
| setup.spec.ts        | Setting up the testing environment | :heavy_check_mark: Disable_login_captcha                                          |
|                      |                                    | :heavy_check_mark: Enable_multiple_admin_logins                                   |
|                      |                                    | :heavy_check_mark: Set_up_coupon_codes                                            |
|                      |                                    | :heavy_check_mark: Create_test_accounts                                           |

## Roadmap
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
| cart.spec.ts         | Guest to user         | Carts_are_merged_from_guest_to_user                         | Medium   |
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
| cmspages.spec.ts     | General               | Default_404_is_shown_on_nonexistent_url                     | Medium   |
| contact.spec.ts      | General               | Form_cannot_be_submitted_with_missing_field                 | Medium   |
| contact.spec.ts      | General               | Form_cannot_be_submitted_with_incorrect_emailaddress_format | Medium   |
