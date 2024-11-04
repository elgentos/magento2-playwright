import { expect, Page } from '@playwright/test';
import slugs from '../fixtures/before/slugs.json';

import productPageSelector from '../fixtures/during/selectors/product-page.json';
import productPageExpected from '../fixtures/verify/expects/product-page.json';

import miniCartSelector from '../fixtures/during/selectors/minicart.json';

export class Cart {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async addSimpleProductToCart(productSlug: string) {
        await this.page.goto(slugs.simpleProductSlug);
        await this.page.click(productPageSelector.addToCartButtonSelector);
        await expect(this.page.locator(`text=${productPageExpected.productAddedToCartNotificationText}`)).toBeVisible();
    }

    async openMiniCart() {
        await this.page.click(miniCartSelector.miniCartIconSelector);
        await expect(this.page.locator(miniCartSelector.miniCartDrawerTitleSelector)).toBeVisible();
    }
}
