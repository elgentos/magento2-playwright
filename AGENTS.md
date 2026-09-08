# AGENTS.md - AI Agent Guide for magento2-playwright

## Project Overview

This is a Playwright end-to-end testing suite for Magento 2 stores running the Hyva theme. It tests frontend flows (login, checkout, cart, account management, etc.) and uses Magento's REST API for setup tasks. Tests run across Chromium, Firefox, and WebKit.

Also note that this is an open-source project. The tool is downloaded as an npm package, but contributors can actively work on the suite on Github: https://github.com/elgentos/magento2-playwright. Therefore, implementations and improvements to the suite should be as system-agnostic as is possible, and try to make customization as easy as possible.

## Project Structure

```
.
├── base-tests/            # Read-only reference tests (DO NOT MODIFY)
│   ├── config/            # Default JSON config files
│   ├── poms/              # Page Object Models (frontend/ and admin/)
│   ├── utils/             # Utility modules
│   ├── types/             # TypeScript type definitions
│   ├── fixtures/          # Storage-state paths + consent-seed reader
│   └── *.spec.ts          # Test specifications
├── tests/                 # Customization layer (EDIT HERE)
│   ├── config/            # Config overrides (deep-merged with base-tests)
│   ├── poms/              # POM overrides
│   ├── utils/             # Utility overrides
│   ├── fixtures/          # Fixtures overrides
│   └── *.spec.ts          # Test overrides and additions
├── .auth/                 # consentCookies.json + per-project worker auth files
├── playwright.config.ts   # Playwright configuration
├── tsconfig.json          # Path aliases (@config, @utils/*, @poms/*, etc.)
├── .env                   # Environment variables
├── build.js               # Copies base-tests from node_modules
├── install.js             # Interactive setup wizard
└── .gitlab-ci.yml         # CI/CD pipeline
```

## Base-Tests vs Tests: The Override System

The suite uses a dual-layer architecture. `base-tests/` contains the reference implementation and is rebuilt from the npm package on every install. `tests/` is the customization layer.

**How file resolution works** (in `playwright.config.ts`):
- The `getTestFiles()` function scans both `base-tests/` and `tests/` for `*.spec.ts` files.
- If a file with the same name exists in both directories, only the `tests/` version runs.
- Files unique to `tests/` are included as additional tests.
- Files only in `base-tests/` run as-is.

**Rules for agents:**
- Never modify files in `base-tests/`. They are overwritten on package updates.
- Always make changes in `tests/`. To customize a base test, copy it to `tests/` and modify there.
- The same override logic applies to POMs, utils, and config via TypeScript path aliases.

## Configuration System

Five JSON config files live in `config/`. The loader (`config/index.ts`) deep-merges `base-tests/config/` with `tests/config/`, so you only need to specify overrides in `tests/config/`.

| File | Export | Purpose |
|---|---|---|
| `element-identifiers.json` | `UIReference` | UI element labels, roles, and CSS selectors |
| `input-values.json` | `inputValues` | Test data (names, addresses, credit cards, search terms) |
| `slugs.json` | `slugs` | URL paths for all pages |
| `outcome-markers.json` | `outcomeMarker` | Expected success/error messages |
| `test-toggles.json` | `toggles` | Persistent switches for optional store capabilities |

**Import config like this:**
```typescript
import { UIReference, slugs, outcomeMarker, inputValues, toggles } from '@config';
```

## Path Aliases

Defined in `tsconfig.json`. Always use these instead of relative paths:

| Alias | Resolves to |
|---|---|
| `@config` | `base-tests/config` or `tests/config` |
| `@utils/*` | `base-tests/utils/*` or `tests/utils/*` |
| `@poms/*` | `base-tests/poms/*` or `tests/poms/*` |
| `@types/*` | `base-tests/types/*` or `tests/types/*` |
| `@fixtures/*` | `base-tests/fixtures/*` or `tests/fixtures/*` |
| `@base/*` | `base-tests/*` only. This is how a `tests/` override imports the packaged class it extends — `@poms/*` would resolve back to the override itself. |

## Authentication & Fixtures

`@utils/fixtures.utils` exports two test objects. Every storefront spec imports
one of them — never `@playwright/test` directly — because both fold the
cookie-consent decision captured by `globalSetup` into their storage state.

```typescript
// Needs a logged-in customer:
import { test, expect } from '@utils/fixtures.utils';

// Runs as a visitor:
import { guestTest as test, expect } from '@utils/fixtures.utils';

// A file with both: import both and use guestTest.describe(...) for the guest group.
import { test, guestTest, expect } from '@utils/fixtures.utils';
```

Never write `test.use({ storageState: { cookies: [], origins: [] } })` to drop
authentication: it drops the consent decision too, and `test.use` values are
evaluated during collection, before `globalSetup` has written the seed. Use
`guestTest` instead.

The authenticated object:
- Logs in as a pre-provisioned account chosen by worker index
  (`playwright+{parallelIndex}@elgentos.nl`, created by `init.setup.ts`).
- Stores auth state in `.auth/{projectName}/worker_{parallelIndex}.json`, so
  chromium, firefox and webkit never share a *state file*. They do still share
  the Magento *customer* at a given index, which is safe because no spec
  mutates the shared login — `account.spec.ts` provisions its own throwaway
  account for credential changes.
- Logs in once per worker, validates the session before reusing the file, and
  rebuilds it if the consent cookies are missing.
- Re-authenticates inline via the `_authGuard` auto-fixture if a session dies
  mid-run.

`@fixtures/storage-state` owns every path involved (`.auth/consentCookies.json`
and the worker files) and the consent-seed reader. Both `global-setup.ts` and
`fixtures.utils.ts` import it, so overriding only one of them in a store's
`tests/` cannot leave a writer and a reader pointing at different directories.
Set `COOKIE_CONSENT_CMP_HOST` in `.env` (e.g. `consentmanager.net`) to have the
auth fixture block the CMP script outright while it logs in.

`global-setup.ts` matches the CMP banner by the text in
`UIReference.text.frontend.common.cookieConsentTitle` and
`UIReference.text.shared.buttons.cookieReject` (consentmanager.net's English
defaults) — a different CMP or language must override both in
`tests/config/element-identifiers.json`. If no banner exists (local install or
network-level blocking), `globalSetup` detects it in ~5s and continues with an
empty seed; if a banner exists but the labels don't match, it retries for up to
30s. The seed carries cookies only (a CMP using `localStorage` will not be
captured); `COOKIE_CONSENT_CMP_HOST` applies only to the auth fixture's context.
See [README.md § Cookie-consent management (CMP) hosts](README.md#-authentication--fixtures) for
details.

## Page Object Model Pattern

POMs live in `poms/frontend/` and `poms/admin/`. Each POM:
- Takes a `Page` via `constructor(public readonly page: Page) {}`.
- Defines locators as `get` accessors using config values (never hardcoded strings), built lazily rather than assigned in the constructor.
- Exposes action methods (e.g., `login()`, `addToCart()`).
- Uses `UIReference` for element labels and `slugs` for navigation.
- Is a **named export**, using the unprefixed class name (`LoginPage`, not `BaseLoginPage`) — no default export.

Example (see `tests/poms/frontend/login.page.ts` for the real file this is based on):
```typescript
import { UIReference, slugs } from '@config';
import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  constructor(public readonly page: Page) {}

  get loginEmailField(): Locator {
    return this.page.getByRole('textbox', {
      name: UIReference.text.shared.forms.email, exact: true
    });
  }

  async login(email: string, password: string) {
    await this.page.goto(slugs.frontend.account.login);
    // ...
  }
}
```

Some POMs extend `MagewireUtils` (for pages with Hyva Magewire reactivity) to get `waitForMagewireRequests()`.

## Overriding a POM in a store

To change one method, subclass instead of copying the file. A file in
`tests/poms/` completely replaces the `base-tests/` file of the same name, so it
must export the same symbol name — and it reaches its parent through `@base/*`,
never through `@poms/*` (which would resolve to itself).

```typescript
// tests/poms/frontend/login.page.ts
import { LoginPage as BaseLoginPage } from '@base/poms/frontend/login.page';

export class LoginPage extends BaseLoginPage {
  // only what differs for this store
  async login(email: string, password: string) {
    // custom implementation
  }
}
```

Rules:

- Export the **same name** the base file exports. Specs and other POMs import
  that name; renaming it breaks them.
- Import the parent from `@base/*`. This is the one alias that always points at
  the packaged base layer.
- Locators are `get` accessors, so a subclass can override one by redeclaring
  the getter, optionally reusing `super.someGetter`.
- Cross-POM references need nothing special: a base POM doing
  `new MainMenuPage(this.page)` resolves through `@poms/*` and therefore picks
  up a store's override automatically.

### Two resolution quirks worth knowing

`tsc` resolves a `paths` array first-match; Playwright resolves it **last**-match.
The arrays are ordered base-first so Playwright picks `tests/` — **do not
"fix" the ordering**, it is deliberate. Consequences:

- A stale `base-tests/` makes `npx tsc --noEmit` report errors that do not
  affect a test run. Run `node build.js` first.
- IDE go-to-definition follows `tsc`, so it lands on the base copy while the
  runtime uses the store copy.

### Verifying the seam — run this locally

The override mechanism is covered by `npm run verify:seam`, which builds a
consumer-shaped fixture in a temp dir and checks that a `tests/` file shadows
its `base-tests/` counterpart, can extend it, and is picked up when another POM
composes it.

**It does not run in CI — it is a local pre-merge check, and nothing enforces
it.** Run it, and make sure it prints `PASS`, whenever you change any of:

- a `paths` entry in `tsconfig.json` or `tsconfig.example.json`
- a POM's class name, or its export style
- a POM member's visibility (`private` / `protected` / `public`)
- the Playwright version

That last one matters most. The whole mechanism rests on Playwright resolving
`paths` arrays last-match-wins, which is undocumented upstream and could change
in a patch release. This harness is the only thing that would catch it.

## Test Spec Patterns

```typescript
// For tests needing auth:
import { test } from '@utils/fixtures.utils';
// For tests not needing auth:
import { test as base, expect } from '@playwright/test';

import { outcomeMarker, inputValues } from '@config';
import { LoginPage } from '@poms/frontend/login.page';

base('Test_name_uses_underscores', { tag: '@hot' }, async ({ page, browserName }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login(email, password);
  // assertions...
});
```

**Tags:** `@hot` (critical path), `@cold` (standard), `@api` (API-driven, no browser), plus feature tags like `@checkout`, `@cart`, `@category`. Setup tests are no longer tagged — they run in a dedicated `setup` Playwright project (see CI/CD Pipeline section below).

**Browser-specific env vars:** Some tests use `browserName` to load browser-specific data:
```typescript
const email = requireEnv(`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserName.toUpperCase()}`);
```

## Key Utilities

| Module | Purpose |
|---|---|
| `fixtures.utils.ts` | `test` (per-worker auth) and `guestTest` (consent only) |
| `../fixtures/storage-state.ts` | Storage-state paths + consent-seed reader |
| `env.utils.ts` | `requireEnv()` - loads `.env` vars, throws if missing |
| `apiClient.utils.ts` | Magento REST API client with token management |
| `magewire.utils.ts` | Monitors Magewire requests, waits for DOM idle |
| `notificationValidator.utils.ts` | Validates toast/notification messages |
| `logger/Logger.ts` | Context-aware structured logging |

## Style Guide

- **Indentation:** tabs (as 4 spaces) for TypeScript and JSON. Enforced by Prettier — run `npm run format` rather than hand-aligning.
- **No hardcoded strings.** All UI labels, URLs, messages, and test data come from config JSON files. If a value doesn't exist in config, add it there first, then reference it.
- **Locator strategy:** Prefer `page.getByRole()` with config labels. Fall back to `page.locator()` with a config selector only when roles don't work.
- **Test names:** Use `Underscored_names_describing_the_scenario`.
- **Files end with a newline**, no trailing whitespace.
- **Named exports** for POM classes, using the unprefixed name (`LoginPage`, not `BaseLoginPage`). Every layer exports the same name — that is what makes overrides work.
- **Never add `instanceof`, `.constructor`, or `Object.getPrototypeOf` checks on POMs.** A base POM and a store's override are separate classes from separate modules, so identity comparisons across them are unreliable by construction.
- **Use path aliases** (`@config`, `@poms/*`, etc.), never relative paths for cross-directory imports.
- **Use `.press("Enter")` instead of `.click()`** on submit buttons to avoid WebKit issues.

### Linting

Style is mechanically enforced. A blocking `lint` job runs on every pull request and GitLab pipeline.

```bash
npm run typecheck     # TypeScript compiler validation
npm run lint          # ESLint: type-aware TS rules + Playwright rules
npm run lint:ci       # ESLint with the current warning baseline
npm run format        # Prettier: rewrite JS, TS, and JSON files
npm run format:check  # Prettier: verify JS, TS, and JSON files
```

Config lives in `eslint.config.mjs` and `.prettierrc.json`. Both are `.npmignore`d — they are
contributor tooling and are not shipped to consumers of the package.

`base-tests/` is never linted; it is generated from `tests/` by `build.js`. Warnings mark
pre-existing debt — do not increase the total, and lower the `lint:ci` warning baseline when warnings
are removed.

Prettier intentionally formats source code and JSON only. Markdown and YAML retain their existing
formatting to avoid unrelated documentation and pipeline diffs.

Run `git config blame.ignoreRevsFile .git-blame-ignore-revs` once, so the bulk Prettier commit does
not obscure `git blame`.

## CI/CD Pipeline

`.gitlab-ci.yml` has three stages: `lint`, `testing_suite`, `mirror`. The `lint` stage runs type
checking, ESLint with the warning baseline, and Prettier, and blocks the pipeline on failure.
`testing_suite` runs `npx playwright test`; setup (`init.setup.ts`, the `setup` Playwright project)
runs automatically as a dependency of the chromium/firefox/webkit projects — no separate setup
stage.

Run locally:

```bash
npx playwright test                                   # All tests, with setup auto-run
npx playwright test login.spec.ts                     # Single file (setup still runs)
npx playwright test --grep "@hot"                     # By tag (setup still runs)
npx playwright test --project=setup                   # Run setup only (rarely needed)
```

## Critical Rules for AI Agents

1. **Never edit `base-tests/`.** All changes go in `tests/`.
2. **Never hardcode strings.** Add values to the appropriate config JSON, then reference the export.
3. **Always use path aliases** for imports.
4. **Use the authenticated `test` fixture** from `@utils/fixtures.utils` when the test needs a logged-in user.
5. **Use POMs** for page interactions. Don't put locator logic directly in spec files.
6. **Config is deep-merged.** When overriding config in `tests/config/`, you only need to specify the keys you're changing.
7. **Setup runs as a project dependency.** `init.setup.ts` creates accounts, disables admin CAPTCHA, and sets up coupon codes when the `couponCodes` toggle is enabled. It runs automatically before any browser test via `dependencies: ['setup']` in `playwright.config.ts` — never invoke it manually.
8. **Browser-specific data** uses env vars suffixed with the browser engine name (e.g., `_CHROMIUM`, `_FIREFOX`, `_WEBKIT`).
9. **Magewire pages** (checkout, cart) need `waitForMagewireRequests()` after interactions that trigger Magewire calls.
10. **Commit messages:** Write concise messages describing the change.
