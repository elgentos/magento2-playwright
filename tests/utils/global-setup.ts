// @ts-check

import { expect, chromium, type FullConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import { UIReference } from '@config';
import { CONSENT_STATE_PATH, EMPTY_STATE } from '@fixtures/storage-state';
import { getHttpCredentials } from './env.utils';
import { getPlaywrightRequestConfig } from '../../playwrightRequestConfig';

// Hard cap on every consent-capture step. `toPass()` defaults to NO timeout, and
// globalSetup is not bound by the config `timeout`, so without this a banner that
// never renders would hang the whole job until the CI wall-clock limit.
const CONSENT_TIMEOUT_MS = 30_000;

/**
 * Captures the CMP "Reject all" cookies once before the suite runs and persists
 * them as a Playwright storageState seed. Both test objects in
 * `@utils/fixtures.utils` fold that seed into their storage state, so the
 * consent banner never intercepts a click during a test.
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
	fs.mkdirSync(path.dirname(CONSENT_STATE_PATH), { recursive: true });
	if (!fs.existsSync(CONSENT_STATE_PATH)) {
		fs.writeFileSync(CONSENT_STATE_PATH, JSON.stringify(EMPTY_STATE));
	}

	const { baseURL } = getPlaywrightRequestConfig(process.env.PLAYWRIGHT_BASE_URL);
	const httpCredentials = getHttpCredentials();

	const browser = await chromium.launch();
	const context = await browser.newContext({
		baseURL,
		httpCredentials,
		ignoreHTTPSErrors: true,
	});

	try {
		const page = await context.newPage();
		// The CMP is a third-party script and is often not parsed at
		// domcontentloaded, so wait for 'load' before looking for its banner.
		await page.goto('/', { waitUntil: 'load', timeout: CONSENT_TIMEOUT_MS });

		const heading = page.getByRole('heading', {
			name: UIReference.text.frontend.common.cookieConsentTitle,
		});
		const rejectButton = page.getByRole('button', {
			name: UIReference.text.shared.buttons.cookieReject,
		});

		// Wait for the banner to be fully rendered — both its heading and the
		// reject button must be visible before we interact, otherwise the click
		// can fire before the CMP has wired up its cookie handlers.
		await expect(async () => {
			await expect(heading).toBeVisible();
			await expect(rejectButton).toBeVisible();
		}).toPass({ timeout: CONSENT_TIMEOUT_MS });

		// Capped like every other step: Playwright's action timeout defaults to
		// unlimited (the config sets no `actionTimeout`), so an overlay that
		// intercepts the click would hang globalSetup until the CI wall clock.
		await rejectButton.click({ timeout: CONSENT_TIMEOUT_MS });

		// The CMP persists the decision asynchronously after the click. Wait for
		// the banner to actually be dismissed before snapshotting, otherwise
		// storageState() captures the context before the cookie is written.
		await expect(heading).toBeHidden({ timeout: CONSENT_TIMEOUT_MS });

		await context.storageState({ path: CONSENT_STATE_PATH });

		const cookies = await context.cookies();
		const cmpCookies = cookies.filter((c) => /cmp|consent|euconsent/i.test(c.name));
		console.log(
			`[global-setup] Wrote ${CONSENT_STATE_PATH} (${cookies.length} cookies, ` +
				`${cmpCookies.length} consent-related: ${cmpCookies.map((c) => c.name).join(', ') || 'none'})`,
		);
	} catch (error) {
		// Non-fatal: consent capture must never block the whole suite. If the
		// banner does not appear in time (different CMP, blocked third-party
		// script, changed labels, or an unreachable review env), log and fall
		// back to the empty state seeded above. Tests still run; the banner may
		// then surface during a test.
		const reason = error instanceof Error ? error.message : String(error);
		console.warn(
			`[global-setup] Consent capture skipped after ${CONSENT_TIMEOUT_MS}ms: ${reason.split('\n')[0]}. ` +
				`Falling back to ${CONSENT_STATE_PATH} without consent cookies.`,
		);
		if (!fs.existsSync(CONSENT_STATE_PATH)) {
			fs.writeFileSync(CONSENT_STATE_PATH, JSON.stringify(EMPTY_STATE));
		}
	} finally {
		await context.close();
		await browser.close();
	}
}
