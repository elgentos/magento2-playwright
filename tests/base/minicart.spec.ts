import {test, expect, selectors} from '@playwright/test';
import {Cart} from './utils/Cart';

import toggle from './config/test-toggles.json';
import slugs from './fixtures/before/slugs.json';

import globalSelector from './fixtures/during/selectors/global.json';
import miniCartSelector from './fixtures/during/selectors/minicart.json';
import productSelector from './fixtures/during/selectors/product-page.json';
import miniCartExpected from './fixtures/verify/expects/minicart.json';


if (toggle.minicart.testMiniCartCheckoutButton) {
  test('Test minicart to checkout', async ({page}) => {
    const cart = new Cart(page);
    await cart.addSimpleProductToCart(slugs.simpleProductSlug);
    await cart.openMiniCart();

    await page.click(miniCartSelector.miniCartCheckoutButtonSelector);
    await expect(page).toHaveURL(new RegExp(`${slugs.checkoutSlug}.*`));
  });
}

if (toggle.minicart.testMiniCartLink) {
  test('Test minicart to cart', async ({page}) => {
    const cart = new Cart(page);
    await cart.addSimpleProductToCart(slugs.simpleProductSlug);
    await cart.openMiniCart();

    await page.click(miniCartSelector.miniCartCartLinkSelector);
    await expect(page).toHaveURL(new RegExp(`${slugs.cartSlug}.*`));
  });
}

if (toggle.minicart.testMiniCartQuantity) {
  test('Test minicart quantity change', async ({page}) => {
    const cart = new Cart(page);
    await cart.addSimpleProductToCart(slugs.simpleProductSlug);
    await cart.openMiniCart();
    await page.click(miniCartSelector.miniCartQuantityButtonSelector);

    await expect(page).toHaveURL(new RegExp(`${slugs.productQuantityChangeSlug}.*`));
    await page.fill(productSelector.productQuantityInputSelector, miniCartExpected.productQuantity);
    await page.click(productSelector.addToCartButtonSelector);

    await cart.openMiniCart();
    await expect(page.locator(miniCartSelector.miniCartQuantitySelector)).toContainText(miniCartExpected.productQuantity);

  });
}

if (toggle.minicart.testMiniCartDeletion) {
  test('Test minicart deletion', async ({page}) => {
    const cart = new Cart(page);
    await cart.addSimpleProductToCart(slugs.simpleProductSlug);
    await cart.openMiniCart();
    await page.click(miniCartSelector.miniCartDeleteProductButtonSelector);

    const successMessage = page.locator(globalSelector.successMessages, {hasText: miniCartExpected.productDeletedFromCartNotificationText});
    await expect(successMessage).toContainText(miniCartExpected.productDeletedFromCartNotificationText);
  });
}
