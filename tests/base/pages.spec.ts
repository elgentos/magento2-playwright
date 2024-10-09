import { test } from '@playwright/test';
import slugs from './fixtures/before/slugs.json';
import { PageTester } from './utils/PageTester';

test.describe('Check for page errors', () => {

    test('Check for homepage errors', async ({ page }) => {
        const homepageTester = new PageTester(page, slugs.homepageSlug);
        await homepageTester.testPage();
    });

    test('Check for category page errors', async ({ page }) => {
        const categoryTester = new PageTester(page, slugs.categorySlug);
        await categoryTester.testPage();
    });

    test('Check for product page errors', async ({ page }) => {
        const productTester = new PageTester(page, slugs.pageSlug);
        await productTester.testPage();
    });

    test('Check for cart page errors', async ({ page }) => {
        const cartTester = new PageTester(page, slugs.cartSlug);
        await cartTester.testPage();
    });

    test('Check for search page errors', async ({ page }) => {
        const searchTester = new PageTester(page, slugs.searchSlug);
        await searchTester.testPage();
    });

    test('Check for contact page errors', async ({ page }) => {
        const contactTester = new PageTester(page, slugs.contactSlug);
        await contactTester.testPage();
    });

});
