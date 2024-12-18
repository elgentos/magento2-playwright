import { test, expect } from '@playwright/test';
import { ProductPage } from './fixtures/product.page';
import { MainMenuPage } from './fixtures/mainmenu.page';
import {LoginPage} from './fixtures/login.page';
import { CartPage } from './fixtures/cart.page';

import slugs from './config/slugs.json';
import selectors from './config/selectors/selectors.json';
import verify from './config/expected/expected.json';

test.describe('Cart functionalities (guest)', () => {
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
    await productPage.addSimpleProductToCart(selectors.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
    await mainMenu.openMiniCart();
    await expect(page.getByText(verify.miniCart.simpleProductInCartTitle)).toBeVisible();
    await page.goto(slugs.cartSlug);
  });


  test('Product can be added to cart',{ tag: '@cart',}, async ({page}) => {
    await expect(page.getByRole('strong').getByRole('link', {name: selectors.productPage.simpleProductTitle}), `Product is visible in cart`).toBeVisible();
  });
  
  /**
   * @feature Product permanence after login
   * @scenario A product added to the cart should still be there after user has logged in
   * @given I have a product in my cart
   * @when I log in
   * @then I should still have that product in my cart
   */
  test('Product should remain in cart after logging in',{ tag: ['@cart', '@account']}, async ({page}) => {
    await test.step('Add another product to cart', async () =>{
      const productpage = new ProductPage(page);
      await page.goto(slugs.productpage.secondSimpleProductSlug);
      await productpage.addSimpleProductToCart(selectors.productPage.secondSimpleProducTitle, slugs.productpage.secondSimpleProductSlug);
    });

    await test.step('Log in with account', async () =>{
      const login = new LoginPage(page);
      let emailInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_EMAIL;
      let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

      if(!emailInputValue || !passwordInputValue) {
        throw new Error("Your password variable and/or your email variable have not defined in the .env file, or the account hasn't been created yet.");
      }

      await login.login(emailInputValue, passwordInputValue);
    });

    await page.goto(slugs.cartSlug);
    await expect(page.getByRole('strong').getByRole('link', { name: selectors.productPage.simpleProductTitle }),`${selectors.productPage.simpleProductTitle} should still be in cart`).toBeVisible();
    await expect(page.getByRole('strong').getByRole('link', { name: selectors.productPage.secondSimpleProducTitle }),`${selectors.productPage.secondSimpleProducTitle} should still be in cart`).toBeVisible();
  });

 /** @feature Remove product from cart
   * @scenario User has added a product and wants to remove it from the cart page
   * @given I have added a product to my cart
   *  @and I am on the cart page
   * @when I click the delete button
   * @then I should see a notification that the product has been removed from my cart
   *  @and I should no longer see the product in my cart
   */
  test('Remove product from cart',{ tag: '@cart',}, async ({page}) => {
    const cart = new CartPage(page);
    await cart.removeProduct(selectors.productPage.simpleProductTitle);
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
    let discountCode = process.env.MAGENTO_COUPON_CODE;

    if(!discountCode) {
      throw new Error(`MAGENTO_COUPON_CODE appears to not be set in .env file. Value reported: ${discountCode}`);
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
    let discountCode = process.env.MAGENTO_COUPON_CODE;

    if(!discountCode) {
      throw new Error(`MAGENTO_COUPON_CODE appears to not be set in .env file. Value reported: ${discountCode}`);
    }

    // TODO: create API call to quickly add discount code rather than run a test again.
    await cart.applyDiscountCode(discountCode);
    await cart.removeDiscountCode();
  });
});
