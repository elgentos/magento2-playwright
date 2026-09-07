// @ts-check

/**
 * Copyright elgentos. All rights reserved.
 * https://elgentos.nl/
 *
 * @fileOverview Unit-level checks for the storage-state helpers. These are pure
 *               assertions — no `page` fixture is requested, so no browser is
 *               launched and the file costs milliseconds per project.
 */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
	CONSENT_STATE_PATH,
	filterConsentCookies,
	guestStorageState,
	readConsentState,
	resetConsentCookieCache,
	workerAuthStatePath,
} from '@fixtures/storage-state';

const cookie = (name: string, domain: string) => ({
	name,
	value: 'x',
	domain,
	path: '/',
	expires: -1,
	httpOnly: false,
	secure: true,
	sameSite: 'Lax' as const,
});

test.describe('filterConsentCookies', () => {
	test('drops volatile session cookies', () => {
		const cookies = filterConsentCookies(
			{
				cookies: [
					cookie('CookieConsent', 'shop.example.com'),
					cookie('PHPSESSID', 'shop.example.com'),
					cookie('mage-cache-sessid', 'shop.example.com'),
					cookie('form_key', 'shop.example.com'),
				],
			},
			'https://shop.example.com/',
		);

		expect(cookies.map((c) => c.name)).toEqual(['CookieConsent']);
	});

	test('drops third-party cookies and keeps leading-dot first-party domains', () => {
		const cookies = filterConsentCookies(
			{
				cookies: [
					cookie('cmpconsent', '.shop.example.com'),
					cookie('_ga', '.google-analytics.com'),
				],
			},
			'https://shop.example.com/',
		);

		expect(cookies.map((c) => c.name)).toEqual(['cmpconsent']);
	});

	test('keeps a consent cookie set on the parent domain', () => {
		const cookies = filterConsentCookies(
			{ cookies: [cookie('CookieConsent', '.example.com')] },
			'https://shop.example.com/',
		);

		expect(cookies.map((c) => c.name)).toEqual(['CookieConsent']);
	});

	test('drops a domain that merely shares a suffix with the host', () => {
		const cookies = filterConsentCookies(
			{ cookies: [cookie('CookieConsent', 'evilexample.com')] },
			'https://example.com/',
		);

		expect(cookies).toEqual([]);
	});

	test('returns no cookies when the first-party host cannot be derived', () => {
		const cookies = filterConsentCookies(
			{ cookies: [cookie('CookieConsent', 'shop.example.com')] },
			undefined,
		);

		expect(cookies).toEqual([]);
	});

	test('falls back to the origins entry when no base URL is given', () => {
		const cookies = filterConsentCookies(
			{
				cookies: [cookie('CookieConsent', 'shop.example.com')],
				origins: [{ origin: 'https://shop.example.com' }],
			},
			undefined,
		);

		expect(cookies.map((c) => c.name)).toEqual(['CookieConsent']);
	});
});

test.describe('readConsentState', () => {
	test('degrades to an empty state for missing, empty and malformed seeds', () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'consent-seed-'));

		const missing = path.join(dir, 'missing.json');
		const empty = path.join(dir, 'empty.json');
		const malformed = path.join(dir, 'malformed.json');
		fs.writeFileSync(empty, '   ');
		fs.writeFileSync(malformed, '{"cookies": [');

		expect(readConsentState(missing)).toEqual({ cookies: [], origins: [] });
		expect(readConsentState(empty)).toEqual({ cookies: [], origins: [] });
		expect(readConsentState(malformed)).toEqual({ cookies: [], origins: [] });

		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('reads a well-formed seed', () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'consent-seed-'));
		const file = path.join(dir, 'seed.json');
		fs.writeFileSync(
			file,
			JSON.stringify({ cookies: [cookie('CookieConsent', 'shop.example.com')], origins: [] }),
		);

		expect(readConsentState(file).cookies).toHaveLength(1);

		fs.rmSync(dir, { recursive: true, force: true });
	});
});

test.describe('paths', () => {
	test('the consent seed and the worker states share one .auth directory', () => {
		const authDir = path.dirname(CONSENT_STATE_PATH);

		expect(path.basename(authDir)).toBe('.auth');
		expect(workerAuthStatePath('chromium', 3)).toBe(
			path.join(authDir, 'chromium', 'worker_3.json'),
		);
	});

	test('worker states are scoped per project so browsers cannot collide', () => {
		expect(workerAuthStatePath('firefox', 0)).not.toBe(workerAuthStatePath('webkit', 0));
	});

	test('guestStorageState carries the consent cookies and no origins', () => {
		resetConsentCookieCache();
		const state = guestStorageState();

		expect(Array.isArray(state.cookies)).toBe(true);
		expect(state.origins).toEqual([]);
	});
});
