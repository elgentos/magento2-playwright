import {test, expect, selectors} from '@playwright/test';
import {Cart} from './utils/Cart';

import toggle from './config/test-toggles.json';
import slugs from './fixtures/before/slugs.json';

if(toggle.cart.testCouponCodes){

  // TODO 13-11-2024 : Add test for adding a coupon code in cart
  // Gherkin described below

  /**
   *  @feature Magento 2 Add Coupon Code(s)
   *  @scenario User adds a a coupon code to their cart
   *    @given I am on any Magento 2 page
   *    @when I add a product to my cart
   *      @and I navigate to the to the cart page
   *    @when I add a coupon code
   *    @then I should see a confirmation message that my coupon code was added
   *      @and it should be added to the overview
   *      @and the correct discount should be applied.
   */
  

  // TODO 13-11-2024 : Add test for removing and re-adding coupon code in cart
  // Gherkin described below

  /**
   *  @feature Magento 2 Remove Coupon Code(s)
   *  @scenario User removes a (valid) coupon code from their cart
   *    @given I on the cart page
   *      @and I have both a product in my cart and 
   *      @and I have a (valid) coupon code
   *    @when I remove my coupon code
   *    @then I should see a confirmation message that my coupon code was removed
   *      @and it should be removed from my overview
   *      @and the price(s) should be adjusted.
   */
}