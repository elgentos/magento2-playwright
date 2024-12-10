import {test, expect} from '@playwright/test';
import {ProductPage} from './fixtures/product.page';
import { MainMenuPage } from './fixtures/mainmenu.page';
import { CartPage} from './fixtures/cart.page';

import slugs from './config/slugs.json';
import verify from './config/expected/expected.json';

test.describe('Coupon Code tests', () => {
  /**
   * @feature BeforeEach runs before each test in this group.
   * @scenario Add a product to the cart and confirm it's there.
   * @given I am on any page
   * @when I navigate to a (simple) product page
   *  @and I add it to my cart
   *  @then I should see a notification
   * @when I click the cart in the main menu
   *  @then the minicart should become visible
   *  @and I should see the product in the minicart
   */
  test.beforeEach(async ({ page }) => {
    const mainMenu = new MainMenuPage(page);
    const productPage = new ProductPage(page);

    //TODO: Use a storagestate or API call to add product to the cart so shorten test time
    await page.goto(slugs.productpage.simpleProductSlug);
    await productPage.addSimpleProductToCart();
    await mainMenu.openMiniCart();
    await expect(page.getByText(verify.miniCart.simpleProductInCartTitle)).toBeVisible();
    await page.goto(slugs.cartSlug);
  });

  /**
   * @feature Discount Code
   * @scenario User adds a discount code to their cart
   * @given I have a product in my cart
   *  @and I am on my cart page
   * @when I click on the 'add discount code' button
   * @then I fill in a code
   *  @and I click on 'apply code'
   * @then I should see a confirmation that my code has been added
   *  @and the code should be visible in the cart
   *  @and a discount should be applied to the product
   */
  test('Add coupon code in cart',{ tag: ['@cart', '@coupon-code']}, async ({page}) => {
    const cart = new CartPage(page);
    let discountCode = process.env.DISCOUNT_CODE;

    if(!discountCode) {
      throw new Error(`discountCode appears to not be set in .env file. Value reported: ${discountCode}`);
    }

    await cart.applyDiscountCode(discountCode);
  });

  /**
   * @feature Remove discount code from cart
   * @scenario User has added a discount code, then removes it
   * @given I have a product in my cart
   * @and I am on my cart page
   * @when I add a discount code
   * @then I should see a notification
   * @and the code should be visible in the cart
   * @and a discount should be applied to a product
   * @when I click the 'cancel coupon' button
   * @then I should see a notification the discount has been removed
   * @and the discount should no longer be visible.
   */

  test('Remove coupon code from cart',{ tag: ['@cart', '@coupon-code']}, async ({page}) => {
    const cart = new CartPage(page);
    let discountCode = process.env.DISCOUNT_CODE;

    if(!discountCode) {
      throw new Error(`discountCode appears to not be set in .env file. Value reported: ${discountCode}`);
    }

    // TODO: create API call to quickly add discount code rather than run a test again.
    await cart.applyDiscountCode(discountCode);
    await cart.removeDiscountCode();
  });

});