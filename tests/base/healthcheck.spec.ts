import { test, expect } from '@playwright/test';
import toggles from './config/test-toggles.json';

import UIReference from './config/element-identifiers/element-identifiers.json';
import slugs from './config/slugs.json';

if (toggles.general.pageHealthCheck === true) {
  test.describe('Page health checks', () => {
    test('Homepage_returns_200', { tag: ['@healthcheck','@cold'] }, async ({ page }) => {
      const homepageURL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL;
      if (!homepageURL) {
        throw new Error("PLAYWRIGHT_BASE_URL has not been defined in the .env file.");
      }

      const homepageResponsePromise = page.waitForResponse(homepageURL);
      await page.goto(homepageURL);
      const homepageResponse = await homepageResponsePromise;
      expect(homepageResponse.status(), 'Homepage should return 200').toBe(200);

      await expect(
        page.getByRole('heading', { name: UIReference.homePage.homePageTitleText }),
        'Homepage has a visible title'
      ).toBeVisible();
    });

    test('PLP_returns_200', { tag: ['@healthcheck','@cold'] }, async ({ page }) => {
      const plpResponsePromise = page.waitForResponse(slugs.categoryPage.categorySlug);
      await page.goto(slugs.categoryPage.categorySlug);
      const plpResponse = await plpResponsePromise;
      expect(plpResponse.status(), 'PLP should return 200').toBe(200);

      await expect(
        page.getByRole('heading', { name: UIReference.categoryPage.categoryPageTitleText }),
        'PLP has a visible title'
      ).toBeVisible();
    });

    test('PDP_returns_200', { tag: ['@healthcheck','@cold']  }, async ({ page }) => {
      const pdpResponsePromise = page.waitForResponse(slugs.productpage.simpleProductSlug);
      await page.goto(slugs.productpage.simpleProductSlug);
      const pdpResponse = await pdpResponsePromise;
      expect(pdpResponse.status(), 'PDP should return 200').toBe(200);

      await expect(
        page.getByRole('heading', { level: 1, name: UIReference.productPage.simpleProductTitle }),
        'PDP has a visible title'
      ).toBeVisible();
    });

    test('Checkout_returns_200', { tag: ['@healthcheck','@cold']  }, async ({ page }) => {
      const responsePromise = page.waitForResponse(slugs.checkout.checkoutSlug);

      await page.goto(slugs.checkout.checkoutSlug);
      const response = await responsePromise;

      expect(response.status(), 'Cart empty, checkout should return 302').toBe(302);
      expect(page.url(), 'Cart empty, checkout should redirect to cart').toContain(slugs.cart.cartSlug);

      await expect(
        page.getByRole('heading', { name: UIReference.cart.cartTitleText }),
        'Cart has a visible title'
      ).toBeVisible();

      expect((await page.request.head(page.url())).status(), `Current page (${page.url()}) should return 200`).toBe(200);
    });
  });
}
