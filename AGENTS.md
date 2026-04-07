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
│   └── *.spec.ts          # Test specifications
├── tests/                 # Customization layer (EDIT HERE)
│   ├── config/            # Config overrides (deep-merged with base-tests)
│   ├── poms/              # POM overrides
│   ├── utils/             # Utility overrides
│   └── *.spec.ts          # Test overrides and additions
├── .auth/                 # Per-worker auth storage (worker_0.json..worker_5.json)
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

**Import config like this:**
```typescript
import { UIReference, slugs, outcomeMarker, inputValues } from '@config';
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

## Authentication & Fixtures

Tests that require a logged-in user import `test` from `@utils/fixtures.utils` instead of `@playwright/test`:

```typescript
import { test } from '@utils/fixtures.utils';
```

This custom fixture:
- Assigns each Playwright worker a unique account (`playwright_user_{id}@elgentos.nl`).
- Stores auth state in `.auth/worker_{id}.json`.
- Logs in once per worker (not per test) and reuses the session.
- Validates existing sessions before reusing them.

Tests that don't need authentication import directly from `@playwright/test`:
```typescript
import { test, expect } from '@playwright/test';
```

## Page Object Model Pattern

POMs live in `poms/frontend/` and `poms/admin/`. Each POM:
- Takes a `Page` in its constructor.
- Defines locators as `readonly` properties using config values (never hardcoded strings).
- Exposes action methods (e.g., `login()`, `addToCart()`).
- Uses `UIReference` for element labels and `slugs` for navigation.

Example:
```typescript
import { UIReference, slugs } from '@config';

class LoginPage {
  readonly page: Page;
  readonly loginEmailField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginEmailField = page.getByRole('textbox', {
      name: UIReference.credentials.emailFieldLabel, exact: true
    });
  }

  async login(email: string, password: string) {
    await this.page.goto(slugs.account.loginSlug);
    // ...
  }
}
export default LoginPage;
```

Some POMs extend `MagewireUtils` (for pages with Hyva Magewire reactivity) to get `waitForMagewireRequests()`.

## Test Spec Patterns

```typescript
// For tests needing auth:
import { test } from '@utils/fixtures.utils';
// For tests not needing auth:
import { test as base, expect } from '@playwright/test';

import { outcomeMarker, inputValues } from '@config';
import LoginPage from '@poms/frontend/login.page';

base('Test_name_uses_underscores', { tag: '@hot' }, async ({ page, browserName }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login(email, password);
  // assertions...
});
```

**Tags:** `@setup` (one-time setup), `@hot` (critical path), `@cold` (standard), plus feature tags like `@checkout`, `@cart`, `@category`.

**Browser-specific env vars:** Some tests use `browserName` to load browser-specific data:
```typescript
const email = requireEnv(`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserName.toUpperCase()}`);
```

## Key Utilities

| Module | Purpose |
|---|---|
| `fixtures.utils.ts` | Worker-scoped auth fixture |
| `env.utils.ts` | `requireEnv()` - loads `.env` vars, throws if missing |
| `apiClient.utils.ts` | Magento REST API client with token management |
| `magewire.utils.ts` | Monitors Magewire requests, waits for DOM idle |
| `notificationValidator.utils.ts` | Validates toast/notification messages |
| `logger/Logger.ts` | Context-aware structured logging |

## Style Guide

- **Indentation:** tabs (as 4 spaces) for TypeScript and JSON.
- **No hardcoded strings.** All UI labels, URLs, messages, and test data come from config JSON files. If a value doesn't exist in config, add it there first, then reference it.
- **Locator strategy:** Prefer `page.getByRole()` with config labels. Fall back to `page.locator()` with a config selector only when roles don't work.
- **Test names:** Use `Underscored_names_describing_the_scenario`.
- **Files end with a newline**, no trailing whitespace.
- **Default exports** for POM classes.
- **Use path aliases** (`@config`, `@poms/*`, etc.), never relative paths for cross-directory imports.
- **Use `.press("Enter")` instead of `.click()`** on submit buttons to avoid WebKit issues.

## CI/CD Pipeline

Two stages in `.gitlab-ci.yml`:
1. **create_testing_suite** - Runs `@setup` tagged tests (creates accounts, disables CAPTCHA, sets up coupons via API). Uses 6 workers.
2. **run_testing_suite** - Runs all tests except `@setup`. Uses 1 worker. Retries up to 2 times.

Run locally:
```bash
npx playwright test --grep "@setup" --trace on       # Setup (run once)
npx playwright test --grep-invert "@setup" --trace on # All tests
npx playwright test login.spec.ts                     # Single file
npx playwright test --grep "@hot"                     # By tag
```

## Critical Rules for AI Agents

1. **Never edit `base-tests/`.** All changes go in `tests/`.
2. **Never hardcode strings.** Add values to the appropriate config JSON, then reference the export.
3. **Always use path aliases** for imports.
4. **Use the authenticated `test` fixture** from `@utils/fixtures.utils` when the test needs a logged-in user.
5. **Use POMs** for page interactions. Don't put locator logic directly in spec files.
6. **Config is deep-merged.** When overriding config in `tests/config/`, you only need to specify the keys you're changing.
7. **`setup.spec.ts` must run first** before any other tests. It creates accounts and configures the Magento instance.
8. **Browser-specific data** uses env vars suffixed with the browser engine name (e.g., `_CHROMIUM`, `_FIREFOX`, `_WEBKIT`).
9. **Magewire pages** (checkout, cart) need `waitForMagewireRequests()` after interactions that trigger Magewire calls.
10. **Commit messages:** Write concise messages describing the change.
