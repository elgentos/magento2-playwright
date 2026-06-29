// @ts-check

import { chromium, type FullConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import { UIReference } from '@config';
import { getHttpCredentials } from './env.utils';
import { getPlaywrightRequestConfig } from '../../playwrightRequestConfig';

const STORAGE_PATH = path.resolve(__dirname, '.auth/consentCookies.json');
const EMPTY_STATE = { cookies: [], origins: [] };

/**
 * Captures the consentmanager.net "Reject all" cookies once before the test
 * suite runs and persists them as a Playwright storageState file. Tests
 * referencing this file via `use.storageState` skip the consent modal entirely.
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
    fs.mkdirSync(path.dirname(STORAGE_PATH), { recursive: true });
    if (!fs.existsSync(STORAGE_PATH)) {
        fs.writeFileSync(STORAGE_PATH, JSON.stringify(EMPTY_STATE));
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
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const heading = page.getByRole('heading', { name: UIReference.titles.cookieConsentHeading });
        const appeared = await heading.isVisible({ timeout: 15_000 }).catch(() => false);

        if (appeared) {
            await page.getByRole('button', { name: UIReference.general.cookieRejectButtonLabel }).click();
            await heading.waitFor({ state: 'hidden', timeout: 10_000 });
        } else {
            console.warn('[global-setup] Consent modal did not appear within 15s — saving current state anyway.');
        }

        await context.storageState({ path: STORAGE_PATH });

        const cookies = await context.cookies();
        const cmpCookies = cookies.filter((c) => /cmp|consent|euconsent/i.test(c.name));
        console.log(
            `[global-setup] Wrote ${STORAGE_PATH} (${cookies.length} cookies, ` +
            `${cmpCookies.length} consent-related: ${cmpCookies.map((c) => c.name).join(', ') || 'none'})`,
        );
    } finally {
        await context.close();
        await browser.close();
    }
}
