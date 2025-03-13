import {test, expect} from '@playwright/test';
import {LoginPage} from './fixtures/login.page';
import {ProductPage} from './fixtures/product.page';
import {AccountPage} from './fixtures/account.page';
import { CheckoutPage } from './fixtures/checkout.page';

import slugs from './config/slugs.json';
import UIReference from './config/element-identifiers/element-identifiers.json';
import outcomeMarker from './config/outcome-markers/outcome-markers.json';

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

  await page.goto(slugs.productpage.simpleProductSlug);
  await productPage.addSimpleProductToCart(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
  await page.goto(slugs.checkoutSlug);
});


test.describe('Checkout (login required)', () => {
  // Before each test, log in
  test.beforeEach(async ({ page, browserName }) => {
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    let emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
    let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

    if(!emailInputValue || !passwordInputValue) {
      throw new Error("MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn't been created yet.");
    }

    const loginPage = new LoginPage(page);
    await loginPage.login(emailInputValue, passwordInputValue);
    await page.goto(slugs.checkoutSlug);
  });

  /**
   * @feature Automatically fill in certain data in checkout (if user is logged in)
   * @scenario When the user navigates to the checkout (with a product), their name and address should be filled in.
   * @given I am logged in
   *  @and I have a product in my cart
   *  @and I have navigated to the checkout page
   * @then My name and address should already be filled in
   */
  test('My address should be already filled in at the checkout',{ tag: '@checkout',}, async ({page}) => {
    let signInLink = page.getByRole('link', { name: UIReference.credentials.loginButtonLabel });
    let addressField = page.getByLabel(UIReference.newAddress.streetAddressLabel);
    let addressAlreadyAdded = false;

    if(await signInLink.isVisible()) {
      throw new Error(`Sign in link found, user is not logged in. Please check the test setup.`);
    }

    // name field should NOT be on the page
    await expect(page.getByLabel(UIReference.personalInformation.firstNameLabel)).toBeHidden();

    if(await addressField.isVisible()) {
      if(!addressAlreadyAdded){
      // Address field is visible and addressalreadyAdded is not true, so we need to add an address to the account.
      const accountPage = new AccountPage(page);
      await accountPage.addNewAddress();
      } else {
        throw new Error(`Address field is visible even though an address has been added to the account.`);
      }
    }

    // expect to see radio button to select existing address
    let shippingRadioButton = page.locator(UIReference.checkout.shippingAddressRadioLocator).first();
    await expect(shippingRadioButton, 'Radio button to select address should be visible').toBeVisible();

  });


  /**
   * @feature Place order for simple product
   * @scenario User places an order for a simple product
   * @given I have a product in my cart
   *  @and I am on any page
   * @when I navigate to the checkout
   *  @and I fill in the required fields
   *  @and I click the button to place my order
   * @then I should see a confirmation that my order has been placed
   *  @and a order number should be created and show to me
   */
  test('Place order for simple product',{ tag: '@simple-product-order',}, async ({page}, testInfo) => {
    const checkoutPage = new CheckoutPage(page);
    let orderNumber = await checkoutPage.placeOrder();
    testInfo.annotations.push({ type: 'Order number', description: `${orderNumber}` });
  });
});

test.describe('Checkout (guest)', () => {
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
    test('Add coupon code in checkout',{ tag: ['@checkout', '@coupon-code']}, async ({page, browserName}) => {
      const checkout = new CheckoutPage(page);
      const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
      let discountCode = process.env[`MAGENTO_COUPON_CODE_${browserEngine}`];

      if(!discountCode) {
        throw new Error(`MAGENTO_COUPON_CODE_${browserEngine} appears to not be set in .env file. Value reported: ${discountCode}`);
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

  test('Remove coupon code from checkout',{ tag: ['@checkout', '@coupon-code']}, async ({page, browserName}) => {
    const checkout = new CheckoutPage(page);
    const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
    let discountCode = process.env[`MAGENTO_COUPON_CODE_${browserEngine}`];

    if(!discountCode) {
      throw new Error(`MAGENTO_COUPON_CODE appears to not be set in .env file. Value reported: ${discountCode}`);
    }

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

  /**
   * @feature Place order for simple product
   * @scenario User places an order for a simple product
   * @given I have a product in my cart
   *  @and I am on any page
   * @when I navigate to the checkout
   *  @and I fill in the required fields
   *  @and I click the button to place my order
   * @then I should see a confirmation that my order has been placed
   *  @and a order number should be created and show to me
   */
  test('Complete checkout with Check/Money Order payment', {
    tag: ['@checkout', '@guest'],
  }, async ({ page }, testInfo) => {
    test.slow();

    const checkoutPage = new CheckoutPage(page);

    await test.step('Navigate to checkout', async () => {
      await page.goto(slugs.checkoutSlug);
      await checkoutPage.waitForHyvaToasts();
    });

    await test.step('Fill guest address', async () => {
      await checkoutPage.fillGuestAddress();
      await checkoutPage.waitForHyvaToasts();
    });

    await test.step('Select state and shipping method', async () => {
      await checkoutPage.selectShipmentMethod();
      await checkoutPage.waitForHyvaToasts();
    });

    await test.step('Select payment method and place order', async () => {
      await checkoutPage.selectPaymentMethod('check');
      await checkoutPage.waitForHyvaToasts();

      // Wait for state dropdown to be interactive and visible
      await expect(page.getByLabel(UIReference.newAddress.provinceSelectLabel))
        .toBeEnabled();

      // Select state
      await page.getByLabel(UIReference.newAddress.provinceSelectLabel)
        .selectOption(UIReference.newAddress.defaultState);
      await checkoutPage.waitForHyvaToasts();

      // Ensure place order button is clickable
      await expect(checkoutPage.placeOrderButton).toBeEnabled({ timeout: 10000 });
      await checkoutPage.placeOrderButton.click();
      await checkoutPage.waitForHyvaToasts();
    });

    await test.step('Verify order number', async () => {
      // Verify order success message
      await expect(page.getByText('Order process completed'), 'Order completion message should be visible').toBeVisible();
      const orderNumberElement = page.locator('p').getByText('Your order # is:');
      await expect(orderNumberElement, 'Order number should be visible on confirmation page').toBeVisible();

      const orderNumber = await orderNumberElement.innerText();
      testInfo.annotations.push({
        type: 'Order created with Check / Money Order payment',
        description: orderNumber.replace('Your order # is:', '').trim()
      });
    });
  });
});


