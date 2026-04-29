# Setup as Playwright Project Dependency — Design Spec

**Date:** 2026-04-29
**Branch:** `421-setup-tests-should-not-be-tests`
**Author/Owner:** Shay (elgentos)

## Problem

Today, environment setup (disable login CAPTCHA, create test accounts, set coupon
codes) lives in `setup.spec.ts` — three regular Playwright tests tagged `@setup`.
Users must run them as a separate command (`npx playwright test --grep "@setup"`)
before the main suite. The CI pipeline mirrors this with a two-stage job
(`create_testing_suite` then `run_testing_suite`).

This is fragile in three ways:

1. The setup is bypassable — running `npx playwright test` without the `--grep`
   flag silently skips setup; downstream tests then fail in confusing ways.
2. Setup tests pollute the regular test report, even though they aren't
   user-facing scenarios.
3. The `tests/setup.spec.ts` file currently has a `test.describe.configure({ mode:
   'serial' })` workaround to prevent API races between the setup tests
   themselves — a smell that hints the file is in the wrong place.

## Goal

Move setup off the user's plate by converting `setup.spec.ts` into a Playwright
**project dependency**: a separate project (`setup`) that the browser projects
(`chromium`, `firefox`, `webkit`) depend on. Then `npx playwright test` runs
setup once, automatically, before any test in the dependent projects.

## Non-goals

- Changing what the setup steps actually do (CAPTCHA disable, account creation,
  coupon creation logic stays the same).
- Refactoring `apiClient.utils.ts`, `adminlogin.page.ts`, or other unrelated POMs.
- Switching to Playwright's `globalSetup` (a non-trivially different mechanism;
  rejected during brainstorming because the CAPTCHA step needs a real browser).
- Touching `base-tests/`. Per the project's override system, all changes live in
  `tests/` and root files. The npm release pipeline (`build.js`) re-publishes
  `tests/` as `base-tests/` on the next package release, so downstream installs
  will receive these changes automatically.

## Architecture

### Playwright config (`playwright.config.ts` and `playwright.config.example.ts`)

Both root config files gain:

1. **A new helper `getSetupFiles(baseDir, customDir)`** that mirrors the existing
   `getTestFiles()` but matches `*.setup.ts` instead of `*.spec.ts`. Override
   semantics are identical: `tests/init.setup.ts` overrides
   `base-tests/init.setup.ts`; new `*.setup.ts` files in `tests/` are added.

2. **A new `setup` project** at the top of `projects: [...]`:

   ```ts
   {
     name: 'setup',
     testMatch: setupFiles,
     use: {
       ...devices['Desktop Chrome'],
       userAgent: 'Playwright',
       trace: 'on',
     },
   }
   ```

   The `setup` project is **chromium-only by design**: the CAPTCHA-disable step
   only needs to run once per environment, and account/coupon creation goes
   through the API, so multi-browser parallelism would just be redundant work.
   `trace: 'on'` is enabled because setup failure blocks every other test —
   investigation should always have a trace.

3. **`dependencies: ['setup']`** added to each of the existing `chromium`,
   `firefox`, and `webkit` project blocks.

4. **`getTestFiles()` excludes any file named `setup.spec.ts`** from the browser
   projects' test list. This guard exists for two reasons: (a) in this dev repo,
   `base-tests/setup.spec.ts` still ships with the previous release's snapshot
   and would otherwise run as a normal test; (b) defensively, any user
   customization called `setup.spec.ts` is presumed to be legacy and should not
   be matched. A code comment in the helper documents this.

5. **The deprecated `setup` project comment**
   (`// { name: 'setup', testMatch: /.*\.setup\.ts/ }`) is removed — the real
   project replaces it.

### Setup file (`tests/init.setup.ts`)

`tests/init.setup.ts` is created by translating the existing
`tests/setup.spec.ts` to the new conventions. The file structure remains three
`test()` blocks (Playwright project-dependency setup files still use `test()`),
but with the following changes:

1. **No `@setup` tag** on any test. Tags were the gating mechanism for
   `--grep "@setup"`; with project dependencies that gating disappears. The
   `@api` tag stays on tests where it applied previously.

2. **No `test.skip(browserName !== 'chromium', …)` calls.** The `setup` project
   only ever runs with Desktop Chrome, so the skip guards are dead code.

3. **`test.describe.configure({ mode: 'serial' })` is retained**, but its
   purpose is repurposed and re-commented. The original justification was a
   workaround for the lack of project dependencies; that part is now obsolete.
   The remaining reason it must stay: API token requests (used by
   `Create_test_accounts` and `Set_coupon_codes`) hit Magento's admin token
   endpoint, which can be CAPTCHA-blocked on a fresh environment. The
   `Disable_login_captcha_and_enable_multiple_login` test must therefore
   complete before the two API tests run. The current `fullyParallel: true`
   setting at the config level would otherwise let the three tests race within
   the setup file. The comment in `init.setup.ts` is updated to reflect this
   reasoning.

4. **Coupon-creation rewrite** — instead of the test reading
   `MAGENTO_COUPON_CODE_${browserEngine}` and creating one browser-specific
   coupon, the test reads `inputValues.coupon.codes` (a `Record<string,
   string>` keyed by uppercase browser name) and loops through every entry,
   creating each missing code or activating each disabled one. The per-coupon
   create / find / activate logic is the same as today; only the iteration
   wrapper is new. The test no longer needs `requireEnv` or `getCouponCode()`,
   and it no longer takes a `browserName` parameter.

5. **Test names stay the same**
   (`Disable_login_captcha_and_enable_multiple_login`, `Create_test_accounts`,
   `Set_coupon_codes`) so the HTML report shows familiar labels under the new
   `setup` project group.

The legacy `tests/setup.spec.ts` is deleted. The browser projects no longer
match it (see exclusion rule above), so leaving it would only confuse readers.

### Coupon source (`tests/config/input-values.json`)

The `coupon` group gains a `codes` map:

```json
"coupon": {
  "couponCodeRuleName": "Test coupon",
  "couponType":         "Specific Coupon",
  "codes": {
    "CHROMIUM": "CHROMIUM321",
    "FIREFOX":  "FIREFOX321",
    "WEBKIT":   "WEBKIT321"
  }
}
```

Because `config/index.ts` deep-merges `tests/config/input-values.json` over
`base-tests/config/input-values.json`, this new key is available as
`inputValues.coupon.codes` at runtime even though the base file doesn't have
it.

Adding a new browser to the suite is a one-line config change: add an entry
keyed by the uppercase browser name. The setup loop picks it up automatically.

### Coupon consumers (`tests/checkout.spec.ts`, `tests/shoppingcart.spec.ts`)

Both files currently call
`requireEnv(\`MAGENTO_COUPON_CODE_${browserEngine}\`)` to look up the discount
code. Each call site is replaced by `inputValues.coupon.codes[browserEngine]`.
This is two lines in `tests/checkout.spec.ts` (lines 116 and 153 today) and
two lines in `tests/shoppingcart.spec.ts` (lines 108 and 121 today).

### Environment files (`.env`, `.env.example`)

Three lines are removed from each file:

```
MAGENTO_COUPON_CODE_CHROMIUM=...
MAGENTO_COUPON_CODE_FIREFOX=...
MAGENTO_COUPON_CODE_WEBKIT=...
```

### Install wizard (`install.js`)

The three coupon entries are removed from the `envVars` dictionary in
`Install`'s constructor (currently lines 53–55). New installs will no longer
prompt for them or write defaults.

### CI pipeline (`.gitlab-ci.yml`)

The two-stage `testing_suite` pipeline collapses to one stage:

1. The `create_testing_suite` job is **deleted entirely**. Its work runs
   automatically as a project dependency.
2. The `run_testing_suite` job's `script:` becomes:

   ```yaml
   script:
     - echo "Running test suite"
     - printf "elgentos\n" | npm install
     - CI=true npx playwright test --max-failures=1 --trace=retain-on-failure
   ```

   (No more `--grep-invert "@setup"`.) `--workers=1` is retained as today; the
   setup project is small enough that worker count for it doesn't matter, and
   the main suite already has reasons to run serially.

3. The `needs: [create_testing_suite]` and `dependencies: [create_testing_suite]`
   keys are removed from the (now sole) job.
4. Three lines are removed from `variables:` —
   `MAGENTO_COUPON_CODE_CHROMIUM`, `_FIREFOX`, `_WEBKIT`. The corresponding
   three `check_var MAGENTO_COUPON_CODE_*` lines are removed from
   `.debug-template`'s `before_script`.

The `mirror_to_github` and `test_mirror_pipeline` jobs are unchanged.

### Documentation (`README.md`, `AGENTS.md`)

`README.md`:

- The "🤖 Run setup… then you can run the suite!" section is reduced to a note
  that `npx playwright test` runs setup automatically; the separate
  `--grep "@setup"` step is removed.
- The `@setup` tag row in the tags/scenarios table is removed (or annotated as
  "internal — runs as project dependency"). The setup file row in the scenarios
  table is updated to reference `init.setup.ts`.
- A new short "Migrating from 6.x" section explains the breaking change for
  existing downstream installs (see "Migration" below).

`AGENTS.md`:

- The "CI/CD Pipeline" section is updated to describe one stage instead of two.
- "Critical Rules" #7 is updated to refer to `init.setup.ts` rather than
  `setup.spec.ts`.
- The example commands at the bottom of the same section are updated:
  `npx playwright test --grep "@setup"` and `npx playwright test --grep-invert
  "@setup"` are replaced by a single `npx playwright test`.

## Files Touched

**Add:**
- `tests/init.setup.ts`
- `docs/superpowers/specs/2026-04-29-setup-as-project-dependency-design.md` (this file)

**Modify (root):**
- `playwright.config.ts`
- `playwright.config.example.ts`
- `.env`
- `.env.example`
- `install.js`
- `.gitlab-ci.yml`
- `README.md`
- `AGENTS.md`
- `CHANGELOG.md` (breaking-change entry)

**Modify (`tests/`):**
- `tests/config/input-values.json`
- `tests/checkout.spec.ts`
- `tests/shoppingcart.spec.ts`

**Delete:**
- `tests/setup.spec.ts`

**Untouched (deliberately):**
- `base-tests/setup.spec.ts`, `base-tests/utils/env.utils.ts`,
  `base-tests/config/input-values.json`, `base-tests/checkout.spec.ts`,
  `base-tests/shoppingcart.spec.ts`. These become unreachable at runtime in this
  repo via overrides plus the `setup.spec.ts` exclusion. The next npm release
  regenerates downstream `base-tests/` from this dev repo's `tests/`, at which
  point downstream `base-tests/` no longer contains `setup.spec.ts` either.

## Migration (Breaking Change)

Existing downstream installs upgrading the npm package will receive the new
`base-tests/init.setup.ts`, but **`build.js` does not overwrite their
`playwright.config.ts`** (it uses `COPYFILE_EXCL` when copying example files).
Without action, their config has no `setup` project, `init.setup.ts` is never
matched, and setup never runs — leading to confusing test failures.

Migration steps for downstream users:

1. Open `playwright.config.example.ts` (refreshed by the new package). Copy
   into your own `playwright.config.ts`:
   - the `getSetupFiles()` helper
   - the `setup` project block
   - the `dependencies: ['setup']` line on each browser project
   - the `setup.spec.ts` exclusion in `getTestFiles()`
2. Add `coupon.codes` to your `tests/config/input-values.json` (or rely on the
   defaults inherited from `base-tests/config/input-values.json` once it has
   the key).
3. Remove the `MAGENTO_COUPON_CODE_*` lines from your `.env` (no longer used).
4. If you had a custom `tests/setup.spec.ts`, port its contents into a new
   `tests/init.setup.ts` (this `tests/`-side file overrides the base copy via
   the same mechanism that already governs spec overrides).

These steps go into the README's "Migrating from 6.x" section and into the
CHANGELOG breaking-change entry.

## Validation

After implementation, the following must hold:

1. `npx playwright test` (no flags) runs the `setup` project once with
   chromium, then runs all chromium / firefox / webkit specs that depend on it.
   The HTML report shows a `setup` project group containing three rows.
2. `npx playwright test --project=chromium login.spec.ts` automatically pulls
   in the `setup` project as a dependency (per Playwright's documented
   behavior).
3. The coupon-loop in `init.setup.ts` creates or activates one coupon per entry
   in `inputValues.coupon.codes`.
4. `tests/checkout.spec.ts` and `tests/shoppingcart.spec.ts` still pass with
   coupon codes sourced from `inputValues.coupon.codes` instead of
   environment variables.
5. The collapsed CI pipeline passes — `create_testing_suite` is gone, the
   single job runs setup-then-tests via project dependencies.
6. `npx playwright test --grep "@setup"` returns no tests (because the tag has
   been removed from `init.setup.ts`).

## Risks

- **Silent regression for existing installs** — biggest risk; mitigated by
  CHANGELOG breaking-change entry and README migration section.
- **`@setup` tag removal breaks user CI grep filters** — anyone with custom
  pipelines that use `--grep @setup` or `--grep-invert @setup` will need to
  update. Mitigated by changelog note.
- **`setup.spec.ts` exclusion masks future legitimate user file** — extremely
  unlikely but worth a code comment explaining the rationale.
- **A user's custom `tests/setup.spec.ts` becomes dead** after upgrade.
  Mitigated by explicit migration step #4.
