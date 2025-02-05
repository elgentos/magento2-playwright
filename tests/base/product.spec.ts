import { test, expect } from '@playwright/test';

import {ProductPage} from './fixtures/product.page';

import slugs from './config/slugs.json';
import UIReference from './config/element-identifiers/element-identifiers.json';
import outcomeMarker from './config/outcome-markers/outcome-markers.json';


test.describe('Product page tests',{ tag: '@product',}, () => {
  test('Add product to compare', async ({page}) => {
    const productPage = new ProductPage(page);
    await productPage.addProductToCompare(UIReference.productPage.simpleProductTitle, slugs.productpage.simpleProductSlug);
  });
});

test.describe('Simple product tests',{ tag: '@simple-product',}, () => {
  test.fixme('Simple tests will be added later', async ({ page }) => {});
});

test.describe('Configurable product tests',{ tag: '@conf-product',}, () => {
  test.fixme('Configurable tests will be added later', async ({ page }) => {});
});