import { test, expect } from '@playwright/test';

import CategoryPage from './fixtures/category.page';

import slugs from './config/slugs.json';
import UIReference from './config/element-identifiers/element-identifiers.json';

test('Filter_category_on_size',{ tag: ['@category', '@cold']}, async ({page, browserName}) => {
  const categoryPage = new CategoryPage(page);
  await categoryPage.goToCategoryPage();

  await categoryPage.filterOnSize(browserName);
});

test('Sort_category_by_price',{ tag: ['@category', '@cold']}, async ({page}) => {
  const categoryPage = new CategoryPage(page);
  await categoryPage.goToCategoryPage();

  await categoryPage.sortProducts('price');
});

test('Change_amount_of_products_shown',{ tag: ['@category', '@cold'],}, async ({page}) => {
  const categoryPage = new CategoryPage(page);
  await categoryPage.goToCategoryPage();

  await categoryPage.showMoreProducts();
  // insert your code here
});

test('Switch_from_grid_to_list_view',{ tag: ['@category', '@cold'],}, async ({page}) => {
  const categoryPage = new CategoryPage(page);
  await categoryPage.goToCategoryPage();
  await categoryPage.switchView();
});