// @ts-check

import {expect, Page, TestInfo} from "@playwright/test";

// @ts-ignore
import UIReference from '../config/element-identifiers/element-identifiers.json';

export class NotificationValidator {

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
            message = { success: false, message: `Notificatie tekst niet gevonden: ${value}. Gevonden notificatie tekst: ${notificationText}` };
        }

        this.testInfo.annotations.push({ type: 'Notification: beforeEach add product to cart', description: message.message });
    }
}