import { test, expect } from '@playwright/test';
import toggles from './config/test-toggles.json';

import UIReference from './config/element-identifiers/element-identifiers.json';
import slugs from './config/slugs.json';

if(toggles.general.pageHealthCheck === true) {
  test.only('Critical_pages_load_and_have_a_visible_title', {tag: '@cold'}, async ({ page }) => {
    await test.step('Homepage_returns_200', async () =>{
      let homepageURL = process.env.PLAYWRIGHT_BASE_URL;
  
      if(!homepageURL) {
        throw new Error("PLAYWRIGHT_BASE_URL has not been defined in the .env file.");
      }
  
      const homepageResponsePromise = page.waitForResponse(homepageURL);
      await page.goto(homepageURL);
      const homepageResponse = await homepageResponsePromise;
      expect(homepageResponse.status(), 'Homepage should return 200').toBe(200);
  
      await expect(page.getByRole('heading', { name: UIReference.homePage.homePageTitleText }), `Homepage has a visible title`).toBeVisible();
    });
  
    await test.step('PLP_returns_200', async () =>{
      const plpResponsePromise = page.waitForResponse(slugs.categoryPage.categorySlug);
      await page.goto(slugs.categoryPage.categorySlug);
      const plpResponse = await plpResponsePromise;
      expect(plpResponse.status(), 'PLP should return 200').toBe(200);
  
      await expect(page.getByRole('heading', { name: UIReference.categoryPage.categoryPageTitleText }), `PLP has a visible title`).toBeVisible();
    });
  
    await test.step('PDP_returns_200', async () =>{
      const pdpResponsePromise = page.waitForResponse(slugs.productpage.simpleProductSlug);
      await page.goto(slugs.productpage.simpleProductSlug);
      const pdpResponse = await pdpResponsePromise;
      expect(pdpResponse.status(), 'PDP should return 200').toBe(200);
  
      await expect(page.getByRole('heading', {level:1, name: UIReference.productPage.simpleProductTitle}), `PLP has a visible title`).toBeVisible();
    });
  
    await test.step('Checkout_returns_200', async () =>{
  
      // First, check if there's an item in the cart
      const cartAmount = await page.locator(UIReference.miniCart.minicartButtonLocator).getAttribute('aria-label');
      if(!cartAmount){
        throw new Error("Cart amount is not visible.");
      }
  
      // Cart is empty, meaning the page a 302 is expected and the final URL is checkout/cart
      if(cartAmount.includes('empty')){
        const checkoutResponsePromise = page.waitForResponse(slugs.checkout.checkoutSlug);
        await page.goto(slugs.checkout.checkoutSlug);
        const checkoutResponse = await checkoutResponsePromise;
        expect(checkoutResponse.status(), `Cart empty, checkout should return 302`).toBe(302);
        expect(page.url(), `Cart empty, checkout should redirect to cart`).toContain(slugs.cart.cartSlug);
        await expect(page.getByRole('heading', { name: UIReference.cart.cartTitleText }), `Cart has a visible title`).toBeVisible();
      } else {
        const checkoutResponsePromise = page.waitForResponse(slugs.checkout.checkoutSlug);
        await page.goto(slugs.checkout.checkoutSlug);
        const checkoutResponse = await checkoutResponsePromise;
        expect(checkoutResponse.status(), `Checkout should return 200`).toBe(200);
  
        await expect(page.getByRole('button', { name: UIReference.checkout.placeOrderButtonLabel }), `Place Order button is visible`).toBeVisible();
      }
  
    });
  });
}