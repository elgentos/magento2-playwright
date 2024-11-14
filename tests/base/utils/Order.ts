import {expect, Page} from '@playwright/test';
import slugs from '../fixtures/before/slugs.json';
import cartSelectors from '../fixtures/during/selectors/cart.json';
import {Cart} from './Cart';
import { Account } from './Account';
import { Checkout } from './Checkout';

import checkoutExpected from '../fixtures/verify/expects/checkout.json'

export class Order {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async create() {
    const magentoAccountEmail = process.env.MAGENTO_EXISTING_ACCOUNT_EMAIL;
    const magentoAccountPassword = process.env.MAGENTO_EXISTING_ACCOUNT_PASSWORD;

    const account = new Account(this.page);
    await account.login(magentoAccountEmail, magentoAccountPassword);
    const cart = new Cart(this.page);
    await cart.addSimpleProductToCart(slugs.simpleProductSlug);

    await this.page.goto(slugs.cartSlug);
    await this.page.click(cartSelectors.toCheckoutButtonSelector);

    const checkout = new Checkout(this.page);
    await checkout.fastForward();

    await expect(this.page.locator(`text=${checkoutExpected.orderSucceedNotificationText}`)).toBeVisible();
  }
}
