import {test, expect} from '@playwright/test';
import {MainMenuPage} from './fixtures/mainmenu.page';
import {ProductPage} from './fixtures/product.page';
import { MiniCartPage } from './fixtures/minicart.page';

import slugs from './config/slugs.json';
import inputvalues from './config/input-values/input-values.json';
import selectors from './config/selectors/selectors.json';
import verify from './config/expected/expected.json';

test.describe('Minicart Actions', {annotation: {type: 'Main Menu', description: 'Tests for the minicart'},}, () => {

  /** 
   * BEFORE EACH: Add product to cart, then open minicart
  */
  
  test.beforeEach(async ({ page }) => {
    const mainMenu = new MainMenuPage(page);
    const productPage = new ProductPage(page);

    //TODO: Use a storagestate or API call to add product to the cart so shorten test time
    await page.goto(slugs.productpage.simpleProductSlug);
    await productPage.addSimpleProductToCart();
    await mainMenu.openMiniCart();
  });

  /**
   * @feature Magento 2 Minicart to Checkout
   * @scenario User adds a product to cart, then uses minicart to navigate to checkout
   * @given I am on any page
   * @when I navigate to a (simple) product page
   *  @and I add it to my cart
   *  @then I should see a notification
   * @when I click the cart in the menu
   *  @then I should see a minicart open
   * @when I click on the 'to Checkout' button
   *  @then I should navigate to the checkout
   */

  test('Add product to minicart, navigate to checkout',{ tag: '@minicart-simple-product',}, async ({page}) => {
    const miniCart = new MiniCartPage(page);
    
    await expect(page.getByText(verify.miniCart.simpleProductInCartTitle)).toBeVisible();
    await miniCart.goToCheckout();
  });

  /**
   * @feature Magento 2 Minicart to Cart
   * @scenario User adds a product to cart, then uses minicart to navigate to their cart
   * @given I am on any page
   * @when I navigate to a (simple) product page
   *  @and I add it to my cart
   *  @then I should see a notification
   * @when I click the cart in the menu
   *  @then I should see a minicart open
   * @when I click on the 'to cart' button
   *  @then I should be navigated to the cart page
   */

  test('Add product to minicart, navigate to cart',{ tag: '@minicart-simple-product',}, async ({page}) => {
    const miniCart = new MiniCartPage(page);

    await expect(page.getByText(verify.miniCart.simpleProductInCartTitle)).toBeVisible();
    await miniCart.goToCart();
  });

  /**
   * @feature Magento 2 Minicart quantity change
   * @scenario User adds a product to the minicart, then adds another of that product
   * @given I am on a (simple) product page
   * @when I add a product to my cart
   *  @then I should see a notification
   * @when I click the minicart in the main menu
   *  @then I should see the minicart
   * @when I click on the pencil
   *  @then I should navigate to a product page that is in my cart
   * @when I change the amount
   *  @and I click 'update item' button
   *  @then I should see a confirmation
   *    @and the new amount should be shown in the minicart
   */
  test('Change quantity of a product in minicart',{ tag: '@minicart-simple-product',}, async ({page}) => {
    const miniCart = new MiniCartPage(page);

    await expect(page.getByText(verify.miniCart.simpleProductInCartTitle)).toBeVisible();
    await miniCart.updateProduct('3');
  });

  /**
   * @feature Magento 2 minicart product deletion
   * @scenario User adds product to cart, then removes from minicart
   * @given I am on a (simple) product page
   * @when I add a product to my cart
   *  @then I should see a notification
   * @when I click the minicart in the main menu
   *  @then I should see the minicart
   * @when I click on the delete button
   *  @then The product should not be in my cart anymore
   *  @and I should see a notification that the product was removed
   */
  test('Delete product from minicart',{ tag: '@minicart-simple-product',}, async ({page}) => {
    // insert your code here
  });
});