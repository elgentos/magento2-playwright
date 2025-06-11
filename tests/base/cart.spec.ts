import { test, expect } from '@playwright/test';
import { ProductPage } from './fixtures/product.page';
import { MainMenuPage } from './fixtures/mainmenu.page';
import {LoginPage} from './fixtures/login.page';
import { CartPage } from './fixtures/cart.page';

import slugs from './config/slugs.json';
import UIReference from './config/element-identifiers/element-identifiers.json';

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
    const productPage = new ProductPage(page);
    await productPage.addSimpleProductToCart(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
    // await mainMenu.openMiniCart();
    // await expect(page.getByText(outcomeMarker.miniCart.simpleProductInCartTitle)).toBeVisible();
    await page.goto(slugs.cart.cartSlug);
  });

  /**
   * @feature Product can be added to cart
   * @scenario User adds a product to their cart
   * @given I have added a product to my cart
   *  @and I am on the cart page
   * @then I should see the name of the product in my cart
   */
  test('Product can be added to cart',{ tag: ['@cart', '@cold'],}, async ({page}) => {
    await expect(page.getByRole('strong').getByRole('link', {name: UIReference.productPage.simpleProductTitle}), `Product is visible in cart`).toBeVisible();
  });

  /**
   * @feature Product permanence after login
   * @scenario A product added to the cart should still be there after user has logged in
   * @given I have a product in my cart
   * @when I log in
   * @then I should still have that product in my cart
   */
  test('Product should remain in cart after logging in',{ tag: ['@cart', '@account', '@hot']}, async ({page, browserName}) => {
    await test.step('Add another product to cart', async () =>{
      const productpage = new ProductPage(page);
      await page.goto(slugs.productpage.secondSimpleProductSlug);
      await productpage.addSimpleProductToCart(UIReference.productPage.secondSimpleProducTitle, slugs.productpage.secondSimpleProductSlug);
    });

    await test.step('Log in with account', async () =>{
      const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
      const loginPage = new LoginPage(page);
      let emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
      let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

      if(!emailInputValue || !passwordInputValue) {
        throw new Error("MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn't been created yet.");
      }

      await loginPage.login(emailInputValue, passwordInputValue);
    });

    await page.goto(slugs.cart.cartSlug);
    await expect(page.getByRole('strong').getByRole('link', { name: UIReference.productPage.simpleProductTitle }),`${UIReference.productPage.simpleProductTitle} should still be in cart`).toBeVisible();
    await expect(page.getByRole('strong').getByRole('link', { name: UIReference.productPage.secondSimpleProducTitle }),`${UIReference.productPage.secondSimpleProducTitle} should still be in cart`).toBeVisible();
  });

  /**
   * @feature Remove product from cart
   * @scenario User has added a product and wants to remove it from the cart page
   * @given I have added a product to my cart
   *  @and I am on the cart page
   * @when I click the delete button
   * @then I should see a notification that the product has been removed from my cart
   *  @and I should no longer see the product in my cart
   */
  test('Remove product from cart',{ tag: ['@cart','@cold'],}, async ({page}) => {
    const cart = new CartPage(page);
    await cart.removeProduct(UIReference.productPage.simpleProductTitle);
  });

  /**
   * @feature Change quantity of products in cart
   * @scenario User has added a product and changes the quantity
   * @given I have a product in my cart
   * @and I am on the cart page
   * @when I change the quantity of the product
   * @and I click the update button
   * @then the quantity field should have the new amount
   * @and the subtotal/grand total should update
   */
  test('Change quantity of products in cart',{ tag: ['@cart', '@cold'],}, async ({page}) => {
    const cart = new CartPage(page);
    await cart.changeProductQuantity('2');
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
  test('Add coupon code in cart',{ tag: ['@cart', '@coupon-code', '@cold']}, async ({page, browserName}) => {
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    const cart = new CartPage(page);
    let discountCode = process.env[`MAGENTO_COUPON_CODE_${browserEngine}`];

    if(!discountCode) {
      throw new Error(`MAGENTO_COUPON_CODE_${browserEngine} appears to not be set in .env file. Value reported: ${discountCode}`);
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
  test('Remove coupon code from cart',{ tag: ['@cart', '@coupon-code', '@cold'] }, async ({page, browserName}) => {
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    const cart = new CartPage(page);
    let discountCode = process.env[`MAGENTO_COUPON_CODE_${browserEngine}`];

    if(!discountCode) {
      throw new Error(`MAGENTO_COUPON_CODE_${browserEngine} appears to not be set in .env file. Value reported: ${discountCode}`);
    }

    await cart.applyDiscountCode(discountCode);
    await cart.removeDiscountCode();
  });

  /**
   * @feature Incorrect discount code check
   * @scenario The user provides an incorrect discount code, the system should reflect that
   * @given I have a product in my cart
   * @and I am on the cart page
   * @when I enter a wrong discount code
   * @then I should get a notification that the code did not work.
   */

  test('Using an invalid coupon code should give an error',{ tag: ['@cart', '@coupon-code', '@cold'] }, async ({page}) => {
    const cart = new CartPage(page);
    await cart.enterWrongCouponCode("Incorrect Coupon Code");
  });
})

test.describe('Price checking tests', () => {

  // Test: Configurable Product Input check from PDP to checkout
  // test.step: add configurable product to cart, return priceOnPDP and productAmount as variables
  // test.step: call function retrieveCheckoutPrices() to go to checkout, retrieve values
  // test.step: call function compareRetrievedPrices() to compare price on PDP to price in checkout

  /**
   * @feature Simple Product price/amount check from PDP to Checkout
   * @given none
   * @when I go to a (simple) product page
   *  @and I add one or more to my cart
   * @when I go to the checkout
   * @then the amount of the product should be the same
   *  @and the price in the checkout should equal the price of the product * the amount of the product
   */
  test('Simple product input to cart is consistent from PDP to checkout',{ tag: ['@cart-price-check', '@cold']}, async ({page}) => {
    var productPagePrice: string;
    var productPageAmount: string;
    var checkoutProductDetails: string[];

    const cart = new CartPage(page);

    await test.step('Step: Add simple product to cart', async () =>{
      const productPage = new ProductPage(page);
      await page.goto(slugs.productpage.simpleProductSlug);
      // set quantity to 2 so we can see that the math works
      await page.getByLabel(UIReference.productPage.quantityFieldLabel).fill('2');

      productPagePrice = await page.locator(UIReference.productPage.simpleProductPrice).innerText();
      productPageAmount = await page.getByLabel(UIReference.productPage.quantityFieldLabel).inputValue();
      await productPage.addSimpleProductToCart(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug, '2');

    });

    await test.step('Step: go to checkout, get values', async () =>{
      await page.goto(slugs.checkout.checkoutSlug);
      await page.waitForLoadState();

      // returns productPriceInCheckout and productQuantityInCheckout
      checkoutProductDetails = await cart.getCheckoutValues(UIReference.productPage.simpleProductTitle, productPagePrice, productPageAmount);
    });

    await test.step('Step: Calculate and check expectations', async () =>{
      await cart.calculateProductPricesAndCompare(productPagePrice, productPageAmount, checkoutProductDetails[0], checkoutProductDetails[1]);
    });

  });

  /**
   * @feature Configurable Product price/amount check from PDP to Checkout
   * @given none
   * @when I go to a (configurable) product page
   *  @and I add one or more to my cart
   * @when I go to the checkout
   * @then the amount of the product should be the same
   *  @and the price in the checkout should equal the price of the product * the amount of the product
   */
  test('Configurable product input to cart is consistent from PDP to checkout',{ tag: ['@cart-price-check', '@cold']}, async ({page}) => {
    var productPagePrice: string;
    var productPageAmount: string;
    var checkoutProductDetails: string[];

    const cart = new CartPage(page);

    await test.step('Step: Add configurable product to cart', async () =>{
      const productPage = new ProductPage(page);
      // Navigate to the configurable product page so we can retrieve price and amount before adding it to cart
      await page.goto(slugs.productpage.configurableProductSlug);
      // set quantity to 2 so we can see that the math works
      await page.getByLabel('Quantity').fill('2');

      productPagePrice = await page.locator(UIReference.productPage.simpleProductPrice).innerText();
      productPageAmount = await page.getByLabel(UIReference.productPage.quantityFieldLabel).inputValue();
      await productPage.addConfigurableProductToCart(UIReference.productPage.configurableProductTitle, slugs.productpage.configurableProductSlug, '2');

    });

    await test.step('Step: go to checkout, get values', async () =>{
      await page.goto(slugs.checkout.checkoutSlug);
      await page.waitForLoadState();

      // returns productPriceInCheckout and productQuantityInCheckout
      checkoutProductDetails = await cart.getCheckoutValues(UIReference.productPage.configurableProductTitle, productPagePrice, productPageAmount);
    });

    await test.step('Step: Calculate and check expectations', async () =>{
      await cart.calculateProductPricesAndCompare(productPagePrice, productPageAmount, checkoutProductDetails[0], checkoutProductDetails[1]);
    });

  });
});
