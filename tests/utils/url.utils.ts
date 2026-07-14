/**
 * Converts a slug string into a RegExp safe for use with page.waitForURL().
 * Special regex characters in the slug are escaped.
 * When appendDollarSign is true, the pattern is anchored to the end of the URL
 * to prevent partial/substring matches
 * (e.g. '/customer/account/' should NOT match '/customer/account/login/').
 */
export function slugToRegex(slug: string, appendDollarSign: boolean = false): RegExp {
	const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`${escaped}${appendDollarSign ? '$' : ''}`);
}

/**
 * Confirm if the website is 'localhost' or not.
 * This is because certain modules might not run locally, which can cause differences.
 * For example: SEO rewrites of slugs.
 * @param slug
 * @returns boolean: true if localhost, false if not.
 */
export function isLocalhost(slug: string): boolean {
	if (slug.includes('localhost')) {
		return true;
	}

	return false;
}
