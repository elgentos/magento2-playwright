import { expect, Locator, type Page } from '@playwright/test';
import { UIReference } from 'config';

export class Footer {
    readonly page: Page
    readonly footerElement: Locator

    constructor(page) {
        this.page = page
        this.footerElement = this.page.locator(UIReference.footerPage.footerLocator);
    }

    async getFooterElement () {
        await expect(this.footerElement).toBeVisible();
    }

    async switchCurrencySwitcher () {
        await this.getFooterElement();
        await this.page.getByRole('button', { name: UIReference.footerPage.currencyDollar }).click();
        await expect(this.page.getByRole('navigation', {name: 'Currency'})).toBeVisible();
        await this.page.getByRole('link', { name: UIReference.footerPage.currencyEuro }).click();
        await this.page.reload();
        await expect(this.page.getByRole('button', { name: UIReference.footerPage.currencyEuro })).toBeVisible();
    }
}