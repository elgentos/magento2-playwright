import { test, expect } from '@playwright/test';
import toggles from './config/test-toggles.json';

import UIReference from './config/element-identifiers/element-identifiers.json';
import slugs from './config/slugs.json';

if(toggles.general.pageHealthCheck === true) {
  test.describe.only('Page health checks', () => {
    test('Homepage_returns_200',{ tag: '@healthcheck'}, async ({ page }) => {
      let homepageURL = process.env.BASE_URL;

      if(!homepageURL) {
        throw new Error("BASE_URL has not been defined in the .env file.");
      }

      const homepageResponsePromise = page.waitForResponse(homepageURL);
      await page.goto(homepageURL);
      const homepageResponse = await homepageResponsePromise;
      expect(homepageResponse.status(), 'Homepage should return 200').toBe(200);

      await expect(page.getByRole('heading', { name: UIReference.homePage.homePageTitleText }), `Homepage has a visible title`).toBeVisible();
    });

    test('PLP_returns_200',{ tag: '@healthcheck'}, async ({ page }) => {
      const plpResponsePromise = page.waitForResponse(slugs.categoryPage.categorySlug);
      await page.goto(slugs.categoryPage.categorySlug);
      const plpResponse = await plpResponsePromise;
      expect(plpResponse.status(), 'PLP should return 200').toBe(200);

      await expect(page.getByRole('heading', { name: UIReference.categoryPage.categoryPageTitleText }), `PLP has a visible title`).toBeVisible();
    });

    test('PDP_returns_200',{ tag: '@healthcheck'}, async ({ page }) => {
      const pdpResponsePromise = page.waitForResponse(slugs.productpage.simpleProductSlug);
      await page.goto(slugs.productpage.simpleProductSlug);
      const pdpResponse = await pdpResponsePromise;
      expect(pdpResponse.status(), 'PDP should return 200').toBe(200);

      await expect(page.getByRole('heading', {level:1, name: UIReference.productPage.simpleProductTitle}), `PLP has a visible title`).toBeVisible();
    });

    test('Checkout_returns_200',{ tag: '@healthcheck'}, async ({ page }) => {
        const responsePromise = page.waitForResponse(slugs.checkout.checkoutSlug);

        await page.goto(slugs.checkout.checkoutSlug);
        const response = await responsePromise;

        expect(response.status(), 'Cart empty, checkout should return 302').toBe(302);
        expect(page.url(), 'Cart empty, checkout should redirect to cart').toContain(slugs.cart.cartSlug);

        await expect(
          page.getByRole('heading', { name: UIReference.cart.cartTitleText }),
          'Cart has a visible title'
        ).toBeVisible();

        const headStatus = (await page.request.head(page.url())).status();
        expect(headStatus, `Current page (${page.url()}) should return 200`).toBe(200);
      });
  });
}
