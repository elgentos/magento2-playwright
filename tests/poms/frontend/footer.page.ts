// @ts-check

import { expect, Locator, type Page } from '@playwright/test';
import { UIReference } from '@config';

class Footer {
    readonly page: Page
    readonly footerElement: Locator


    constructor(page: Page) {
        this.page = page
        this.footerElement = this.page.locator(UIReference.selectors.frontend.footer.footer);
    }

    async goToFooterElement () {
        await this.page.getByText(UIReference.text.frontend.footer.currencyLabel).scrollIntoViewIfNeeded();
        await expect(
          this.footerElement,
          'Footer is visible'
        ).toBeVisible();
    }

    async switchCurrency () {
        await this.goToFooterElement();

        const isUsdActive = await this.page.getByRole('button', {
            name: UIReference.text.frontend.footer.currencyDollar
        }).isVisible();

        const currencyToOpen = isUsdActive ? UIReference.text.frontend.footer.currencyDollar : UIReference.text.frontend.footer.currencyEuro;
        const currencyToSelect = isUsdActive ? UIReference.text.frontend.footer.currencyEuro : UIReference.text.frontend.footer.currencyDollar;

        await this.page.getByRole('button', { name: currencyToOpen }).click();

        await expect(
          this.page.getByRole('navigation', { name: UIReference.text.frontend.footer.currencyLabel }),
          'Footer navigation is visible'
        ).toBeVisible();

        await this.page.getByRole('link', { name: currencyToSelect }).click();

        await this.goToFooterElement();

        await expect(
          this.page.getByRole('button', { name: currencyToSelect }),
          'Currency selector is visible'
        ).toBeVisible();
    }
}

export default Footer;