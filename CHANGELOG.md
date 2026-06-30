# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Setup is now a Playwright **project dependency**, not a tagged spec. `npx playwright test` runs `init.setup.ts` (the `setup` project) once automatically before any browser test. The separate `npx playwright test --grep "@setup"` step is no longer required.
- Coupon codes moved from per-browser env vars (`MAGENTO_COUPON_CODE_*`) to a `coupon.codes` map in `input-values.json` (keyed by uppercase browser name). Adding a new browser is now a one-line config change.
- CI pipelines (both `.gitlab-ci.yml` and `.github/workflows/main.yml`) collapsed from two stages to one — Playwright's project dependency handles ordering.
- Playwright reports and test artifacts are written to the Magento root when the suite is installed inside a theme's `web/playwright` directory.

### Removed
- `tests/setup.spec.ts` (replaced by `tests/init.setup.ts`).
- `MAGENTO_COUPON_CODE_CHROMIUM`, `MAGENTO_COUPON_CODE_FIREFOX`, `MAGENTO_COUPON_CODE_WEBKIT` env vars.
- `@setup` tag (no longer needed; setup is gated by project dependency, not by tag filtering).

### Breaking Changes
- Existing installs upgrading to this version must update their root `playwright.config.ts` to mirror `playwright.config.example.ts` (new `setup` project + `getSetupFiles()` helper + `dependencies: ['setup']` on browser projects). Without this update, setup will not run and downstream tests will fail. See README → "Migrating from 6.x".
- CI pipelines that filter on `@setup` (e.g. `--grep @setup`, `--grep-invert @setup`) no longer match anything — replace with the appropriate flag-less invocation.

## [6.0.0] - 2026-04-20

### Added
- StorageState/fixture-based authentication (`fixtures.utils.ts`) for reusing login sessions across tests, improving speed and stability of `mainmenu`, `account`, and `checkout` specs.
- HTTP Basic Authentication support for environments behind HTTP auth (e.g. review sites). New `HTTP_AUTH_USERNAME` / `HTTP_AUTH_PASSWORD` `.env` variables, wired into `playwright.config`, `apiClient.utils.ts`, and fixtures via a new `getHttpCredentials()` helper in `env.utils.ts`.
- `url.utils.ts` with `slugToRegex()` helper to standardize `page.waitForURL()` calls using `slugs.json` entries instead of hard-coded regex strings.
- `admin` slug group in `slugs.json` (`customerIndexSlug`, `customerNewSlug`, `customerEditSlug`, `orderIndexSlug`).
- `outputDir` in `playwright.config.example.ts` so test artifacts land in a predictable location.
- Locator handlers for admin pop-ups (Adobe data collection, Elasticsuite newsletter/telemetry, incoming-message modals) to improve admin login stability.
- `install.js` now auto-derives vendor/theme from the directory structure (falls back to prompting).

### Changed
- Rewrote `AGENTS.md`.
- Moved many hard-coded locators and strings into `element-identifiers.json` (category size filter, discount box, admin pop-up labels, reCAPTCHA options, storefront labels).
- Renamed `changedPasswordNotificationText` → `changedCredentialsInformation` in `outcome-markers.json`.
- `account.spec.ts`: moved soft expectations for `addNewAddress` / `editExistingAddress` into the spec to enforce correct assertion order; relocated address notification check to match the actual UI timing.
- `adminlogin.page.ts`: fixed race conditions and added `dispatchEvent` fallbacks to reliably close pop-ups.
- `magewire.utils.ts`: simplified idle-wait — removed fixed `waitForTimeout(500)` in favor of a loader element count check.
- `setup.spec.ts`: multiple stability fixes; added locator handlers for pop-ups.
- `tsconfig.example.json`: removed `baseUrl`; path aliases now use explicit `./` prefix.
- Suppressed noisy `console.log` calls in `fixtures.utils.ts`; `dotenv.config` now uses `quiet: true`.

### Fixed
- Checkout tests stabilized by ensuring the address is filled in and by updating a changed checkout locator.
- Fixed API call for coupon codes and several related vulnerabilities.
- Standardized use of `slugToRegex` across `waitForURL` calls; fixed error in `account.page.ts`.
- `category.spec.ts` `filter_on_size` test fixed; subcategory test skipped on Firefox due to a known issue.
- Marked `Guest_can_select_payment_methods` as a hot test; `search.spec` and `mainmenu.spec` search tests marked `fixme` (see ticket 414).

### Removed
- `bypass-captcha.config.example.ts` and all `CAPTCHA_BYPASS` CI/config references (replaced with proper test accounts).
- `auth.setup.ts` (superseded by fixtures).
- `tests/config/test-toggles.json` (unused).
- Regex slug entries (`accountOverviewRegex`, `loginSlugRegex`, `wishListRegex`) in favor of `slugToRegex()`.


## [5.0.0] - 2026-02-24

### Changed
- Updated `@faker-js/faker`, `csv-parse`, and `dotenv` to their next major versions.
- `apiClient.utils.ts` no longer requires specific `.env` credentials, instead uses the provided admin credentials.
- `setup.spec.ts` now uses the API-driven approach for account creation and coupon code setup.
- `outcome-markers.json` changed `cart.priceReducedSymbols` from `"- $"` to `"$"` for more flexible discount assertions (for example: spacing is not consistent between projects).
- `mainmenu.page.ts` reworked navigation: uses product page instead of base URL to prevent menu login-state issues.
- `checkout.page.ts` adds payment method check assertion before placing order, reworked discount verification to check for "Cancel Coupon" button, and adds a wait after
country selection for region dropdown update to allow UI changes to take effect.

### Fixed
- `search.spec.ts` URL assertion changed from exact match to `stringContaining` to prevent false negatives.
- `checkout.spec.ts` marks `Guest_can_select_payment_methods` as `test.slow()` to prevent timeouts.
- `mainmenu.spec.ts` adds localhost workaround for menu login-state recognition after login.

### Deprecated
- Previous versions of `setup.spec.ts` used Playwright functionality to log in to the admin environment and update the necessary settings. This is now mostly replaced with API calls. The old functionality is currently commented out, meaning you can still use it - but this will be removed in future versions.
- We are currently working on overhauling various JSON files within `config`. Several variables are already under a deprecation notice, and the next update to this npm will continue to rework these.


## [4.0.0] - 2026-01-21

### Added
- We've added `fixtures.utils.ts`. More on this in a future update!

### Changed
- Renamed `adminhtml` folder to `admin`
- Renamed admin `login.page.ts` to `adminlogin.page.ts` to prevent confusion.
- `setup.spec.ts` now utilizes the APIClient.
- Updated `playwright.config.ts
  - Default timeout extended to 150_000
  - Trace is now `retain-on-failure`
  - Video and screenshot collection are now `.env` variables, defaulting to `retain-on-failure`

### Fixed
- Variety of locators and such to comply with changes made by Hyvä and/or Magento.
- Improved stability of tests.
- Small hotfix to accommodate a slight change in language if a field is missing.

## [3.0.1] - 2025-11-04

### Added
- APIClient utility to improve the speed of setting up your testing environment.

### Changed
- Split `magentoAdmin.page.ts` for legibility and to better adhere to the separation of concerns philosophy.

### Fixed
- Moved some hardcoded selectors to `element-identifiers.json`

## [3.0.0] - 2025-10-23

### Added
- Added footer tests for subscribing to the newsletter and currency switcher.
- Added a Notification Utility to validate Magento frontend messages.
- Added a console.log utility tool to prevent having to use `console.log`.

### Changed
- Rewritten `setup.spec.ts` for better legibility. Setup will now also check if elements are present and active (e.g., coupon codes) and no longer writes to `.env`.
- Improved the capability of the Magewire loading utility to better handle various states of the Magewire loading element.
- Improved usage of TypeScript `@` path aliases (e.g., `@utils`, `@poms`, `@config`) for easier customization and maintainability.
- Updated `translate-json.js` and `install.js` to class-based files for consistency.
- Updated README to reflect new updates.
- Updated Magento Admin and frontend specs to fix various race conditions, timeouts and other 'false negatives'.
- Fixed GitHub workflow and installation scripts for reliability.

### Removed
- Removed setup toggles to avoid the use of `.only()` as this can easily lead to mistakes. Use `grep` instead.

### Fixed
- Fixed various ‘false negatives’ where tests would fail due to poor hydration methods, including country selection and state selection fields which change based on the selected country.
- Fixed ‘race condition’ in the `change_quantity_in_cart` test which sometimes caused the quantity to not be properly updated.
- Minor fixes for ‘multimatch’ selector errors.
- Fixed typos and minor issues in multiple files for better stability.

### New Contributors
- [@Vinai](https://github.com/Vinai)

## [2.2.0] - 2025-08-04

### Added
- Added a console.log utility tool to prevent having to use ‘console.log’.


### Changed
- Rewritten setup.spec.ts for better legibility. Setup will also now check if elements are present and active (e.g. coupon codes), and no longer writes to .env.
- Improved the capability of the magewire loading utility to better handle various states of the magewire loading element
- Improved using @ tags for example @utils, @poms and more for ease of customization and maintainability.
- Updated README to reflect new updates.


### Removed
- Removed setup toggles to avoid the use of `.only()` as this can easily lead to mistakes. Use ‘grep’ instead.

### Fixed
- Fixed various ‘false negatives’ where tests would fail due to poor hydration methods. Among these is the country selection and the state selection field, which changes based on the selected country.
- Fixed ‘race condition’ in the `change_quantity_in_cart` test which sometimes caused the quantity to not be properly updated.
- Minor fixes for ‘multimatch’ selector errors

## [2.1.0-alpha] - 2025-07-08

### Added
- Added and configured path aliases in `tsconfig.json` and Playwright setup to support unified imports from both `tests` and `base-tests` directories.
- Introduced centralized index files for configuration and utilities to enable simplified imports.

### Changed
- Improved TypeScript path alias usage across the project for cleaner and more maintainable imports.
- Replaced relative path traversals with specific path aliases (`@utils`, `@poms`, `@config`) to enhance developer experience and reduce errors.
- Updated all affected files to conform with the new import structure.
- Enhanced override mechanisms for better modularity and clarity in the codebase.
- Updated `setup.spec` to ensure compatibility and structure.

### Fixed
- Resolved compatibility issues with IDE tooling and runtime environments to prevent import-related problems.

### Impact
- Cleaner import statements throughout the codebase.
- Improved code maintainability and easier onboarding for new developers.
- Reduced likelihood of import path errors during development and CI runs.

## [2.0.1-alpha] - 2025-07-02

### Fixes
- Fixed error in the order of install script in `package.json` which meant that the setup of `.env` didn't work.
- Fixed trailing comma that can cause unnecessary issues in certain linters.

## [2.0.0-alpha] - 2025-07-02
The initial NPM Package release!

Due to a difference in releases between the GitHub version and the npm package, we've now marked both as version 2.0.0-alpha to signify their merger and to avoid confusion in the future.

### Added

- Build scripts to help set up the testing suite through the npm package!
- Configuration helper files that make customization easier by automatically picking the correct import of JSON files.
- Custom files in 'tests' folder will now automatically be used if corresponding spec file is also placed in test folder.
- Notification Validator: A utility for validating Magento frontend messages during testing (e.g. "Add to Cart" success message).
- Environment Variable Utility: Centralized handling of environment variables for consistent configuration across test environments.
- Magewire Utility: Helper functions to interact with Magewire components in tests.
- New tests:
  - `search.spec.ts`
  - `product.spec.ts`
  - `orderhistory.spec.ts`
  - `healthcheck.spec.ts`
  - `compare.spec.ts`
  - `category.spec.ts`

### Changed

- The elgentos testing suite is now a npm package for maintainability: [link to testing suite npm package](https://www.npmjs.com/package/@elgentos/magento2-playwright).
- Removed test toggles to avoid issues where the suite would fail without giving a helpful message.
- Added 'smoke' tags to healthcheck tests to better adhere to industry standards.
- 'Fixtures' folder is now 'poms'.
- Split the magento admin page files and frontend page files in the renamed 'poms' folder.
- .env attributes renamed, and defaults will be suggested during installation.
- Divided the steps in `setup.spec.ts` to make them easier to read.
- Moved and renamed config files
- Readme files

### Fixes

- Various fixes for stability, better adherence to the DRY-principle and separation of concerns.

### New Contributors
- [@LS-Myron](https://github.com/LS-Myron)

## [1.0.0-alpha] - 2025-01-29
The initial Alpha Release!

### Added

- Setup script to make it easier for users to prepare Magento 2 admin section.
- Test cases for key features such as creating an account, ordering a product,  adding a coupon code, and more.
- Element identifiers, input values, and outcome markers added in JSON files to make customization easier.
- Example GitHub Actions workflow to show how easily our tool can be integrated into the CI/CD pipeline.

### New Contributors
- [@shayfaber](https://github.com/shayfaber)
- [@dheesen](https://github.com/dheesen)
