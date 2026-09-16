// @ts-check

/**
 * Copyright elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileOverview Single owner of every storageState location the suite uses: the
 *               cookie-consent seed written by global-setup, and the per-worker
 *               authentication files written by the auth fixture. global-setup
 *               and fixtures.utils both resolve their paths from here, so a
 *               store that overrides only one of those two files cannot end up
 *               with a writer and a reader pointing at different directories.
 */

import fs from 'node:fs';
import path from 'node:path';

export type StorageStateCookie = {
	name: string;
	value: string;
	domain: string;
	path: string;
	expires: number;
	httpOnly: boolean;
	secure: boolean;
	sameSite: 'Strict' | 'Lax' | 'None';
};

export type StorageState = {
	cookies: StorageStateCookie[];
	/**
	 * Playwright's `storageState` option requires `localStorage` on every
	 * origins entry. We never emit one — the consent decision is a cookie, so
	 * this array is always empty — but the type has to match or
	 * `use(guestStorageState())` will not assign to the option.
	 */
	origins: { origin: string; localStorage: { name: string; value: string }[] }[];
};

/**
 * The shape actually found on disk: either field may be missing. `origins`
 * deliberately does NOT require `localStorage` here — only `.origin` is ever
 * read from it, and demanding the full Playwright shape would reject a seed
 * that is otherwise perfectly usable.
 */
export type PartialStorageState = {
	cookies?: StorageStateCookie[];
	origins?: { origin: string }[];
};

/**
 * Both layers sit exactly two levels below the project root
 * (base-tests/fixtures, tests/fixtures) — the same assumption
 * tests/config/index.ts:25 makes. Deriving the root from __dirname keeps these
 * paths identical no matter which layer the @fixtures alias resolved from.
 */
export const projectRoot = path.resolve(__dirname, '../..');
export const AUTH_DIR = path.join(projectRoot, '.auth');
export const CONSENT_STATE_PATH = path.join(AUTH_DIR, 'consentCookies.json');
export const EMPTY_STATE: StorageState = { cookies: [], origins: [] };

// Session cookies are volatile and regenerated per session; never reuse them.
const VOLATILE_COOKIE_NAMES = new Set(['PHPSESSID', 'mage-cache-sessid', 'form_key']);

/**
 * Where a worker keeps its authenticated state. Scoped per project *and* per
 * parallel index: `project.outputDir` is configured once at config level, so
 * deriving the path from it made chromium, firefox and webkit share one file
 * (and therefore one Magento account) per index. It also lives outside
 * `test-results/`, which Playwright clears at the start of every run.
 */
export function workerAuthStatePath(projectName: string, parallelIndex: number): string {
	return path.join(AUTH_DIR, projectName, `worker_${parallelIndex}.json`);
}

/**
 * Keeps the persistent, first-party consent cookies and drops everything else.
 *
 * The consent decision is stored as a cookie, not in localStorage, so
 * `storageState().origins` is normally empty and cannot tell us the first-party
 * host. Derive it from the base URL, falling back to an origins entry.
 */
export function filterConsentCookies(
	state: PartialStorageState,
	baseUrl: string | undefined,
): StorageStateCookie[] {
	let firstPartyHost = '';

	for (const candidate of [baseUrl, state.origins?.[0]?.origin]) {
		if (!candidate) {
			continue;
		}
		try {
			firstPartyHost = new URL(candidate).hostname;
			break;
		} catch {
			// Not a usable URL — try the next candidate.
		}
	}

	if (firstPartyHost === '') {
		return [];
	}

	return (state.cookies ?? []).filter((cookie) => {
		if (VOLATILE_COOKIE_NAMES.has(cookie.name) || typeof cookie.domain !== 'string') {
			return false;
		}

		/**
		 * A cookie is ours when its domain IS the storefront host, or is a parent
		 * of it — CMPs commonly set the decision on the registrable domain
		 * (`.example.com` for `shop.example.com`). A bare
		 * `strippedDomain.endsWith(firstPartyHost)` gets this wrong in both
		 * directions: it drops that parent-domain cookie, and it keeps an
		 * unrelated `evilexample.com` when the host is `example.com`.
		 */
		const domain = cookie.domain.replace(/^\./, '');
		return domain === firstPartyHost || firstPartyHost.endsWith(`.${domain}`);
	});
}

/**
 * Reads the seed defensively. This module is imported during Playwright's
 * test-collection phase, which runs BEFORE globalSetup, so on a clean checkout
 * the file does not exist yet. It can also exist but be empty or half-written
 * (a leftover file, or a snapshot interrupted mid-write). Every one of those
 * degrades to an empty state rather than throwing and killing collection.
 */
export function readConsentState(filePath: string = CONSENT_STATE_PATH): PartialStorageState {
	if (!fs.existsSync(filePath)) {
		return { cookies: [], origins: [] };
	}

	const contents = fs.readFileSync(filePath, 'utf8').trim();
	if (!contents) {
		return { cookies: [], origins: [] };
	}

	try {
		return JSON.parse(contents) as PartialStorageState;
	} catch {
		return { cookies: [], origins: [] };
	}
}

let cachedConsentCookies: StorageStateCookie[] | null = null;

/**
 * Lazily load + memoize. The first call always happens inside a fixture (test
 * or worker execution), which is AFTER globalSetup has written the seed — so
 * the cached value holds the real consent cookies, never the collection-phase
 * empty list. This keeps all filesystem access out of module import.
 */
export function getConsentCookies(): StorageStateCookie[] {
	if (cachedConsentCookies === null) {
		cachedConsentCookies = filterConsentCookies(
			readConsentState(),
			process.env.PLAYWRIGHT_BASE_URL,
		);

		// A zero-cookie result is expected once, right after a fresh checkout —
		// but a *missing* seed file specifically means globalSetup never ran
		// (not "ran and found no cookies"), most likely because it isn't
		// registered in playwright.config.ts. Warn once per worker so that
		// misconfiguration is visible instead of silently running every test
		// without a consent decision.
		if (cachedConsentCookies.length === 0 && !fs.existsSync(CONSENT_STATE_PATH)) {
			console.warn(
				`[storage-state] No consent seed at ${CONSENT_STATE_PATH}. Is globalSetup ` +
					`registered in playwright.config.ts? Tests will run without a consent ` +
					`decision and the CMP banner may intercept clicks.`,
			);
		}
	}
	return cachedConsentCookies;
}

/** Drops the memo. Only needed by the tests for this module. */
export function resetConsentCookieCache(): void {
	cachedConsentCookies = null;
}

/**
 * Storage state for an unauthenticated visitor: the consent decision, nothing
 * else. Call this inside a fixture, never at module level.
 */
export function guestStorageState(): StorageState {
	return { cookies: getConsentCookies(), origins: [] };
}
