// @ts-check

import { expect, type Page } from '@playwright/test';
import { slugs } from '@config';

export class OrderHistoryPage {
	constructor(public readonly page: Page) {}

	/**
	 * Method to open the order history page.
	 */
	async open() {
		await this.page.goto(slugs.frontend.account.orderHistory);
		await this.page.waitForLoadState();
	}

	/**
	 * Method to confirm the order is actually present in the order history.
	 * @param orderNumber {string} - number of the order to check
	 */
	async verifyOrderPresent(orderNumber: string) {
		await expect(this.page.getByText(orderNumber)).toBeVisible();
	}
}
