// @ts-check

import { test } from '@playwright/test';
import { Footer } from './poms/frontend/footer.page';

test(
    'Footer is available',
    {tag: ['@footer', '@cold']},
    async ({page}) => {
        const footer = new Footer(page);

        await page.goto('');
        await footer.getFooterElement();
    })

test(
    'Switch to euro',
    {tag: ['@footer-currency-switcher', '@cold']},
    async ({page}) => {
        const footer = new Footer(page)

        await page.goto('');
        await footer.switchCurrencySwitcher();
    })

test(
    'Newsletter subscription',
    {tag: ['@footer-newsletter', '@cold']},
    async ({page}) => {
        const footer = new Footer(page);

        await page.goto('');
        await footer.subscribeToNewsletter();
    }
)