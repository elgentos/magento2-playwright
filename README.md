# elgentos Magento 2 Playwright E2E Testing Suite

This package/repo contains an end-to-end (E2E) testing suite for Magento 2, powered by [Playwright](https://playwright.dev/). It enables you to quickly set up, run, and extend automated browser tests for your Magento 2 store. Installation is simple via npm, allowing you to seamlessly integrate robust testing into your development workflow.

This README will describe how to set up the suite for you. More information can always be found in the wiki.

> ### ⚠️ NOTE: this suite is *not* production-friendly.
> If you are unsure of what exactly the testing suite does, **do not run in it on your production site**. Some tests will create entries in the database, muddying your data. Additionally, `setup.spec.ts` (deprecated) / `init.setup.ts` will disable various CAPTCHA's on your webshop.


---
## Table of Contents

**Getting started**
- [Prerequisites](#prerequisites)
- [Installing the suite](#-installing-the-suite)
- [Before you run](#-before-you-run)
- [Running tests](#-running-tests)
- [Migrating from 6.x](#-migrating-from-6x)


---
## Prerequisites
* **Node.js** (20.19+) — required by Playwright and Faker. Check the [Playwright docs](https://playwright.dev/docs/intro#system-requirements) and [Faker docs](https://fakerjs.dev/guide/) for more specific information.
* **A reachable Magento 2 instance** — to run the tests against. Elgentos sponsors a [Hyvä demo website](https://hyva-demo.elgentos.io/) for this project.
* **A Magento 2 admin user** — whose credentials work with API calls (to `/rest/V1/integration/admin/token`), with rights over customers, coupons, and store config.


While the suite is designed for websites utilizing the Hyvä theme and checkout, it may work for your website out-of-the-box as well — thanks to Playwright's "user-facing" locators.


---
## 🧪 Installing the suite

1. **Create a playwright/ directory inside your theme’s** `/web` **folder**.

Navigate to the `web` folder of your theme. This is usually located in `app/design/frontend/{vendor}/{theme}/web`. Within this folder, create a `playwright` folder, then navigate to it:

```bash
cd app/design/frontend/demo-store/demo-theme/web
mkdir playwright
cd playwright
```

2. **Initialize an npm project.**

```bash
npm init -y
```

3. **Install the test suite package.**

Lastly, simply run the command to install the elgentos Magento2 Playwright package, and the installation script will set things up for you!

```bash
npm install @elgentos/magento2-playwright
```

This will produce the following:
* a `base-tests` folder (containing various files and folders - see the wiki).
* an empty `tests` folder (can be used for your custom files).
* `playwright.config.ts`, `tsconfig.json`, and an `.env` file.

**Notes about this step**
- `build.js` creates the `base-tests` folder. This assumes the package sits at `<root>/node_modules/@elgentos/magento2-playwright`.
- The installation wizard will also ask you if you want to add rules to `.gitignore`, and will try to write to the `.gitignore` file in the root of your Magento 2 instances.
- After running `npm install`, the interactive wizard cannot run (npm gives lifecycle scripts no TTY), so your .env is an unconfigured copy of `.env.example` and the suite will not start. Run the command below and answer `y` to the first question. **Warning**: this rewrites .env in full — back up any custom variables first. (fix to come in the future).

```bash
node node_modules/@elgentos/magento2-playwright/install.js
```

4. **(only required in bare Linux/CI hosts): Install Playwright dependencies.**
To install dependencies, simply run:

```bash
npx playwright install-deps
```


---
## ⏸️ Before you run
After the installation, a variety of folders will have been created. Most notable in these are `base-tests`, which contain the tests without alteration, and `tests`. **You should never make changes directly to the base-tests folder, as these changes can easily be silently overwritten and may break functionalities.** Since `base-tests` can be updated when you upgrade the package, it's best to review changes after an update. We're working on implementing a report to summarize changes for you; you can also always look at the CHANGELOG.


---
## 🤖 Running tests
The suite runs every test against Chromium, Firefox and WebKit. By default (as defined in `playwright.config.ts`), Playwright will run `global-setup.ts` first to ensure the tests can properly run. Playwright always pulls in the `setup` project first — it is wired as a project dependency, so it runs no matter how you invoke the suite. See the wiki for more information. These two files perform the following actions:

1. `utils/global-setup.ts` will attempt to reject all cookies and have that persist through a Playwright storageState seed.
2. `init.setup.ts` will disable the login CAPTCHA, enable multiple logins for admin, create test accounts, and set up coupon codes. You can skip the coupon codes step by adjusting the toggle in `tests/config/test-toggles.json`.

To run the tests, `npx playwright test` is all you need:

```bash
npx playwright test
```

This runs every spec in `base-tests`, substituting your own version of a file whenever one exists in `tests`. To run only a subset of tests, you can add a filename, use `--grep` to only run tests with specific tags, or `--project` to only run tests in a specific browser instance:

```bash
npx playwright test login.spec.ts
npx playwright test --grep "@hot"
npx playwright test --project=chromium
```

See the wiki for more in-depth information.


---
## 🔁 Migrating from 6.x
Version 7.0.0 brings major breaking changes to the testing suite compared to version 6.x.

> ### **⚠️ Warning:**
> Create a back-up of the current state of your testing suite before upgrading to version 7.X.X. The table below shows changes that have been made that **will break your implementation**.

| Change      | Impact |
| ----------- | ----------- |
| Setup is now a project dependency (init.setup.ts + setup project + dependencies: ['setup']) instead of a `@setup`-tagged spec (`setup.spec.ts`). | Your `playwright.config.ts` must mirror `playwright.config.example.ts`, or setup never runs. |
| `@base/*` alias added, must be first under `paths` in root `tsconfig.json`   | Without it every POM override fails to resolve (TS2307 / collection error). |
| `@setup` tag removed | `--grep @setup` / `--grep-invert @setup` in CI match nothing |
| POM classes dropped the `Base` prefix (`BaseLoginPage` → `LoginPage`) | Copied specs/POMs need import renames |
| `AdminLogin` changed from default → named export | `import { AdminLogin } from ...` |
| Coupon codes moved from `MAGENTO_COUPON_CODE_*` `env` vars → `coupon.codes` map in `input-values.json` | These three `.env` vars are no longer in the suite.
| `tests/config/index.ts` deep-merge bug fixed (both layer paths derived from `__dirname`, collapsing to one dir) | Stores that copied this file silently lost every base default — effective config values change on upgrade. |
