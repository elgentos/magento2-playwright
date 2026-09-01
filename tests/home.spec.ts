// @ts-check

import { test, expect } from '@playwright/test';
import { outcomeMarker } from '@config';

import { BaseMainMenuPage } from '@poms/frontend/mainmenu.page';
import { BaseHomePage } from '@poms/frontend/home.page';

test('Add_product_on_homepage_to_cart', { tag: ['@homepage', '@cold'] }, async ({ page }) => {
	const homepage = new BaseHomePage(page);
	const mainmenu = new BaseMainMenuPage(page);

	await homepage.goToHomePage();
	await homepage.addHomepageProductToCart();
	await mainmenu.openMiniCart();
	await expect(
		page.getByText('x ' + outcomeMarker.homePage.firstProductName),
		'product should be visible in cart',
	).toBeVisible();
});
