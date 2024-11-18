import {test, expect, selectors} from '@playwright/test';
import {Cart} from './utils/Cart';

import toggle from './config/test-toggles.json';
import slugs from './fixtures/before/slugs.json'; 

import globalSelector from './fixtures/during/selectors/global.json';
import miniCartSelector from './fixtures/during/selectors/minicart.json';
import cartSelector from './fixtures/during/selectors/checkout.json';

import cartValue from './fixtures/during/input-values/checkout.json';

import cartExpected from './fixtures/verify/expects/checkout.json';

test.describe('Test discount code features', () => {
  if(toggle.checkout.testCouponCodes){
    /**
     *  @feature Magento 2 Add Coupon Code(s) in Checkout
     *  @scenario User adds a a coupon code in checkout
     *    @given I am on any Magento 2 page
     *    @when I add a product to my cart
     *      @and I navigate to the to the checkout page
     *    @when I add a coupon code
     *    @then I should see a confirmation message that my coupon code was added
     *      @and it should be added to the overview
     *      @and the correct discount should be applied.
     */
    test('Add Coupon Code', async ({page}) => {
      const cart = new Cart(page);
      await cart.addSimpleProductToCart(slugs.simpleProductSlug);
      await cart.openMiniCart();

      await page.click(miniCartSelector.miniCartCartLinkSelector);
      await expect(page).toHaveURL(new RegExp(`${slugs.cartSlug}.*`));

      await page.click(cartSelector.cart.showCouponFormButton);
      await page.fill(cartSelector.cart.couponFormField, cartValue.discountCode);

      await page.click(cartSelector.cart.applyCouponFormButton);

      // Expect message that discount code was added
      const successMessage = page.locator(globalSelector.successMessages, {hasText: cartExpected.cart.couponCodeAppliedNotificationText});
      await expect(successMessage).toContainText(cartExpected.cart.couponCodeAppliedNotificationText);

      // Expect that coupon code field is now disabled because an existing coupon code is now entered.
      await expect(page.locator(cartSelector.cart.couponFormField)).toBeDisabled();
    });
  
    // TODO 13-11-2024 : Add test for removing and re-adding coupon code in cart
    // Gherkin described below
  
    /**
     *  @feature Magento 2 Remove Coupon Code(s) in Checkout
     *  @scenario User removes a (valid) coupon code in checkout
     *    @given I on the cart page
     *      @and I have both a product in my cart
     *      @and I have a (valid) coupon code
     *    @when I navigate to the checkout
     *    @and I remove my coupon code
     *    @then I should see a confirmation message that my coupon code was removed
     *      @and it should be removed from my overview
     *      @and the price(s) should be adjusted.
     */
  }
});