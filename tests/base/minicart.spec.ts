import { test, expect, selectors } from '@playwright/test';
import { Cart } from './utils/Cart';

import toggle from './config/test-toggles.json';
import slugs from './fixtures/before/slugs.json';

import miniCartSelector from './fixtures/during/selectors/minicart.json';

if(toggle.minicart.testCheckoutButton) {
    test('Test minicart to checkout', async ({ page }) => {
        const cart = new Cart(page);
        await cart.addSimpleProductToCart(slugs.simpleProductSlug);
        await cart.openMiniCart();

        await page.click(miniCartSelector.miniCartCheckoutButtonSelector);
        await expect(page).toHaveURL(new RegExp(`${slugs.checkoutSlug}.*`));
    });
}

if(toggle.minicart.testCartLink) {
    test('Test minicart to cart', async ({ page }) => {
        const cart = new Cart(page);
        await cart.addSimpleProductToCart(slugs.simpleProductSlug);
        await cart.openMiniCart();

        await page.click(miniCartSelector.miniCartCartLinkSelector);
        await expect(page).toHaveURL(new RegExp(`${slugs.cartSlug}.*`));
    });
}