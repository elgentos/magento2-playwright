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
