// @ts-check

import {test, expect} from '@playwright/test';

import MainMenuPage from './poms/mainmenu.page';
import HomePage from './poms/home.page';

import { outcomeMarker } from './config';

test('Add product on homepage to cart',{ tag: ['@homepage', '@cold']}, async ({page}) => {
  const homepage = new HomePage(page);
  const mainmenu = new MainMenuPage(page);

  await page.goto('');
  await homepage.addHomepageProductToCart();
  await mainmenu.openMiniCart();
  await expect(page.getByText('x ' + outcomeMarker.homePage.firstProductName), 'product should be visible in cart').toBeVisible();
});