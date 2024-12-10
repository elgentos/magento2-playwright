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

  test('Add coupon code in cart',{ tag: ['@cart', '@coupon-code']}, async ({page}) => {
    
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

//TODO: Write test to add coupon
//TODO: Write test to remove coupon