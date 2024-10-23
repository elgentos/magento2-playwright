import { expect, Page } from '@playwright/test';
import slugs from '../fixtures/before/slugs.json';
import accountSelector from '../fixtures/during/selectors/account.json';

export class Cart {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async addToCart(productSlug: string) {
        await this.page.goto(slugs.simpleProductSlug);
    }
}
