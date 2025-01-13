import { test, expect } from '@playwright/test';
import { ProductPage } from './fixtures/product.page';
import { MainMenuPage } from './fixtures/mainmenu.page';
import { CartPage } from './fixtures/cart.page';

import slugs from './config/slugs.json';
import selectors from './config/selectors/selectors.json';
import verify from './config/expected/expected.json';

test.describe('Cart functionalities', () => {
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


  test('Product can be added to cart',{ tag: '@cart',}, async ({page}) => {
    await expect(page.getByRole('strong').getByRole('link', {name: selectors.productPage.simpleProductTitle}), `Product is visible in cart`).toBeVisible();
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
  test('Remove product from cart',{ tag: '@cart',}, async ({page}) => {
    const cart = new CartPage(page);
    await cart.removeProduct(selectors.productPage.simpleProductTitle);
  });

});

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
  test('Simple product input to cart is consistent from PDP to checkout',{ tag: '@cart-price-check',}, async ({page}) => {
    var productPagePrice: string;
    var productPageAmount: string;
    var checkoutProductDetails: string[];

    const cart = new CartPage(page);

    await test.step('Step: Add simple product to cart', async () =>{
      const productPage = new ProductPage(page);
      await page.goto(slugs.productpage.simpleProductSlug);
      // set quantity to 2 so we can see that the math works
      await page.getByLabel('Quantity').fill('2');
  
      productPagePrice = await page.locator(selectors.productPage.simpleProductPrice).innerText();
      productPageAmount = await page.getByLabel(selectors.productPage.quantityFieldLabel).inputValue();
      await productPage.addSimpleProductToCart();

    });

    await test.step('Step: go to checkout, get values', async () =>{
      await page.goto(slugs.checkoutSlug);
      await page.waitForLoadState();

      // returns productPriceInCheckout and productQuantityInCheckout
      checkoutProductDetails = await cart.getCheckoutValues(selectors.productPage.simpleProductTitle, productPagePrice, productPageAmount);
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
  test('Configurable product input to cart is consistent from PDP to checkout',{ tag: '@cart-price-check',}, async ({page}) => {
    var productPagePrice: string;
    var productPageAmount: string;
    var checkoutProductDetails: string[];

    const cart = new CartPage(page);

    await test.step('Step: Add configurable product to cart', async () =>{
      const productPage = new ProductPage(page);
      await page.goto(slugs.productpage.configurableProductSlug);
      // set quantity to 2 so we can see that the math works
      await page.getByLabel('Quantity').fill('2');
  
      productPagePrice = await page.locator(selectors.productPage.simpleProductPrice).innerText();
      productPageAmount = await page.getByLabel(selectors.productPage.quantityFieldLabel).inputValue();
      await productPage.addConfigurableProductToCart();

    });

    await test.step('Step: go to checkout, get values', async () =>{
      await page.goto(slugs.checkoutSlug);
      await page.waitForLoadState();

      // returns productPriceInCheckout and productQuantityInCheckout
      checkoutProductDetails = await cart.getCheckoutValues(selectors.productPage.configurableProductTitle, productPagePrice, productPageAmount);
    });

    await test.step('Step: Calculate and check expectations', async () =>{
      await cart.calculateProductPricesAndCompare(productPagePrice, productPageAmount, checkoutProductDetails[0], checkoutProductDetails[1]);
    });
    
  });
});
