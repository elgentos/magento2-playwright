// @ts-check

/**
 * Utility to retrieve required environment variables.
 * Throws an error when the variable is not set.
 */
export function requireEnv(varName: string): string {
	const value = process.env[varName];
	if (!value) {
		throw new Error(`${varName} is not defined in the .env file.`);
	}
	return value;
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

