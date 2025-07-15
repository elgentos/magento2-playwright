// @ts-check

import { expect, Page, TestInfo } from "@playwright/test";
import { UIReference } from '@config';

class NotificationValidator {

    private page : Page;
    private testInfo: TestInfo;

    constructor(page: Page, testInfo: TestInfo) {
        this.page = page;
        this.testInfo = testInfo;
    }

    /**
     * @param value
     * @return json object
     */
    async validate(value: string) {
        await this.page.locator(UIReference.general.messageLocator).waitFor({ state: 'visible' });
        const notificationText = await this.page.locator(UIReference.general.messageLocator).textContent();
        let message = { success: true, message: ''};

        if (
            ! expect.soft(this.page.locator(UIReference.general.messageLocator)).toContainText(value)
        ) {
            message = { success: false, message: `Notification text not found: ${value}. Found notification text: ${notificationText}` };
        }

        this.testInfo.annotations.push({ type: 'Notification: beforeEach add product to cart', description: message.message });
    }
}

export default NotificationValidator;