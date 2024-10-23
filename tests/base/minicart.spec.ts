import { test, expect, selectors } from '@playwright/test';
import { Cart } from './utils/Cart';

import toggle from './config/test-toggles.json';
import slugs from './fixtures/before/slugs.json';

import productPageSelector from './fixtures/during/selectors/product-page.json';
import productPageExpected from './fixtures/verify/expects/product-page.json';

import miniCartSelector from './fixtures/during/selectors/minicart.json';

if(toggle.minicart.testCheckoutButton) {
    test('Test minicart to checkout', async ({ page }) => {
        const cart = new Cart(page);
        await cart.addToCart(slugs.simpleProductSlug);

        await page.click(productPageSelector.addToCartButtonSelector);
        await expect(page.locator(`text=${productPageExpected.productAddedToCartNotificationText}`)).toBeVisible();

        await page.click(miniCartSelector.miniCartIconSelector);
        await expect(page.locator(miniCartSelector.miniCartDrawerTitleSelector)).toBeVisible();

        await page.click(miniCartSelector.miniCartCheckoutButtonSelector);
        await expect(page).toHaveURL(new RegExp(`${slugs.checkoutSlug}.*`));
    });
}