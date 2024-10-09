import { expect, Page } from '@playwright/test';

export class Contact {
    page: Page;
    url: string;

    constructor(page: Page) {
        this.page = page;
    }
    
    async navigateAndCheckForm() {
        const response = await this.page.goto(this.url);
        expect(response?.status()).toBe(200);
    }
}
