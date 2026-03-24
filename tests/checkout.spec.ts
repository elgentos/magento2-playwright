// @ts-check

// Import test and expect from utils to ensure authenticated state.
import { test, expect } from '@utils/fixtures.utils';

import ProductPage from '@poms/frontend/product.page';
import AccountPage from '@poms/frontend/account.page';
import MainMenuPage from '@poms/frontend/mainmenu.page';
import CheckoutPage from '@poms/frontend/checkout.page';

import { getCouponCode } from '@utils/env.utils';
import MagewireUtils from '@utils/magewire.utils';
import { UIReference, slugs } from '@config';

/**
 * Test Group: Checkout tests
 * @assume we're using the fixture with authenticated accounts
 */
test.describe('Checkout (logged in user)', () => {
	/**
	 * Before each test: set up monitoring and navigate to checkout with product
	 * @assume the user is already logged in
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test.beforeEach(async ({ page }) => {
		const magewire = new MagewireUtils(page);
		const productPage = new ProductPage(page);

		magewire.startMonitoring();

		await page.goto(slugs.productPage.simpleProductSlug);
		await productPage.addSimpleProductToCart(UIReference.productPage.simpleProductTitle, slugs.productPage.simpleProductSlug);
		await page.goto(slugs.checkout.checkoutSlug);
	});

	/**
	 * Test: The user's address should be prefilled in the checkout
	 * @assume the user already has an item in their cart.
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Address_is_pre_filled_in_checkout',{ tag: ['@checkout', '@hot']}, async ({page}) => {
		let signInLink = page.getByRole('link', { name: UIReference.credentials.loginButtonLabel });
		let addressField = page.getByLabel(UIReference.newAddress.streetAddressLabel);
		let addressAlreadyAdded = false;

		if(await signInLink.isVisible()) {
			throw new Error(`Sign in link found, user is not logged in. Please check the test setup.`);
		}

		// name field should NOT be on the page
		await expect(page.getByLabel(UIReference.personalInformation.firstNameLabel)).toBeHidden();

		if(await addressField.isVisible()) {
			if(!addressAlreadyAdded){
			// Address field is visible and addressalreadyAdded is not true, so we need to add an address to the account.
			const accountPage = new AccountPage(page);
			await accountPage.addNewAddress();
			} else {
				throw new Error(`Address field is visible even though an address has been added to the account.`);
			}
		}

		// expect to see radio button to select existing address
		let shippingRadioButton = page.locator(UIReference.checkout.shippingAddressRadioLocator).first();
		await expect(shippingRadioButton, 'Radio button to select address should be visible').toBeVisible();
	});

	/**
	 * Test: The user places an order for a (simple) product
	 * @assume the user already has an item in their cart.
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Place_order_for_simple_product',{ tag: ['@simple-product-order', '@hot'],}, async ({page}) => {
		const checkoutPage = new CheckoutPage(page);
		let orderNumber = await checkoutPage.placeOrder();
		test.info().annotations.push({ type: 'Order number', description: `${orderNumber}` });
	});
});

/**
 * Test Group: checkout tests for users that are *not* logged in (guests)
 */
test.describe('Checkout (guest)', () => {
	// Ensure we are *not* using the authenticated state.
	test.use({ storageState: { cookies: [], origins: [] } });

	/**
	 * Before each test: set op monitoring and add product to cart
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test.beforeEach(async({page}) => {
		// set up magewire monitoring
		const magewire = new MagewireUtils(page);
		magewire.startMonitoring();

		// ensure product in cart
		const productPage = new ProductPage(page);
		await page.goto(slugs.productPage.simpleProductSlug);
		await productPage.addSimpleProductToCart(UIReference.productPage.simpleProductTitle, slugs.productPage.simpleProductSlug);

		// to checkout
		await page.goto(slugs.checkout.checkoutSlug);
	});

	/**
	 * Test: a guest adds a coupon code in the checkout
	 * @param page - Playwright page instance used to interact with the website.
	 * @param browserName - name of the browser running the test. Used for the coupon code.
	 */
	test('Add_coupon_code_in_checkout',{ tag: ['@checkout', '@coupon-code', '@cold']}, async ({page, browserName}) => {
		const checkout = new CheckoutPage(page);
		const discountCode = getCouponCode(browserName);

		await checkout.applyDiscountCodeCheckout(discountCode);
	});

	/**
	 * Test: Verify the prices are being calculated correctly in the checkout
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Verify_price_calculations_in_checkout', { tag: ['@checkout', '@price-calculation'] }, async ({ page }) => {
		const productPage = new ProductPage(page);
		const checkoutPage = new CheckoutPage(page);

		// Add product to cart and go to checkout
		await productPage.addSimpleProductToCart(UIReference.productPage.simpleProductTitle, slugs.productPage.simpleProductSlug);
		await page.goto(slugs.checkout.checkoutSlug);

		// Select shipping method to trigger price calculations
		await checkoutPage.shippingMethodOptionFixed.check();

		// Wait for totals to update
		await expect(async () => {
			await page.locator('.magewire\\.messenger').waitFor({state: "hidden"});
		}).toPass();

		// Get all price components using the verifyPriceCalculations method from the CheckoutPage fixture
		await checkoutPage.verifyPriceCalculations();
	});

	/**
	 * Test: Guest removes coupon code from checkout
	 * @param page - Playwright page instance used to interact with the website.
	 * @param browserName - name of the browser running the test. Used for the coupon code.
	 */
	test('Remove_coupon_code_from_checkout',{ tag: ['@checkout', '@coupon-code', '@cold']}, async ({page, browserName}) => {
		const checkout = new CheckoutPage(page);
		const discountCode = getCouponCode(browserName);

		await checkout.applyDiscountCodeCheckout(discountCode);
		await checkout.removeDiscountCode();
	});

	/**
	 * Test: Using an invalid coupon code does not work
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Invalid_coupon_code_in_checkout_is_rejected',{ tag: ['@checkout', '@coupon-code', '@cold'] }, async ({page}) => {
		const checkout = new CheckoutPage(page);
		await checkout.enterWrongCouponCode("incorrect discount code");
	});

	/**
	 * Test: A guest can select payment methods in the checkout.
	 * @param page - Playwright page instance used to interact with the website.
	 */
	test('Guest_can_select_payment_methods', { tag: ['@checkout', '@payment-methods', '@cold'] }, async ({ page }) => {
		// Marking test as slow to allow more time before timeout
		test.slow();
		const checkoutPage = new CheckoutPage(page);
		await page.goto(slugs.checkout.checkoutSlug);

		await checkoutPage.fillShippingAddress();
		await checkoutPage.selectShippingMethod('fixed');
		await checkoutPage.selectPaymentMethod('check');

		let orderNumber = await checkoutPage.placeOrder();
		expect(orderNumber, 'Order number should be generated and returned').toBeTruthy();
	});
});
