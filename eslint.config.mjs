import eslintJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

// Reuse the preset's plugin instance to avoid redefining it in overlapping blocks.
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
			'.superpowers/**',
			// Root-level generated, machine-specific configuration.
			'*.config.ts',
		],
	},

	// ---------------------------------------------------------- typed TypeScript
	// Scope typed presets to files included by tsconfig.eslint.json.
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
			// Existing violations remain warnings; CI prevents the total from increasing.
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/require-await': 'warn',
			'@typescript-eslint/no-unused-expressions': 'warn',
			'@typescript-eslint/restrict-template-expressions': 'warn',
			'no-useless-escape': 'warn',
			'@typescript-eslint/no-unnecessary-type-assertion': 'warn',
			'no-useless-assignment': 'warn',
			// These awaits occur inside retry callbacks and require separate test-logic changes.
			'@typescript-eslint/await-thenable': 'warn',
		},
	},

	// ------------------------------------------------ CommonJS Node scripts
	{
		files: ['**/*.js'],
		extends: [eslintJs.configs.recommended],
		languageOptions: {
			sourceType: 'commonjs',
			globals: globals.node,
		},
		rules: {
			// Existing translate-json.js violations.
			'no-unused-vars': 'warn',
			'no-prototype-builtins': 'warn',
		},
	},

	// -------------------------------------------------------- ESM tooling
	{
		files: ['**/*.mjs'],
		extends: [eslintJs.configs.recommended],
		languageOptions: {
			sourceType: 'module',
			globals: globals.node,
		},
	},

	// -------------------------------- test structure, spec/setup files only
	// Keep this above the all-test block so its explicit severities override the preset
	// consistently for every file under tests/.
	{
		files: ['tests/**/*.spec.ts', 'tests/**/*.setup.ts'],
		extends: [playwright.configs['flat/recommended']],
		settings: {
			// account.spec.ts and checkout.spec.ts use the `guestTest` fixture object
			// (from @utils/fixtures.utils) directly, without aliasing it to `test`.
			// Without this, the plugin doesn't recognise `guestTest.describe(...)` /
			// `guestTest(...)` as test-defining calls, and flags every `expect()`
			// inside them as a standalone expect outside a test block.
			playwright: { globalAliases: { test: ['guestTest'] } },
		},
		rules: {
			'playwright/no-focused-test': 'error',
			'playwright/no-conditional-in-test': 'warn',
			// Permit capability skips while reporting permanently disabled tests.
			'playwright/no-skipped-test': ['warn', { allowConditional: true, disallowFixme: true }],
			'playwright/expect-expect': 'warn',
			'playwright/no-conditional-expect': 'warn',
			'playwright/prefer-hooks-on-top': 'warn',
		},
	},

	// -------------------------------------------------- all test files
	{
		files: ['tests/**/*.ts'],
		plugins: { playwright: playwrightPlugin },
		rules: {
			'playwright/no-element-handle': 'error',
			'playwright/no-wait-for-selector': 'error',
			'playwright/no-wait-for-navigation': 'error',
			'playwright/no-page-pause': 'error',
			'playwright/missing-playwright-await': 'error',
			'playwright/no-wait-for-timeout': 'warn',
			'playwright/no-networkidle': 'warn',
			'playwright/no-force-option': 'warn',
			'playwright/no-eval': 'warn',
			'playwright/no-useless-await': 'warn',
			'playwright/prefer-web-first-assertions': 'warn',
		},
	},

	// --------------------------------------------- untyped config imports
	{
		files: ['tests/**/*.ts'],
		rules: {
			// The runtime config deep merge is intentionally untyped. Re-enable these
			// rules after the loader exposes a typed result.
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			// Actionable and worth fixing, but has pre-existing violations.
			'@typescript-eslint/no-floating-promises': 'warn',
		},
	},

	// ---------------------------------------------- must stay last
	prettierConfig,
);
