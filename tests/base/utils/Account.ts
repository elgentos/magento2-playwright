import {expect, Page} from '@playwright/test';
import slugs from '../fixtures/before/slugs.json';
import accountSelector from '../fixtures/during/selectors/account.json';
import accountExpected from '../fixtures/verify/expects/account.json';

export class Account {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login(email: string, password: string) {
    await this.page.goto(slugs.loginSlug);

    await this.page.fill(accountSelector.loginEmailAddressSelector, email);
    await this.page.fill(accountSelector.loginPasswordSelector, password);

    await this.page.click(accountSelector.loginButtonSelectorName);
    await expect(this.page).toHaveURL(new RegExp(`${slugs.afterLoginSlug}.*`));
  }

  async logout() {
    await this.page.locator(accountSelector.accountMenuItemsSelector).nth(accountSelector.logoutMenuItemPosition).click();
    await expect(this.page).toHaveURL(new RegExp(`${slugs.afterLogoutSlug}.*`));
  }

  /* TODO 11-11-2024 : If rewrite works, this is not necessary
  async subscribeToNewsletter() {
    await this.page.click(accountSelector.subscriptionCheckBoxSelector);
    await this.page.click(accountSelector.accountSaveButtonSelector);
    
    await expect(this.page.locator(`text=${accountExpected.accountNewsletterSubscribedNotificationText}`)).toBeVisible();
  }

  async unsubscribeFromNewsletter() {
    await this.page.click(accountSelector.subscriptionCheckBoxSelector);
    await this.page.click(accountSelector.accountSaveButtonSelector);

    await expect(this.page.locator(`text=${accountExpected.accountNewsletterUnsubscribedNotificationText}`)).toBeVisible();
  }
   END OF TODO */
}
