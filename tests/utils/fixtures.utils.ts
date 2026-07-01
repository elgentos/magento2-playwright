// @ts-check

/**
 * Copyright elgentos. All rights reserved.
 * https://elgentos.nl/
 * @fileOverview override the StorageState fixture to ensure we can create accounts per worker
 */

import { test as baseTest, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {requireEnv, getHttpCredentials} from "@utils/env.utils";
import {slugs, UIReference} from "@config";
import { slugToRegex } from '@utils/url.utils';

export * from '@playwright/test';
export const test = baseTest.extend<{ _authGuard: void }, { workerStorageState: string }>({
	// Use the same storage state for all tests in this worker.
	storageState: ({ workerStorageState }, use) => use(workerStorageState),

	/**
	 * Auto-fixture: verifies the worker's stored auth is still valid for the
	 * current test and re-authenticates inline if not. Catches sessions that
	 * expired or rotated between fixture init and this test running.
	 *
	 * Skipped for tests that opt out of auth via
	 *   test.use({ storageState: { cookies: [], origins: [] } })
	 */
	_authGuard: [async ({ page, storageState }, use) => {
		const expectedPath = path.resolve(
			test.info().project.outputDir,
			`.auth/${test.info().parallelIndex}.json`,
		);

		if (typeof storageState === 'string' && storageState === expectedPath) {
			const isLoggedIn = await page.request
				.get('/customer/section/load?sections=customer')
				.then(r => r.ok() ? r.json() : null)
				.then((j: any) => !!(j?.customer?.firstname))
				.catch(() => false);

			if (!isLoggedIn) {
				const projectName = test.info().project.name;
				const id = test.info().parallelIndex;
				const username = `playwright+${id}@elgentos.nl`;
				const password = requireEnv('MAGENTO_EXISTING_ACCOUNT_PASSWORD');

				await page.goto(slugs.account.loginSlug, { waitUntil: 'load' });
				await page.getByRole('textbox', { name: UIReference.credentials.emailFieldLabel, exact: true }).fill(username);
				await page.getByRole('textbox', { name: UIReference.credentials.passwordFieldLabel }).fill(password);
				await page.getByRole('button', { name: UIReference.credentials.loginButtonLabel }).click();
				await page.waitForURL(slugToRegex(slugs.account.accountOverviewSlug), { waitUntil: 'networkidle' });

				// Refresh the worker auth file so later tests in this worker skip the re-login.
				await page.context().storageState({ path: storageState });
			}
		}

		await use();
	}, { auto: true }],

	// Authenticate once per worker with a worker-scoped fixture.
	workerStorageState: [async ({ browser }, use) => {
		// Scope auth state per (project, parallelIndex) so chromium/firefox/webkit
		// workers don't collide on the same file or the same Magento account.
		const id = test.info().parallelIndex;
		const projectName = test.info().project.name;
		const fileName = path.resolve(test.info().project.outputDir, `.auth/${id}.json`);

		// Check if the user is actually logged in
		const userIsLoggedIn = async (storageState?: string): Promise<boolean> => {
			const context = await browser.newContext({
				baseURL: requireEnv('PLAYWRIGHT_BASE_URL'),
				storageState,
				ignoreHTTPSErrors: true,
				httpCredentials: getHttpCredentials(),
			});

			const page = await context.newPage();
			await page.goto(slugs.account.accountOverviewSlug, { waitUntil: 'domcontentloaded' });

			const loggedIn =
				!page.url().includes(slugs.account.loginSlug);

			await context.close();
			// console.log(`Is user considered logged in? ${loggedIn}`);
			return loggedIn;
		}

		// If storage file exists *and* user is considered logged in, you can use!
		if (fs.existsSync(fileName) && await userIsLoggedIn(fileName)) {
			// console.log(`authentication file exists, and user is considered logged in!`);
			await use(fileName);
			return;
		}

		// Important: make sure we authenticate in a clean environment by unsetting storage state.
		const page = await browser.newPage({
			storageState: undefined,
			baseURL: requireEnv(`PLAYWRIGHT_BASE_URL`),
			ignoreHTTPSErrors: true,
			httpCredentials: getHttpCredentials(),
		});

		// Acquire a unique account, for example create a new one.
		// Alternatively, you can have a list of pre-created accounts for testing.
		// Make sure that accounts are unique, so that multiple team members
		// can run tests at the same time without interference.
		const account = {
			'username': `playwright+${id}@elgentos.nl`,
			'password': requireEnv(`MAGENTO_EXISTING_ACCOUNT_PASSWORD`)
		};

		const emailField = page.getByRole('textbox', {name: UIReference.credentials.emailFieldLabel, exact: true});
		const pwField = page.getByRole('textbox', {name: UIReference.credentials.passwordFieldLabel});
		const loginButton = page.getByRole('button', { name: UIReference.credentials.loginButtonLabel });

		// Perform authentication steps. Replace these actions with your own.
		await page.goto(slugs.account.loginSlug, {waitUntil: 'load'});
		await emailField.waitFor();

		await emailField.fill(account.username);
		await pwField.fill(account.password);
		await loginButton.click();

		// Wait until the page receives the cookies.
		// We do this by waiting for the page to be done loading. This should navigate to the customer account page.
		await page.waitForURL(slugToRegex(slugs.account.accountOverviewSlug), {waitUntil: 'networkidle'});

		// Confirm by checking page.url() returns https://hyva-demo.magento2.localhost/default/customer/account/
		// console.log(page.url());

		await expect(async () => {
			await expect(
				page.locator(UIReference.general.headingOneLocator),
				`Homepage has the expected text in title`
			).toContainText(UIReference.titles.accountHeading);
		}).toPass();

		// End of authentication steps.

		fs.mkdirSync(path.dirname(fileName), { recursive: true });
		await page.context().storageState({ path: fileName });
		await page.close();
		console.log(`${fileName} has been newly built.`);
		await use(fileName);
	}, { scope: 'worker' }],
});
