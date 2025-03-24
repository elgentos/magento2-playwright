import { test, expect } from '@playwright/test';
import {ProductPage} from './fixtures/product.page';
import ComparePage from './fixtures/compare.page';

import slugs from './config/slugs.json';
import UIReference from './config/element-identifiers/element-identifiers.json';


// TODO: Create a fixture for this
test.beforeEach('Add 2 products to compare, then navigate to comparison page', async ({ page }) => {
  await test.step('Add products to compare', async () =>{
    const productPage = new ProductPage(page);
    await productPage.addProductToCompare(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
    await productPage.addProductToCompare(UIReference.productPage.secondSimpleProducTitle, slugs.productpage.secondSimpleProductSlug);
  });

  await test.step('Navigate to product comparison page', async () =>{
    await page.goto(slugs.productpage.productComparisonSlug);
    await expect(page.getByRole('heading', { name: 'Compare Products' }).locator('span')).toBeVisible();
  });
});

test('Add_product_to_cart_from_comparison_page', async ({page}) => {
  const comparePage = new ComparePage(page);
  await comparePage.addToCart(UIReference.productPage.simpleProductTitle);
});

test.afterEach('Remove products from compare', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  const comparePage = new ComparePage(page);
  await comparePage.removeProductFromCompare(UIReference.productPage.simpleProductTitle);
  await comparePage.removeProductFromCompare(UIReference.productPage.secondSimpleProducTitle);
});