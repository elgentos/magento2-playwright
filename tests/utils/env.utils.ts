// @ts-check

import dotenv from 'dotenv';
import fs from 'node:fs';

/**
 * Loads .env into process.env, treating an empty string as "not set".
 *
 * dotenv.config() cannot do this job: it only populates keys that are *absent*
 * from process.env, because it tests with hasOwnProperty rather than for
 * truthiness. GitHub Actions exports `FOO=` whenever `secrets.FOO` fails to
 * resolve, so an unresolved secret does not merely fail requireEnv() below — it
 * silently shadows the .env value that would otherwise have covered for it.
 *
 * A real, non-empty environment variable still wins over .env, so genuine CI
 * secrets keep priority over the local defaults written by install.js.
 *
 * Safe to call when the file is missing: a checkout without .env simply leaves
 * process.env as it found it, and requireEnv() reports the missing key.
 */
export function loadEnvironment(envPath: string): void {
	if (!fs.existsSync(envPath)) {
		return;
	}

	const parsed = dotenv.parse(fs.readFileSync(envPath));

	for (const [key, value] of Object.entries(parsed)) {
		// Falsy covers both cases dotenv.config() conflates: absent, and set-to-empty.
		if (!process.env[key]) {
			process.env[key] = value;
		}
	}
}

/**
 * Utility to retrieve required environment variables.
 * Throws an error when the variable is missing or set to an empty string.
 */
export function requireEnv(varName: string): string {
	const value = process.env[varName];
	if (!value) {
		/*
		 * Distinguish "absent" from "present but empty", because the two have very
		 * different causes and the old message ("not defined in the .env file")
		 * pointed at the wrong one.
		 *
		 * Reaching the empty-string branch means loadEnvironment() could not cover
		 * for the blank value either — there was no .env, or it does not define this
		 * key. In CI that combination almost always means the secret did not resolve
		 * (GitHub Actions exports `FOO=` when `secrets.FOO` resolves to nothing,
		 * which is indistinguishable from a set secret until you look at the value).
		 */
		const isPresentButEmpty = Object.prototype.hasOwnProperty.call(process.env, varName);
		const reason = isPresentButEmpty
			? 'is set to an empty string and .env supplied no fallback value ' +
				'(in CI this usually means the secret did not resolve)'
			: 'is not set in the environment or in .env';

		throw new Error(`${varName} ${reason}.`);
	}
	return value;
}

/**
 * Retrieve an optional environment variable with a default fallback.
 */
export function optionalEnv(varName: string, defaultValue: string): string {
	return process.env[varName] || defaultValue;
}

/**
 * Returns HTTP Basic Auth credentials for environments that require them
 * (e.g. review/staging sites behind HTTP authentication).
 * Set HTTP_AUTH_USERNAME and HTTP_AUTH_PASSWORD in .env to enable.
 * Returns undefined when not configured, so it's safe to spread into context options.
 */
export function getHttpCredentials(): { username: string; password: string } | undefined {
	// Note: since these are *not* required, we can't use the requireEnv() function
	const username = process.env.HTTP_AUTH_USERNAME;
	const password = process.env.HTTP_AUTH_PASSWORD;
	if (username && password) {
		return { username, password };
	}
	return undefined;
}

/**
 * Returns the coupon code for a given browser.
 * Pattern supports {browser} placeholder, e.g. "{browser}321".
 */
export function getCouponCode(browserName: string): string {
	const browserEngine = browserName?.toUpperCase() || 'UNKNOWN';
	const pattern = optionalEnv('MAGENTO_COUPON_CODE_PATTERN', '{browser}321');
	return pattern.replace('{browser}', browserEngine);
}

/**
 * Optional host of the third-party consent-manager script, e.g.
 * `consentmanager.net` or `cookiebot.com`. When set, contexts that the auth
 * fixture builds itself abort requests to it, so the banner cannot render in
 * front of the login form even when the consent seed is empty. Unset (the
 * default) leaves network traffic untouched.
 */
export function getConsentCmpHost(): string {
	return optionalEnv('COOKIE_CONSENT_CMP_HOST', '');
}
