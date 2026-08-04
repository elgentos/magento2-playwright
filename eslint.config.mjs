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
			'*.config.ts', // gitignored + machine-specific; see spec
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
			// fixed by this branch — fixing them is a separate, larger change,
			// and for several (no-explicit-any, no-unused-expressions) doing so
			// touches test/POM logic, which is out of scope here.
			'@typescript-eslint/no-unused-vars': 'warn', // 32 hits
			'@typescript-eslint/no-explicit-any': 'warn', // 18 hits
			'@typescript-eslint/require-await': 'warn', // 4 hits: poms/admin/{customers x2,orders}, poms/frontend/shoppingcart
			'@typescript-eslint/no-unused-expressions': 'warn', // 4 hits: poms/frontend/{account,category,product x2}
			'@typescript-eslint/restrict-template-expressions': 'warn', // 2 hits: checkout.spec, poms/frontend/checkout
			'no-useless-escape': 'warn', // 2 hits: poms/frontend/mainmenu:237
			'@typescript-eslint/no-unnecessary-type-assertion': 'warn', // 1 hit: init.setup:180
			'no-useless-assignment': 'warn', // 1 hit: poms/admin/marketing:27
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
			'no-unused-vars': 'warn', // 1 hit: translate-json.js:132
			'no-prototype-builtins': 'warn', // 1 hit: translate-json.js:150
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

	// ------------------- block 3: flake rules across ALL of tests/
	{
		files: ['tests/**/*.ts'],
		plugins: { playwright: playwrightPlugin },
		rules: {
			'playwright/no-element-handle': 'error', // 0 hits
			'playwright/no-wait-for-selector': 'error', // 0 hits
			'playwright/no-wait-for-navigation': 'error', // 0 hits
			'playwright/no-page-pause': 'error', // 0 hits
			'playwright/missing-playwright-await': 'error', // 0 hits
			'playwright/no-wait-for-timeout': 'warn', // 5 hits: poms/frontend/{product,checkout}, poms/admin/adminlogin, utils/magewire
			'playwright/no-networkidle': 'warn', // 4 hits: login.spec, poms/frontend/login, utils/fixtures x2
			'playwright/no-force-option': 'warn', // 2 hits: poms/admin/marketing:111, poms/frontend/mainmenu:213
			// brief assumed 0 hits for the following three (no trailing comment);
			// actual npm run lint run found violations, so per the severity
			// principle they're demoted to warn instead of left at error.
			'playwright/no-eval': 'warn', // 1 hit: poms/frontend/category:123
			'playwright/no-useless-await': 'warn', // 3 hits: poms/admin/{customers,orders}, compare.spec
			'playwright/prefer-web-first-assertions': 'warn', // 4 hits: poms/frontend/category, poms/frontend/minicart x2, poms/frontend/shoppingcart
		},
	},

	// ------- block 4: test-structure rules, spec/setup files only
	{
		files: ['tests/**/*.spec.ts', 'tests/**/*.setup.ts'],
		extends: [playwright.configs['flat/recommended']],
		rules: {
			'playwright/no-focused-test': 'error', // 0 hits
			'playwright/no-conditional-in-test': 'warn', // 21 hits: account.spec x7, init.setup x5, setup.spec x4, checkout.spec x3, healthcheck.spec, register.spec
			'playwright/no-skipped-test': ['warn', { allowConditional: true }], // 3 hits: test.fixme markers
			// flat/recommended (extended above) sets no-networkidle to 'error',
			// which otherwise wins over block 3's 'warn' for the *.spec.ts/*.setup.ts
			// subset (login.spec.ts:32 is one of the 4 hits noted in block 3).
			// Re-declared here so the severity is consistent across all of tests/.
			'playwright/no-networkidle': 'warn',
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
			'@typescript-eslint/no-floating-promises': 'warn',
		},
	},

	// ---------------------------------------------- must stay last
	prettierConfig,
);
