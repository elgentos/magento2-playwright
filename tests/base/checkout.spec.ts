import {test, expect} from '@playwright/test';
import {LoginPage} from './fixtures/login.page';
import {MainMenuPage} from './fixtures/mainmenu.page';
import {ProductPage} from './fixtures/product.page';

import slugs from './config/slugs.json';
import inputvalues from './config/input-values/input-values.json';
import selectors from './config/selectors/selectors.json';
import verify from './config/expected/expected.json';
import { CheckoutPage } from './fixtures/checkout.page';

// no resetting storageState, mainmenu has more functionalities when logged in.

/**
 * @feature BeforeEach runs before each test in this group.
 * @scenario Add product to the cart, confirm it's there, then move to checkout.
 * @given I am on any page
 * @when I navigate to a (simple) product page
 *  @and I add it to my cart
 *  @then I should see a notification
 * @when I navigate to the checkout
 *  @then the checkout page should be shown
 *  @and I should see the product in the minicart
 */
test.beforeEach(async ({ page }) => {
  const productPage = new ProductPage(page);

  //TODO: Use a storagestate or API call to add product to the cart so shorten test time
  await page.goto(slugs.productpage.simpleProductSlug);
  await productPage.addSimpleProductToCart(selectors.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
  await page.goto(slugs.checkoutSlug);
});


test.describe('Checkout (login required)', () => {
  // Before each test, log in
  // TODO: remove this beforeEach() once authentication as project set-up/fixture works.
  test.beforeEach(async ({ page, browserName }) => {
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    let emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
    let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

    if(!emailInputValue || !passwordInputValue) {
      throw new Error("MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn't been created yet.");
    }

    const loginPage = new LoginPage(page);
    await loginPage.login(emailInputValue, passwordInputValue);
  });

  //TODO: Add Gherkin feature description
  test('Place order for simple product',{ tag: '@simple-product-order',}, async ({page}) => {
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.placeOrder();
  });



});

test.describe('Checkout (guest)', () => {
  // TODO: Write test to confirm order can be placed without an account
  // TODO: Write test for logged-in user who hasn't added an address yet.

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
    test('Add coupon code in checkout',{ tag: ['@checkout', '@coupon-code']}, async ({page}) => {
      //TODO: Write tests to ensure code also works if user is NOT logged in.
      const checkout = new CheckoutPage(page);
      let discountCode = process.env.MAGENTO_COUPON_CODE;

      if(!discountCode) {
        throw new Error(`MAGENTO_COUPON_CODE appears to not be set in .env file. Value reported: ${discountCode}`);
      }

      await checkout.applyDiscountCodeCheckout(discountCode);
    });

  /**
   * @feature Remove discount code from checkout
   * @scenario User has added a discount code, then removes it
   * @given I have a product in my cart
   * @and I am on the checkout page
   * @when I add a discount code
   * @then I should see a notification
   * @and the code should be visible in the cart
   * @and a discount should be applied to a product
   * @when I click the 'cancel coupon' button
   * @then I should see a notification the discount has been removed
   * @and the discount should no longer be visible.
   */

  test('Remove coupon code from checkout',{ tag: ['@checkout', '@coupon-code']}, async ({page}) => {
    const checkout = new CheckoutPage(page);
    let discountCode = process.env.MAGENTO_COUPON_CODE;

    if(!discountCode) {
      throw new Error(`MAGENTO_COUPON_CODE appears to not be set in .env file. Value reported: ${discountCode}`);
    }

    // TODO: create API call to quickly add discount code rather than run a test again.
    await checkout.applyDiscountCodeCheckout(discountCode);
    await checkout.removeDiscountCode();
  });

  /**
   * @feature Incorrect discount code check
   * @scenario The user provides an incorrect discount code, the system should reflect that
   * @given I have a product in my cart
   * @and I am on the cart page
   * @when I enter a wrong discount code
   * @then I should get a notification that the code did not work.
   */

  test('Using an invalid coupon code should give an error',{ tag: ['@checkout', '@coupon-code'] }, async ({page}) => {
    const checkout = new CheckoutPage(page);
    await checkout.enterWrongCouponCode("incorrect discount code");
  });
});

