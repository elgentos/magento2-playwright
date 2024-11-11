import {test, expect, selectors} from '@playwright/test';
import {Cart} from './utils/Cart';

import toggle from './config/test-toggles.json';
import slugs from './fixtures/before/slugs.json';

import globalSelector from './fixtures/during/selectors/global.json';
import miniCartSelector from './fixtures/during/selectors/minicart.json';
import miniCartExpected from './fixtures/verify/expects/minicart.json';

if (toggle.minicart.testMiniCartCheckoutButton) {
  /**
   * @feature Magento 2 Minicart to Checkout
   *  @scenario User adds a product to their cart, then navigates to checkout through the minicart
   *    @given I am on any Magento 2 page
   *    @when I go to a Simple Product page
   *      @and I add it to my cart
   *      @then I should see a message to confirm it was added
   *    @when I click on the shopping cart symbol in the main menu
   *      @then I should see a mini cart title
   *    @when I click on 'Checkout'
   *    @then I should navigate to the checkout page with the product in my cart
   */

  test('Test minicart to checkout', async ({page}) => {
    const cart = new Cart(page);
    await cart.addSimpleProductToCart(slugs.simpleProductSlug);
    await cart.openMiniCart();

    await page.click(miniCartSelector.miniCartCheckoutButtonSelector);
    await expect(page).toHaveURL(new RegExp(`${slugs.checkoutSlug}.*`));
  });
}


/**
  * @feature Magento 2 Minicart Link to Cart
  * @scenario User adds a product to their cart, then uses the minicart links to navigate to the cart page
  *   @given I am on any Magento 2 page
  *   @when I go to a Simple Product page
  *     @and I add it to my cart
  *     @and I open my minicart to click the link to the Cart page
  *   @then I should navigate to the Cart page
  */

if (toggle.minicart.testMiniCartLink) {
  test('Test minicart to cart', async ({page}) => {
    const cart = new Cart(page);
    await cart.addSimpleProductToCart(slugs.simpleProductSlug);
    await cart.openMiniCart();

    await page.click(miniCartSelector.miniCartCartLinkSelector);
    await expect(page).toHaveURL(new RegExp(`${slugs.cartSlug}.*`));
  });
}

/**
  * @feature Magento 2 Minicart Link to Cart
  * @scenario User adds a product to their cart, then uses the minicart links to navigate to the cart page
  *   @given I am on any Magento 2 page
  *   @when I go to a Simple Product page
  *     @and I add it to my cart
  *     @and I open my minicart to click the link to the Cart page
  *   @then I should navigate to the Cart page
  */
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

/**
  * @feature Magento 2 Delete product using Minicart
  * @scenario User adds a product to their cart, then deletes product from Minicart
  *   @given I am on any Magento 2 page
  *   @when I go to a Simple Product page
  *     @and I add it to my cart
  *     @and I then delete it using the Minicart 'trash' button
  *   @then I the product should not be visible in my (mini)cart anymore
  *     @and I should receive a notification that the product has been removed from the cart.
  */
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
