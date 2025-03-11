import {test, expect} from '@playwright/test';
import {productTest} from './fixtures/fixtures';
import {LoginPage} from './poms/login.page';
import {AccountPage} from './poms/account.page';
import { CheckoutPage } from './poms/checkout.page';

import slugs from './config/slugs.json';
import UIReference from './config/element-identifiers/element-identifiers.json';
import outcomeMarker from './config/outcome-markers/outcome-markers.json';

/**
 * @feature User address data automatically filled in checkout
 * @scenario When the user navigates to the checkout (with a product), their name and address should be filled in.
 * @given I am logged in
 *  @and I have a product in my cart
 *  @and I have navigated to the checkout page
 * @then My name and address should already be filled in
 */
productTest('Address_is_filled_in_at_checkout_for_user', {tag: '@checkout'}, async ({userProductPage}) => {
  await userProductPage.page.goto(slugs.checkoutSlug);
  let addressField = userProductPage.page.getByLabel(UIReference.newAddress.streetAddressLabel);

  if(await addressField.isVisible()) {
    // Add an address field is visible
    await userProductPage.page.goto(slugs.account.addressBookSlug);
    // Check if the button 'Change billing address' is visible.
    if(await userProductPage.page.getByRole('link', { name: 'Change Billing Address arrow-' }).isVisible()) {
      throw new Error(`Address has seemingly been added, but is not filled in.`);
    } else {
      const accountPage = new AccountPage(userProductPage.page);
      await accountPage.addNewAddress();
      await userProductPage.page.goto(slugs.checkoutSlug);
    }
  }

  let shippingRadioButton = userProductPage.page.locator(UIReference.checkout.shippingAddressRadioLocator).first();
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
productTest('Place_order_for_simple_product', {tag: '@checkout'}, async ({userProductPage}, testInfo) => {
  const checkoutPage = new CheckoutPage(userProductPage.page);
  let orderNumber = await checkoutPage.placeOrder();
  testInfo.annotations.push({ type: 'Order number', description: `${orderNumber}` });
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
productTest('Add_coupon_code_in_checkout', {tag: ['@checkout', '@coupon-code']}, async ({productPage, browserName}) => {
  await productPage.page.goto(slugs.checkoutSlug);
  const checkout = new CheckoutPage(productPage.page);
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
productTest('Remove_coupon_code_in_checkout', {tag: ['@checkout', '@coupon-code']}, async ({productPage, browserName}) => {
  await productPage.page.goto(slugs.checkoutSlug);
  const checkout = new CheckoutPage(productPage.page);
  const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
  let discountCode = process.env[`MAGENTO_COUPON_CODE_${browserEngine}`];
  if(!discountCode) {
    throw new Error(`MAGENTO_COUPON_CODE_${browserEngine} appears to not be set in .env file. Value reported: ${discountCode}`);
  }

  // Check if coupon code has somehow been added already
  if(await productPage.page.getByText(outcomeMarker.checkout.checkoutPriceReducedSymbol).isVisible()){
    await checkout.removeDiscountCode();
  } else {
    await checkout.applyDiscountCodeCheckout(discountCode);
    await checkout.removeDiscountCode();
  }
});

/**
 * @feature Incorrect discount code check
 * @scenario The user provides an incorrect discount code, the system should reflect that
 * @given I have a product in my cart
 * @and I am on the cart page
 * @when I enter a wrong discount code
 * @then I should get a notification that the code did not work.
 */
productTest('Invalid_coupon_code_in_checkout_is_rejected', {tag: ['@checkout', '@coupon-code']}, async ({productPage, browserName}) => {
// test('Using an invalid coupon code should give an error',{ tag: ['@checkout', '@coupon-code'] }, async ({page}) => {
  await productPage.page.goto(slugs.checkoutSlug);  
  const checkout = new CheckoutPage(productPage.page);
  await checkout.enterWrongCouponCode("incorrect discount code");
});



// test.describe('Checkout (login required)', () => {
//   // Before each test, log in
//   test.beforeEach(async ({ page, browserName }) => {
//     const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
//     let emailInputValue = process.env[`MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine}`];
//     let passwordInputValue = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

//     if(!emailInputValue || !passwordInputValue) {
//       throw new Error("MAGENTO_EXISTING_ACCOUNT_EMAIL_${browserEngine} and/or MAGENTO_EXISTING_ACCOUNT_PASSWORD have not defined in the .env file, or the account hasn't been created yet.");
//     }

//     const loginPage = new LoginPage(page);
//     await loginPage.login(emailInputValue, passwordInputValue);
//     await page.goto(slugs.checkoutSlug);
//   });
  
//   /**
//    * @feature Automatically fill in certain data in checkout (if user is logged in)
//    * @scenario When the user navigates to the checkout (with a product), their name and address should be filled in.
//    * @given I am logged in
//    *  @and I have a product in my cart
//    *  @and I have navigated to the checkout page
//    * @then My name and address should already be filled in
//    */
//   test('My address should be already filled in at the checkout',{ tag: '@checkout',}, async ({page}) => {
//     let signInLink = page.getByRole('link', { name: UIReference.credentials.loginButtonLabel });
//     let addressField = page.getByLabel(UIReference.newAddress.streetAddressLabel);
//     let addressAlreadyAdded = false;

//     if(await signInLink.isVisible()) {
//       throw new Error(`Sign in link found, user is not logged in. Please check the test setup.`);
//     }

//     // name field should NOT be on the page
//     await expect(page.getByLabel(UIReference.personalInformation.firstNameLabel)).toBeHidden();

//     if(await addressField.isVisible()) {
//       if(!addressAlreadyAdded){
//       // Address field is visible and addressalreadyAdded is not true, so we need to add an address to the account.
//       const accountPage = new AccountPage(page);
//       await accountPage.addNewAddress();
//       } else {
//         throw new Error(`Address field is visible even though an address has been added to the account.`);
//       }
//     }

//     // expect to see radio button to select existing address
//     let shippingRadioButton = page.locator(UIReference.checkout.shippingAddressRadioLocator).first();
//     await expect(shippingRadioButton, 'Radio button to select address should be visible').toBeVisible();

//   });


//   /**
//    * @feature Place order for simple product
//    * @scenario User places an order for a simple product
//    * @given I have a product in my cart
//    *  @and I am on any page
//    * @when I navigate to the checkout
//    *  @and I fill in the required fields
//    *  @and I click the button to place my order
//    * @then I should see a confirmation that my order has been placed
//    *  @and a order number should be created and show to me
//    */
//   test('Place order for simple product',{ tag: '@simple-product-order',}, async ({page}, testInfo) => {
//     const checkoutPage = new CheckoutPage(page);
//     let orderNumber = await checkoutPage.placeOrder();
//     testInfo.annotations.push({ type: 'Order number', description: `${orderNumber}` });
//   });
// });

// test.describe('Checkout (guest)', () => {
//   /**
//    * @feature Discount Code
//    * @scenario User adds a discount code to their cart
//    * @given I have a product in my cart
//    *  @and I am on my cart page
//    * @when I click on the 'add discount code' button
//    * @then I fill in a code
//    *  @and I click on 'apply code'
//    * @then I should see a confirmation that my code has been added
//    *  @and the code should be visible in the cart
//    *  @and a discount should be applied to the product
//    */
//     test('Add coupon code in checkout',{ tag: ['@checkout', '@coupon-code']}, async ({page, browserName}) => {
//       const checkout = new CheckoutPage(page);
//       const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
//       let discountCode = process.env[`MAGENTO_COUPON_CODE_${browserEngine}`];

//       if(!discountCode) {
//         throw new Error(`MAGENTO_COUPON_CODE_${browserEngine} appears to not be set in .env file. Value reported: ${discountCode}`);
//       }

//       await checkout.applyDiscountCodeCheckout(discountCode);
//     });

//   /**
//    * @feature Remove discount code from checkout
//    * @scenario User has added a discount code, then removes it
//    * @given I have a product in my cart
//    * @and I am on the checkout page
//    * @when I add a discount code
//    * @then I should see a notification
//    * @and the code should be visible in the cart
//    * @and a discount should be applied to a product
//    * @when I click the 'cancel coupon' button
//    * @then I should see a notification the discount has been removed
//    * @and the discount should no longer be visible.
//    */

//   test('Remove coupon code from checkout',{ tag: ['@checkout', '@coupon-code']}, async ({page, browserName}) => {
//     const checkout = new CheckoutPage(page);
//     const browserEngine = browserName?.toUpperCase() || "UNKNOWN";
//     let discountCode = process.env[`MAGENTO_COUPON_CODE_${browserEngine}`];

//     if(!discountCode) {
//       throw new Error(`MAGENTO_COUPON_CODE appears to not be set in .env file. Value reported: ${discountCode}`);
//     }

//     await checkout.applyDiscountCodeCheckout(discountCode);
//     await checkout.removeDiscountCode();
//   });

//   /**
//    * @feature Incorrect discount code check
//    * @scenario The user provides an incorrect discount code, the system should reflect that
//    * @given I have a product in my cart
//    * @and I am on the cart page
//    * @when I enter a wrong discount code
//    * @then I should get a notification that the code did not work.
//    */

//   test('Using an invalid coupon code should give an error',{ tag: ['@checkout', '@coupon-code'] }, async ({page}) => {
//     const checkout = new CheckoutPage(page);
//     await checkout.enterWrongCouponCode("incorrect discount code");
//   });
// });

