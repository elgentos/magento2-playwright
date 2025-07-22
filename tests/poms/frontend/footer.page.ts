// @ts-check

import { expect, Locator, type Page } from '@playwright/test';
import { UIReference } from '@config';

class Footer {
    readonly page: Page
    readonly footerElement: Locator


    constructor(page: Page) {
        this.page = page
        this.footerElement = this.page.locator(UIReference.footerPage.footerLocator);
    }

    async goToFooterElement () {
        await this.page.getByText(UIReference.footerPage.currencyLabel).scrollIntoViewIfNeeded();
        await expect(this.footerElement).toBeVisible();
    }

    async switchCurrency () {
        await this.goToFooterElement();

        const isUsdActive = await this.page.getByRole('button', {
            name: UIReference.footerPage.currencyDollar
        }).isVisible();

        const currencyToOpen = isUsdActive ? UIReference.footerPage.currencyDollar : UIReference.footerPage.currencyEuro;
        const currencyToSelect = isUsdActive ? UIReference.footerPage.currencyEuro : UIReference.footerPage.currencyDollar;

        await this.page.getByRole('button', { name: currencyToOpen }).click();

        await expect(
          this.page.getByRole('navigation', { name: UIReference.footerPage.currencyLabel })
        ).toBeVisible();

        await this.page.getByRole('link', { name: currencyToSelect }).click();

        await this.goToFooterElement();

        await expect(
          this.page.getByRole('button', { name: currencyToSelect })
        ).toBeVisible();
    }
}

export default Footer;