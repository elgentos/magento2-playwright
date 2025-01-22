import {test, expect} from '@playwright/test';
import {MainMenuPage} from './fixtures/mainmenu.page';
import {HomePage} from './fixtures/home.page';

import verify from './config/expected/expected.json';

test('Add product on homepage to cart',{ tag: '@homepage',}, async ({page}) => {
  const homepage = new HomePage(page);
  const mainmenu = new MainMenuPage(page);

  await page.goto('');
  await homepage.addHomepageProductToCart();
  await mainmenu.openMiniCart();
  await expect(page.getByText('x ' + verify.homePage.firstProductName), 'product should be visible in cart').toBeVisible();
});