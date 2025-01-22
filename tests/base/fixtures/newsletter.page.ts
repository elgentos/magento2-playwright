import {expect, type Locator, type Page} from '@playwright/test';
import selectors from '../config/selectors/selectors.json';
import verify from '../config/expected/expected.json';

export class NewsletterSubscriptionPage {
  readonly page: Page;
  readonly newsletterCheckElement: Locator;
  readonly saveSubscriptionsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newsletterCheckElement = page.getByLabel(selectors.newsletterSubscriptions.generalSubscriptionCheckLabel);
    this.saveSubscriptionsButton = page.getByRole('button', {name:selectors.newsletterSubscriptions.saveSubscriptionsButton});
  }

  async updateNewsletterSubscription(){
    
    if(await this.newsletterCheckElement.isChecked()) {
      // user is already subscribed, test runs unsubscribe 
      var subscriptionUpdatedNotification = verify.account.newsletterRemovedNotification; 

      await this.newsletterCheckElement.uncheck();
      await this.saveSubscriptionsButton.click();
      
      var subscribed = false;
      
    } else {
      // user is not yet subscribed, test runs subscribe
      subscriptionUpdatedNotification = verify.account.newsletterSavedNotification;
      
      await this.newsletterCheckElement.check();
      await this.saveSubscriptionsButton.click();

      subscribed = true;
    }

    await expect(this.page.getByText(subscriptionUpdatedNotification)).toBeVisible();
    return subscribed;
  }
}
