// @ts-check

import { expect, Page, TestInfo } from "@playwright/test";
import { UIReference } from '@config';

class NotificationValidatorUtils {

    private page : Page;
    private testInfo: TestInfo;

    constructor(page: Page, testInfo: TestInfo) {
        this.page = page;
        this.testInfo = testInfo;
    }

    /**
     * @param notificationType
     * @param value
     * @return json object
     */
    async validate(notificationType: string, value: string) {
		// wait for message to be visible.
        await this.page.locator(UIReference.general.messageLocator).waitFor({ state: 'visible' });
        const receivedNotification = await this.page.locator(UIReference.general.messageLocator).textContent();

        let message = 'Action was successful, but notification text could not be extracted.';

        if(receivedNotification !== null){
          message = receivedNotification.trim();
        }

        if (! expect.soft(this.page.locator(UIReference.general.messageLocator),
			`Message has been found`).toContainText(value)) {
            message = `Notification text not found: ${value}. Found notification text: ${receivedNotification}`;
        }

        this.testInfo.annotations.push({ type: `Validator Note`, description: message });

        return message;
    }
}

export default NotificationValidatorUtils;
