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
    const mainMenu = new MainMenuPage(page);
    const miniCart = new MiniCartPage(page);
    const productPage = new ProductPage(page);

    await page.goto(slugs.productpage.simpleProductSlug);

    //TODO: Use a storagestate or API call to add product to the cart so shorten test time
    await productPage.addSimpleProductToCart();
    
    await mainMenu.openMiniCart();
    await expect(page.getByText(verify.miniCart.simpleProductInCartTitle)).toBeVisible();
    
    await miniCart.goToCheckout();
    


  });
});