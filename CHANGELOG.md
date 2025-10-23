# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Updated Magento Admin and frontend specs to ensure tests run successfully.
- Fixed GitHub workflow and installation scripts for reliability.

### Removed
- Removed setup toggles to avoid the use of `.only()` as this can easily lead to mistakes. Use `grep` instead.

### Fixed
- Fixed various ‘false negatives’ where tests would fail due to poor hydration methods, including country selection and state selection fields which change based on the selected country.
- Fixed ‘race condition’ in the `change_quantity_in_cart` test which sometimes caused the quantity to not be properly updated.
- Minor fixes for ‘multimatch’ selector errors.
- Fixed typos and minor issues in multiple files for better stability.

### New Contributors
- https://github.com/Vinai

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
- https://github.com/LS-Myron

## [1.0.0-alpha] - 2025-01-29
The initial Alpha Release!

### Added

- Setup script to make it easier for users to prepare Magento 2 admin section.
- Test cases for key features such as creating an account, ordering a product,  adding a coupon code, and more.
- Element identifiers, input values, and outcome markers added in JSON files to make customization easier.
- Example GitHub Actions workflow to show how easily our tool can be integrated into the CI/CD pipeline.

### New Contributors
- https://github.com/shayfaber
- https://github.com/dheesen