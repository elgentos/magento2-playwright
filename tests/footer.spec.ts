// @ts-check

import { test } from '@playwright/test';
import { Footer } from './poms/frontend/footer.page';

test(
    'Footer_is_available',
    {tag: ['@footer', '@cold']},
    async ({page}) => {
        const footer = new Footer(page);

        await page.goto('');
        await footer.getFooterElement();
    })

test(
    'Switch_to_euro',
    {tag: ['@footer-currency-switcher', '@cold']},
    async ({page}) => {
        const footer = new Footer(page)

        await page.goto('');
        await footer.switchCurrencySwitcher();
    })

test(
    'Newsletter_subscription',
    {tag: ['@footer-newsletter', '@cold']},
    async ({page}) => {
        const footer = new Footer(page);

        await page.goto('');
        await footer.subscribeToNewsletter();
    }
)