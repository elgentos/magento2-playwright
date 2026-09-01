// @ts-check

import { expect, type Locator, type Page } from '@playwright/test';
import { UIReference } from '@config';

class NotificationValidatorUtils {
	constructor(private readonly page: Page) {}

	/**
	 * @param value - the expected notification
	 */
	async validate(value: string): Promise<Locator> {
		const notification = this.page
			.locator(UIReference.selectors.shared.notification)
			.filter({ hasText: value, visible: true })
			.last();

		await expect(
			notification,
			`Notification containing "${value}" should be visible`,
		).toBeVisible({ timeout: 30_000 });
		await expect(notification, `Notification should contain "${value}"`).toContainText(value);
		return notification;
	}
}

export default NotificationValidatorUtils;
