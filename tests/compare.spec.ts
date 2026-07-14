// @ts-check

import { test, expect } from '@playwright/test';
import { UIReference, outcomeMarker, slugs } from '@config';

import ComparePage from '@poms/frontend/compare.page';
import LoginPage from '@poms/frontend/login.page';
import ProductPage from '@poms/frontend/product.page';
import { requireEnv } from '@utils/env.utils';

// TODO: Create a fixture for this
test.beforeEach('Add 2 products to compare, then navigate to comparison page', async ({ page }) => {
  await test.step('Add products to compare', async () =>{
    const productPage = new ProductPage(page);
    await productPage.addProductToCompare(UIReference.text.frontend.product.simpleProduct, slugs.frontend.product.simple);
    await productPage.addProductToCompare(UIReference.text.frontend.product.secondSimpleProduct, slugs.frontend.product.secondSimple);
  });

  await test.step('Navigate to product comparison page', async () =>{
    const comparePageTitle = page.getByRole('heading', { name: UIReference.text.frontend.compare.title });
    await page.goto(slugs.frontend.product.comparison);
    await expect(comparePageTitle, `Heading ${comparePageTitle} is visible`).toBeVisible();
  });
});

/**
 * @feature Add product to cart from the comparison page
 * @scenario User adds a product to their cart from the comparison page
 * @given I am on the comparison page and have a product in my comparison list
 * @when I click the 'add to cart' button
 * @then I should see a notification that the product has been added
 */
test('Add_product_to_cart_from_comparison_page',{ tag: ['@comparison-page', '@cold']}, async ({page}) => {
  const comparePage = new ComparePage(page);
  await comparePage.addToCart(UIReference.text.frontend.product.simpleProduct);
});

/**
 * @feature A product cannot be added to the wishlist without being logged in
 * @scenario User attempt to add a product to their wishlist from the comparison page
 * @given I am on the comparison page and have a product in my comparison list
 * @when I click the 'add to wishlist' button
 * @then I should see an error message
 */
test('Guests_can_not_add_a_product_to_their_wishlist',{ tag: ['@comparison-page', '@cold']}, async ({page}) => {
  const errorMessage = page.locator(UIReference.selectors.shared.errorMessage);

  let productNotWishlistedNotificationText = outcomeMarker.comparePage.productNotWishlistedNotificationText;
  let addToWishlistButton = page.getByLabel(`${UIReference.text.shared.buttons.addToWishlist} ${UIReference.text.frontend.product.simpleProduct}`);
  await addToWishlistButton.click();
  await errorMessage.waitFor();
  await expect(page.getByText(productNotWishlistedNotificationText)).toBeVisible();

  await expect(page.url(), `Page has been redirect to login page`).toContain(slugs.frontend.account.login);
});

/**
 * @feature Add product to wishlist from the comparison page
 * @scenario User adds a product to their wishlist from the comparison page
 * @given I am on the comparison page and have a product in my comparison list
 *  @and I am logged in
 * @when I click the 'add to wishlist' button
 * @then I should see a notification that the product has been added to my wishlist
 */
test('Add_product_to_wishlist_from_comparison_page',{ tag: ['@comparison-page', '@hot']}, async ({page, browserName}) => {
  await test.step('Log in with account', async () =>{
	const id = test.info().parallelIndex;
	let user = `playwright+${id}@elgentos.nl`;
	let password = requireEnv(`MAGENTO_EXISTING_ACCOUNT_PASSWORD`);

	const loginPage = new LoginPage(page);
	await loginPage.login(user, password);
  });

  await test.step('Add product to compare', async () =>{
    const productPage = new ProductPage(page);
    await page.goto(slugs.frontend.product.comparison);
    await productPage.addProductToCompare(UIReference.text.frontend.product.simpleProduct, slugs.frontend.product.simple);
  });

  await test.step('Add product to wishlist', async () =>{
    const comparePage = new ComparePage(page);
    await comparePage.addToWishList(UIReference.text.frontend.product.simpleProduct);

    //TODO: Also remove the product for clear testing environment)
  });
});



test.afterEach('Remove products from compare', async ({ page }) => {
  // ensure we are on the right page
  await page.goto(slugs.frontend.product.comparison);

  page.on('dialog', dialog => dialog.accept());
  const comparePage = new ComparePage(page);
  await comparePage.removeProductFromCompare(UIReference.text.frontend.product.simpleProduct);
  await comparePage.removeProductFromCompare(UIReference.text.frontend.product.secondSimpleProduct);
});
