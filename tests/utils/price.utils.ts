// @ts-check

import { UIReference } from '@config';

/**
 * Magento prints two decimals, so a separator followed by three digits is a
 * grouping separator. That lets both '1,234.56' and '1.234,56' parse without
 * knowing the store's locale.
 */
function toNumber(digits: string): number {
	const lastSeparatorIndex = Math.max(digits.lastIndexOf(','), digits.lastIndexOf('.'));

	if (lastSeparatorIndex === -1) {
		return Number(digits);
	}

	const decimalCount = digits.length - lastSeparatorIndex - 1;
	const withoutSeparators = digits.replace(/[.,]/g, '');

	if (decimalCount > 2) {
		return Number(withoutSeparators);
	}

	const splitAt = withoutSeparators.length - decimalCount;
	return Number(`${withoutSeparators.slice(0, splitAt)}.${withoutSeparators.slice(splitAt)}`);
}

/**
 * Read a price from storefront text, using the configured price symbol.
 * Returns 0 when the text holds no price, which the order summary relies on
 * for fields a store does not display.
 * @param priceText {string} - text containing a price, e.g. 'Subtotal €1.234,56'
 */
export function parsePrice(priceText: string): number {
	const priceSymbol = UIReference.text.frontend.common.priceSymbol;

	if (!priceText.includes(priceSymbol)) {
		return 0;
	}

	// The symbol sits before or after the amount, so match the amount itself.
	const match = priceText.match(/\d[\d.,]*\d|\d/);

	if (!match?.index) {
		return match ? toNumber(match[0]) : 0;
	}

	// A discount reads as '-€10.00': the minus is not next to the digits.
	const beforeAmount = priceText.slice(0, match.index).split(priceSymbol).join('').trim();

	return toNumber(match[0]) * (beforeAmount.endsWith('-') ? -1 : 1);
}
