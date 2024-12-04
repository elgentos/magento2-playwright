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
// TODO: remove this beforeEach() once authentication as project set-up/fixture works.


// Before each test, log in
test.beforeEach(async ({ page }) => {
  let emailInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_EMAIL;
  let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

  if(!emailInputValue || !passwordInputValue) {
    throw new Error("Your password variable and/or your email variable have not defined in the .env file, or the account hasn't been created yet.");
  }

  const loginPage = new LoginPage(page);
  await loginPage.login(emailInputValue, passwordInputValue);
});

test.describe('Checkout actions', () => {
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
    await productPage.addSimpleProductToCart();
    await page.goto(slugs.checkoutSlug);    
  });

  test('Place order for simple product',{ tag: '@simple-product-order',}, async ({page}) => {
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.placeOrder();
  });

  // TODO: Write test to confirm order can be placed without an account
  // TODO: Write test for logged-in user who hasn't added an address yet.

});