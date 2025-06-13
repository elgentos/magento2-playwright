// @ts-check

import { expect, Locator, type Page } from '@playwright/test';
import { UIReference, outcomeMarker, inputValues } from 'config';
import { findPackageJSON } from "node:module";

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
        await expect(this.page.getByRole('navigation', { name: UIReference.footerPage.currencyLabel })).toBeVisible();
        await this.page.getByRole('link', { name: UIReference.footerPage.currencyEuro }).click();
        await this.page.reload();
        await expect(this.page.getByRole('button', { name: UIReference.footerPage.currencyEuro })).toBeVisible();
    }

    async subscribeToNewsletter() {
        await expect(this.page.getByRole('textbox', { name: UIReference.footerPage.newsletterInputElementLabel })).toBeVisible();
        await this.page.getByRole('textbox', { name: UIReference.footerPage.newsletterInputElementLabel }).fill(inputValues.contact.contactFormEmailValue);
        await this.page.getByRole('button', { name: UIReference.footerPage.newsletterSubscribeButtonLabel }).click();

        await expect(this.page.getByText(outcomeMarker.footerPage.newsletterSubscription)).toBeVisible();
    }
}