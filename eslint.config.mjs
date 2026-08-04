import eslintJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

// eslint-plugin-playwright's default export is `{ ...plugin, configs }` (see its
// src/index.ts) — a spread copy distinct, by reference, from the `plugin` object
// embedded inside `playwright.configs['flat/recommended'].plugins.playwright`.
// Block 3 registers the plugin directly; block 4 extends `flat/recommended`,
// which also carries a `plugins.playwright` entry. Both blocks apply to
// tests/**/*.spec.ts, so ESLint's flat-config merge sees two different objects
// under the same "playwright" key and throws `Cannot redefine plugin
// "playwright"`. Sourcing block 3's plugin object from the same config avoids
// the collision without changing which rules apply where.
const playwrightPlugin = playwright.configs['flat/recommended'].plugins.playwright;

export default tseslint.config(
	// ---------------------------------------------------------------- ignores
	{
		ignores: [
			'base-tests/**', // generated from tests/ by build.js
			'node_modules/**',
			'playwright-report/**',
			'test-results/**',
			'.auth/**',
			'i18n/**',
			'docs/**',
			// No leading slash on this one either, for the same reason as
			// '*.config.ts' below: ESLint ignores are minimatch, not gitignore.
			// No effect today (no .ts files live here) — guards against a future
			// .superpowers/**/*.ts linting locally while CI (where this
			// directory doesn't ship) stays green.
			'.superpowers/**',
			// gitignored + machine-specific; see spec. No leading slash: ESLint's
			// `ignores` are plain minimatch globs matched against the relative
			// path (see @eslint/config-array's doMatch), not gitignore syntax —
			// a leading '/' would require the matched path to itself start with
			// '/', which relative paths never do, so it would silently stop
			// matching anything (verified: reintroduces the parsing errors this
			// ignore exists to prevent). Root-only is already what minimatch
			// gives a bare '*.config.ts': its `*` doesn't cross '/', so nested
			// paths like tests/foo.config.ts are unaffected either way.
			'*.config.ts',
		],
	},

	// ------------------------------------------------- block 1: typed TS
	// The typed presets are scoped INSIDE a files-restricted block via
	// `extends`. Do not hoist them to the top level: unrestricted, they
	// also apply to eslint.config.mjs, which is not in
	// tsconfig.eslint.json, and the parser then errors on its own config.
	{
		files: ['**/*.ts'],
		extends: [eslintJs.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.eslint.json'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			// Severity principle triage: the presets extended above mark all of
			// these 'error' by default. A full npm run lint pass found
			// pre-existing violations for each, so they're demoted to 'warn'
			// with the measured hit count. None of these were introduced or
			// fixed by this branch (re-verified after the eslint --fix pass and
			// its subsequent partial revert, below) — fixing them is a separate,
			// larger change, and for several (no-explicit-any,
			// no-unused-expressions, await-thenable) doing so touches
			// test/POM logic, which is out of scope here.
			'@typescript-eslint/no-unused-vars': 'warn', // 32 hits
			'@typescript-eslint/no-explicit-any': 'warn', // 18 hits
			'@typescript-eslint/require-await': 'warn', // 2 hits: poms/admin/customers, poms/frontend/shoppingcart
			'@typescript-eslint/no-unused-expressions': 'warn', // 4 hits: poms/frontend/{account,category,product x2}
			'@typescript-eslint/restrict-template-expressions': 'warn', // 2 hits: checkout.spec, poms/frontend/checkout
			'no-useless-escape': 'warn', // 2 hits: poms/frontend/mainmenu (both columns, same line)
			'@typescript-eslint/no-unnecessary-type-assertion': 'warn', // 1 hit: init.setup
			'no-useless-assignment': 'warn', // 1 hit: poms/admin/marketing
			// awaiting a Locator-returning (non-Promise) call inside .toPass();
			// same root pattern as block 3's no-useless-await, on the same 3
			// lines. Demoted rather than fixed for the same reason: removing the
			// await is exactly the change eslint --fix made and this branch had
			// to revert (see block 3), and injecting a real awaited action
			// would be a test-logic change, out of scope here.
			'@typescript-eslint/await-thenable': 'warn', // 3 hits: compare.spec, poms/admin/{customers,orders}
		},
	},

	// --------------------------------- block 2: CommonJS Node scripts
	{
		files: ['**/*.js'],
		extends: [eslintJs.configs.recommended],
		languageOptions: {
			sourceType: 'commonjs',
			globals: globals.node,
		},
		rules: {
			// Severity principle triage, same reasoning as block 1: both hits
			// pre-exist in translate-json.js and are outside this branch's scope.
			'no-unused-vars': 'warn', // 1 hit: translate-json.js
			'no-prototype-builtins': 'warn', // 1 hit: translate-json.js
		},
	},

	// ------------------- block 2b: this config file itself (ESM, .mjs)
	{
		files: ['**/*.mjs'],
		extends: [eslintJs.configs.recommended],
		languageOptions: {
			sourceType: 'module',
			globals: globals.node,
		},
	},

	// ------- block 4: test-structure rules, spec/setup files only
	// ORDERING INVARIANT — this block must stay ABOVE block 3, not below it.
	// `extends: [playwright.configs['flat/recommended']]` bakes in that preset's
	// own severities for ~30 rules (e.g. no-element-handle/no-wait-for-selector/
	// no-page-pause at 'warn', no-networkidle and prefer-web-first-assertions at
	// 'error'). ESLint's flat config resolves a rule key that two matching
	// blocks both set by letting the LATER block in the array win. Block 3's
	// `files` pattern (tests/**/*.ts) is a superset of this block's
	// (tests/**/*.spec.ts, tests/**/*.setup.ts), so for every spec/setup file
	// both blocks match — meaning whichever block is physically later in this
	// array wins for any rule key they both touch. Putting this block first
	// makes block 3's explicit, deliberately-chosen severities win uniformly
	// across all of tests/, including spec/setup files. Moving this block back
	// below block 3 would silently flip five rules' effective severity in
	// spec/setup files only (previously caught: no-element-handle,
	// no-wait-for-selector, no-page-pause going error->warn; no-networkidle and
	// prefer-web-first-assertions going warn->error) — do not do that.
	//
	// `extends` also pulls in flat/recommended's other rules at their own
	// baseline severity. Three had measured hits and are re-declared below with
	// counts (expect-expect, no-conditional-expect, prefer-hooks-on-top). Every
	// other flat/recommended rule not mentioned anywhere in this file (e.g.
	// no-standalone-expect, valid-title, valid-expect, no-duplicate-hooks,
	// prefer-locator) currently has 0 measured hits, so it's left at whatever
	// severity flat/recommended gives it — that's fine per the severity
	// principle since there's nothing to demote.
	{
		files: ['tests/**/*.spec.ts', 'tests/**/*.setup.ts'],
		extends: [playwright.configs['flat/recommended']],
		rules: {
			'playwright/no-focused-test': 'error', // 0 hits
			'playwright/no-conditional-in-test': 'warn', // 21 hits: account.spec x7, init.setup x5, setup.spec x4, checkout.spec x3, healthcheck.spec, register.spec
			// disallowFixme must be true, or this rule cannot see test.fixme()
			// calls at all regardless of severity (confirmed by reading
			// eslint-plugin-playwright's no-skipped-test source) — without it,
			// the rule only ever catches non-conditional test.skip(), and this
			// codebase has none, so it would report 0 hits despite 3 genuine
			// disabled tests existing. allowConditional keeps the codebase's
			// conditional test.skip(condition, message) calls (setup.spec x2,
			// healthcheck.spec, mainmenu.spec) exempt, matching intent.
			'playwright/no-skipped-test': ['warn', { allowConditional: true, disallowFixme: true }], // 3 hits: footer.spec, mainmenu.spec, search.spec
			'playwright/expect-expect': 'warn', // 50 hits: spread across nearly every spec file — see report for the full per-file breakdown
			'playwright/no-conditional-expect': 'warn', // 3 hits: account.spec
			'playwright/prefer-hooks-on-top': 'warn', // 1 hit: compare.spec
		},
	},

	// ------------------- block 3: flake rules across ALL of tests/
	// Positioned AFTER block 4 (see the ordering-invariant comment there) so
	// these explicit severities win uniformly across all of tests/, including
	// the *.spec.ts/*.setup.ts files block 4 also matches.
	{
		files: ['tests/**/*.ts'],
		plugins: { playwright: playwrightPlugin },
		rules: {
			'playwright/no-element-handle': 'error', // 0 hits
			'playwright/no-wait-for-selector': 'error', // 0 hits
			'playwright/no-wait-for-navigation': 'error', // 0 hits
			'playwright/no-page-pause': 'error', // 0 hits
			'playwright/missing-playwright-await': 'error', // 0 hits
			'playwright/no-wait-for-timeout': 'warn', // 5 hits: poms/frontend/checkout x2, poms/frontend/product, poms/admin/adminlogin, utils/magewire
			'playwright/no-networkidle': 'warn', // 4 hits: login.spec, poms/frontend/login, utils/fixtures x2
			'playwright/no-force-option': 'warn', // 2 hits: poms/admin/marketing, poms/frontend/mainmenu
			// brief assumed 0 hits for the following three (no trailing comment);
			// actual npm run lint run found violations, so per the severity
			// principle they're demoted to warn instead of left at error.
			'playwright/no-eval': 'warn', // 1 hit: poms/frontend/category
			'playwright/no-useless-await': 'warn', // 3 hits: poms/admin/{customers,orders}, compare.spec
			'playwright/prefer-web-first-assertions': 'warn', // 4 hits: poms/frontend/category, poms/frontend/minicart x2, poms/frontend/shoppingcart
		},
	},

	// ------------------------------ tests/: config imports are untyped
	{
		files: ['tests/**/*.ts'],
		rules: {
			// The deep merge of base-tests/config over tests/config cannot be
			// statically typed without changing the config loader (out of scope).
			// Disabled rather than left at warn: an unactionable warning trains
			// contributors to ignore lint output. The exemption covers the whole
			// no-unsafe-* family fed by that same untyped merge — the resulting
			// `any` flows into getByRole()-style arguments (no-unsafe-argument),
			// calls (no-unsafe-call), and returns (no-unsafe-return) alike.
			// Re-enabling any of these five requires typing the config loader,
			// which is out of scope for this branch.
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			// Actionable and worth fixing, but has pre-existing hits.
			'@typescript-eslint/no-floating-promises': 'warn', // 2 hits: poms/admin/customers, poms/frontend/compare
		},
	},

	// ---------------------------------------------- must stay last
	prettierConfig,
);
