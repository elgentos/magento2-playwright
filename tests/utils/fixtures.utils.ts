// @ts-check

/**
 * Copyright elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileOverview Two test objects share one storage-state story.
 *
 *   test      - authenticated: one Magento account per (project, worker), with
 *               the cookie-consent decision folded into the same state.
 *   guestTest - unauthenticated: the consent decision and nothing else.
 *
 * Playwright accepts `storageState` from exactly one source, which is why the
 * consent seed captured by global-setup has to be merged INTO each state rather
 * than applied beside it. The split into two objects (rather than one object
 * with a switch) is deliberate: Playwright sets up every fixture a test
 * destructures before the body runs, so a single object whose storageState
 * depends on `workerStorageState` would force a login even for guest tests.
 */

import { test as baseTest, expect, type BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import { requireEnv, getHttpCredentials, getConsentCmpHost } from '@utils/env.utils';
import { slugs, UIReference } from '@config';
import { slugToRegex } from '@utils/url.utils';
import { getConsentCookies, guestStorageState, workerAuthStatePath } from '@fixtures/storage-state';

export * from '@playwright/test';

/**
 * Defence in depth for contexts this module builds itself: global-setup
 * deliberately degrades to an empty seed when consent capture fails, which
 * would put the banner back in front of the login button. The CMP plays no part
 * in building an auth session, so keep it out of the context entirely — the
 * banner then cannot render regardless of the seed's state. No-op unless
 * COOKIE_CONSENT_CMP_HOST is set.
 */
async function blockConsentManager(context: BrowserContext): Promise<void> {
	const host = getConsentCmpHost();
	if (!host) {
		return;
	}
	const escaped = host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	await context.route(new RegExp(escaped), (route) => route.abort());
}

/**
 * Guest (unauthenticated) test object. Its storageState carries only the
 * consent cookies and has NO dependency on workerStorageState, so requesting it
 * never triggers the login fixture. Guest specs import it as `test`
 * (`import { guestTest as test, expect } from '@utils/fixtures.utils'`); files
 * that mix both use `guestTest.describe(...)` for the logged-out group.
 */
export const guestTest = baseTest.extend({
	// Resolved here, at test-execution time — after globalSetup wrote the seed.
	// Empty destructuring is how Playwright detects this fixture has no
	// dependencies (see file header) — it is not an unused-pattern mistake.
	// eslint-disable-next-line no-empty-pattern
	storageState: async ({}, use) => use(guestStorageState()),
});

/** Authenticated test object (the default for specs that need a session). */
export const test = baseTest.extend<{ _authGuard: void }, { workerStorageState: string }>({
	// Use the same storage state for all tests in this worker.
	storageState: ({ workerStorageState }, use) => use(workerStorageState),

	/**
	 * Auto-fixture: verifies the worker's stored auth is still valid for the
	 * current test and re-authenticates inline if not. Catches sessions that
	 * expired or rotated between fixture init and this test running.
	 *
	 * Skipped for guest tests, whose storageState is an object rather than the
	 * worker's file path.
	 */
	_authGuard: [
		async ({ page, storageState }, use) => {
			const expectedPath = workerAuthStatePath(
				test.info().project.name,
				test.info().parallelIndex,
			);

			if (typeof storageState === 'string' && storageState === expectedPath) {
				const isLoggedIn = await page.request
					.get('/customer/section/load?sections=customer')
					.then((r) => (r.ok() ? r.json() : null))
					.then(
						(j: { customer?: { firstname?: string } } | null) =>
							!!j?.customer?.firstname,
					)
					.catch(() => false);

				if (!isLoggedIn) {
					const id = test.info().parallelIndex;
					const username = `playwright+${id}@elgentos.nl`;
					const password = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');

					await page.goto(slugs.frontend.account.login, { waitUntil: 'load' });
					await page
						.getByRole('textbox', {
							name: UIReference.text.shared.forms.email,
							exact: true,
						})
						.fill(username);
					await page
						.getByRole('textbox', { name: UIReference.text.shared.forms.password })
						.fill(password);
					await page
						.getByRole('button', { name: UIReference.text.shared.buttons.login })
						.click();
					await page.waitForURL(slugToRegex(slugs.frontend.account.overview, true));

					// Keep the consent decision in the refreshed file: this context
					// inherited it from the worker state, but re-seed explicitly so a
					// file written here is never the one that loses it.
					await page.context().addCookies(getConsentCookies());
					await page.context().storageState({ path: storageState });
				}
			}

			await use();
		},
		{ auto: true },
	],

	// Authenticate once per worker with a worker-scoped fixture.
	workerStorageState: [
		async ({ browser }, use) => {
			const id = test.info().parallelIndex;
			const fileName = workerAuthStatePath(test.info().project.name, id);

			// Check if the user is actually logged in
			const userIsLoggedIn = async (storageState?: string): Promise<boolean> => {
				const context = await browser.newContext({
					baseURL: requireEnv('PLAYWRIGHT_BASE_URL'),
					storageState,
					ignoreHTTPSErrors: true,
					httpCredentials: getHttpCredentials(),
				});

				const page = await context.newPage();
				await page.goto(slugs.frontend.account.overview, {
					waitUntil: 'domcontentloaded',
				});

				const loggedIn = !page.url().includes(slugs.frontend.account.login);

				await context.close();
				return loggedIn;
			};

			/**
			 * A cached auth file is only safe to reuse if it still carries the
			 * consent cookies. A file built by an older run (or before the seed
			 * existed) lacks them, which lets the banner intercept clicks in every
			 * test of this worker. Rebuild instead of trusting the file.
			 */
			const fileHasConsentCookies = (storageFile: string): boolean => {
				try {
					const saved = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
					const savedNames = new Set(
						(saved.cookies ?? []).map((c: { name: string }) => c.name),
					);
					return getConsentCookies().every((c) => savedNames.has(c.name));
				} catch {
					return false;
				}
			};

			if (
				fs.existsSync(fileName) &&
				fileHasConsentCookies(fileName) &&
				(await userIsLoggedIn(fileName))
			) {
				await use(fileName);
				return;
			}

			/**
			 * Authenticate in a context free of *session* state — but NOT free of
			 * the consent decision. With `storageState: undefined` the context
			 * starts with zero cookies, the CMP dialog renders on the login page,
			 * and its overlay swallows the click on the login button, failing every
			 * authenticated test in the worker.
			 */
			const context = await browser.newContext({
				storageState: { cookies: getConsentCookies(), origins: [] },
				baseURL: requireEnv(`PLAYWRIGHT_BASE_URL`),
				ignoreHTTPSErrors: true,
				httpCredentials: getHttpCredentials(),
			});
			await blockConsentManager(context);

			const page = await context.newPage();

			// One pre-provisioned account per parallel index; init.setup.ts creates
			// them (playwright+0@ … playwright+12@) through the Magento API.
			const account = {
				username: `playwright+${id}@elgentos.nl`,
				password: requireEnv(`MAGENTO_EXISTING_ACCOUNT_PASSWORD`),
			};

			const emailField = page.getByRole('textbox', {
				name: UIReference.text.shared.forms.email,
				exact: true,
			});
			const pwField = page.getByRole('textbox', {
				name: UIReference.text.shared.forms.password,
			});
			const loginButton = page.getByRole('button', {
				name: UIReference.text.shared.buttons.login,
			});

			await page.goto(slugs.frontend.account.login, { waitUntil: 'load' });
			await emailField.waitFor();

			await emailField.fill(account.username);
			await pwField.fill(account.password);
			await loginButton.click();

			// Anchored: '/customer/account/' is a prefix of
			// '/customer/account/login/', so an unanchored pattern matches while we
			// are still on the login page and resolves instantly on a REJECTED
			// login. slugToRegex's second argument appends '$'.
			await page.waitForURL(slugToRegex(slugs.frontend.account.overview, true));

			await expect(async () => {
				await expect(
					page.locator(UIReference.selectors.shared.pageTitle),
					`Account page has the expected title`,
				).toContainText(UIReference.text.frontend.account.title);
			}).toPass();

			// Seed the consent decision into the saved state as well, so it is
			// present for every test that reuses this file.
			await page.context().addCookies(getConsentCookies());
			fs.mkdirSync(path.dirname(fileName), { recursive: true });
			await page.context().storageState({ path: fileName });
			console.log(`${fileName} has been newly built.`);
			await context.close();

			await use(fileName);
		},
		{ scope: 'worker' },
	],
});
