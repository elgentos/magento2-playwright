// @ts-check

import { test } from '@playwright/test';
import { Footer } from './poms/frontend/footer.page';
import NotificationValidator from "./utils/notification.validator";
import { outcomeMarker } from 'config';

import NewsletterPage from "./poms/frontend/newsletter.page";

test(
    'Footer_is_available',
    {tag: ['@footer', '@cold']},
    async ({page}) => {
        const footer = new Footer(page);

        await page.goto('');
        await footer.getFooterElement();
    }
)

test(
    'Switch_to_euro',
    {tag: ['@footer-currency-switcher', '@cold']},
    async ({page}) => {
        const footer = new Footer(page)

        await page.goto('');
        await footer.switchCurrencySwitcher();
    }
)

test(
    'Newsletter_subscription',
    {tag: ['@footer-newsletter', '@cold']},
    async ({page}, testInfo) => {
        const newsletterPage = new NewsletterPage(page);

        await page.goto('');
        await newsletterPage.footerSubscribeToNewsletter();

        const subscriptionOutput = outcomeMarker.footerPage.newsletterSubscription;
        const notificationType = 'Newsletter subscription notification';

        const notificationValidator = new NotificationValidator(page, testInfo);
        await notificationValidator.validate(notificationType, subscriptionOutput);
    }
)