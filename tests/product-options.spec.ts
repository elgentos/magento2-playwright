// @ts-check

import { guestTest as test } from '@utils/fixtures.utils';
import ApiClient from '@utils/apiClient.utils';
import {
	createCustomOptions,
	removeCustomOptions,
	type CustomOptionsProductFixture,
} from '@utils/customOptionsFixture.utils';
import { ProductOptionsPage } from '@poms/frontend/product-options.page';

test.describe('Custom product option tests', { tag: ['@product', '@cold'] }, () => {
	let apiClient: ApiClient;
	let fixture: CustomOptionsProductFixture;

	test.beforeAll(async () => {
		apiClient = await new ApiClient().create();
		fixture = await createCustomOptions(apiClient, test.info().project.name);
	});

	test.afterAll(async () => {
		if (fixture) {
			await removeCustomOptions(apiClient, fixture);
		}
		await apiClient.dispose();
	});

	// Assertions live in the page-object actions, including validation and cart persistence.
	// eslint-disable-next-line playwright/expect-expect
	test('Configure_every_supported_custom_option_type', async ({ page }) => {
		const productOptions = new ProductOptionsPage(page);
		await productOptions.selectRequiredOptions(fixture);
		await productOptions.addToCart(fixture);
		await productOptions.replaceExistingFile();
	});
});
