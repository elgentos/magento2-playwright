import {test, expect, selectors} from '@playwright/test';
import {Cart} from './utils/Cart';

import toggle from './config/test-toggles.json';
import slugs from './fixtures/before/slugs.json'; 

import globalSelector from './fixtures/during/selectors/global.json';
import miniCartSelector from './fixtures/during/selectors/minicart.json';
import cartSelector from './fixtures/during/selectors/checkout.json';

import cartValue from './fixtures/during/input-values/checkout.json';

import cartExpected from './fixtures/verify/expects/checkout.json';
import { glob } from 'fs';


test.describe('Test discount code features', () => {

  if(toggle.checkout.testCouponCodes){
    test.describe('Cart', () => {
      /**
       * @feature Magento 2 add discount code in cart
       * @scenario User adds a (valid) coupon code in cart
       *  @given There is a existing coupon code
       *    @and I am on any Magento 2 page
       *  @when I add a product to my shopping cart
       *  @then I navigate to the Shopping Cart page
       *  @when I add a valid coupon code
       *  @then A message should confirm the discount (code) was added
       *    @and The coupon field should be filled and therefore not editable.
       */
      test('Add Coupon Code in cart', async ({page}) => {
        const cart = new Cart(page);
        await cart.addSimpleProductToCart(slugs.simpleProductSlug);
        await page.goto(slugs.cartSlug);
  
        await page.getByRole('button', {name: cartSelector.openDiscountFormButton}).click();
        await page.getByPlaceholder(cartSelector.discountInputFieldPlaceholder).fill(process.env.DISCOUNT_CODE);
        await page.getByRole('button', {name: cartSelector.cart.applyDiscountCartButton, exact: true}).click();
        
        const successMessage = page.locator(globalSelector.successMessages, {hasText: cartExpected.cart.couponCodeAppliedNotificationText});
        await expect(successMessage).toContainText(cartExpected.cart.couponCodeAppliedNotificationText);
  
        // Expect that coupon code field is now disabled because an existing coupon code is now entered.
        await expect(page.locator(cartSelector.cart.couponFormField)).toBeDisabled();
      });
    
      /**
       *  @feature Magento 2 Remove Coupon Code(s) in Cart
       *  @scenario User removes a (valid) coupon code in cart
       *    @given I am on the cart page
       *      @and I have both a product in my cart
       *      @and I have a (valid) coupon code
       *    @when I navigate to the checkout
       *    @and I remove my coupon code
       *    @then I should see a confirmation message that my coupon code was removed
       *      @and it should be removed from my overview
       *      @and the price(s) should be adjusted.
       */
  
      test('Remove Coupon Code in cart', async ({page}) => {
        const cart = new Cart(page);
        await cart.addSimpleProductToCart(slugs.simpleProductSlug);
        await page.goto(slugs.cartSlug);
        
        if(await page.locator(cartSelector.cart.couponFormField).isEnabled()){
          // add coupon code
          await page.click(cartSelector.cart.showCouponFormButton);
          await page.fill(cartSelector.cart.couponFormField, cartValue.discountCode);
          await page.click(cartSelector.cart.applyCouponFormButton);
  
          const successMessage = page.locator(globalSelector.successMessages, {hasText: cartExpected.cart.couponCodeAppliedNotificationText});
          await expect(successMessage).toContainText(cartExpected.cart.couponCodeAppliedNotificationText);
        }
  
        await page.click(cartSelector.cart.applyCouponFormButton);
        const updateMessage = page.locator(globalSelector.successMessages, {hasText: cartExpected.cart.couponCodeRemovedNotificationText});
        await expect(updateMessage).toContainText(cartExpected.cart.couponCodeRemovedNotificationText);
  
        await expect(page.locator(cartSelector.cart.couponFormField)).toBeEnabled();
  
        
      });
    });

    test.describe('checkout', () => {
      /**
       *  @feature Magento 2 Add discount code to checkout
       *  @scenario User adds a (valid) coupon code in checkout
       *    @given There is an existing coupon code
       *      @and I am on any Magento 2 page
       *    @when I add a product to my shopping cart
       *    @then I navigate to the checkout
       *    @when I add a valid coupon code
       *    @then A message should confirm the discount (code) was added
       *    @and the discount should be visible
       */
      test('Add Coupon Code in Checkout', async ({page}) => {
        const cart = new Cart(page);
        await cart.addSimpleProductToCart(slugs.simpleProductSlug);
        await page.goto(slugs.checkoutSlug);

        await page.getByText(cartSelector.openDiscountFormButton).click();
        await page.getByPlaceholder(cartSelector.discountInputFieldPlaceholder).fill(process.env.DISCOUNT_CODE);
        await page.getByLabel(cartSelector.checkout.applyDiscountFormButton).click();
        
        const successMessage = page.locator(globalSelector.successMessages, {hasText: cartExpected.checkout.checkoutDiscountAppliedNotificationText});
        await expect(successMessage).toContainText(cartExpected.checkout.checkoutDiscountAppliedNotificationText);

        // Expect description of discount field to be visible.
        await expect(page.locator(cartExpected.checkout.checkoutDiscountDescriptionField)).toBeVisible();

      });

      /**
       * @feature Magento 2 Remove discount code in checkout
       * @scenario The user has a product in their cart and an active discount code
       *  @given I am on the /checkout page
       *    @and I have at least one product in my shopping cart
       *    @and I have an active coupon code
       *  @when I remove the coupon code
       *  @then A message should confirm the discount (code) was removed
       *  @and the discount should not be visible
       */
      test('Remove Coupon Code in Checkout', async ({page}) => {
        const cart = new Cart(page);
        const couponFormField = page.getByPlaceholder(cartSelector.discountInputFieldPlaceholder);

        await cart.addSimpleProductToCart(slugs.simpleProductSlug);
        await page.goto(slugs.checkoutSlug);

        await page.getByText(cartSelector.openDiscountFormButton).click();

        if(await couponFormField.isEnabled()){
          // coupon field is enabled, no discount has been applied
          await page.getByPlaceholder(cartSelector.discountInputFieldPlaceholder).fill(process.env.DISCOUNT_CODE);
          await page.getByLabel(cartSelector.checkout.applyDiscountFormButton).click();

          const successMessage = page.locator(globalSelector.successMessages, {hasText: cartExpected.checkout.checkoutDiscountAppliedNotificationText});
          await expect(successMessage).toContainText(cartExpected.checkout.checkoutDiscountAppliedNotificationText);

          // Expect description of discount field to be visible.
          await expect(page.locator(cartExpected.checkout.checkoutDiscountDescriptionField)).toBeVisible();
        }

        await page.getByLabel(cartSelector.removeDiscountButton).click();

        const updateMessage = page.locator(globalSelector.successMessages, {hasText: cartExpected.checkout.checkoutDiscountRemovedNotificationText});
        await expect(updateMessage).toContainText(cartExpected.checkout.checkoutDiscountRemovedNotificationText);

        // Discount should be removed, discount description should not be visible
        await expect(page.locator(cartExpected.checkout.checkoutDiscountDescriptionField)).not.toBeVisible();

      });
    });
  
  } // end of if-statement test coupon toggle
  
});