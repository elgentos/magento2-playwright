import {expect, type Locator, type Page} from '@playwright/test';
import UIReference from '../config/element-identifiers/element-identifiers.json';
import outcomeMarker from '../config/outcome-markers/outcome-markers.json';

class NewsletterSubscriptionPage {
  readonly page: Page;
  readonly newsletterCheckElement: Locator;
  readonly saveSubscriptionsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newsletterCheckElement = page.getByLabel(UIReference.newsletterSubscriptions.generalSubscriptionCheckLabel);
    this.saveSubscriptionsButton = page.getByRole('button', {name:UIReference.newsletterSubscriptions.saveSubscriptionsButton});
  }

  async updateNewsletterSubscription(){
    
    if(await this.newsletterCheckElement.isChecked()) {
      // user is already subscribed, test runs unsubscribe 
      var subscriptionUpdatedNotification = outcomeMarker.account.newsletterRemovedNotification; 

      await this.newsletterCheckElement.uncheck();
      await this.saveSubscriptionsButton.click();
      
      var subscribed = false;
      
    } else {
      // user is not yet subscribed, test runs subscribe
      subscriptionUpdatedNotification = outcomeMarker.account.newsletterSavedNotification;
      
      await this.newsletterCheckElement.check();
      await this.saveSubscriptionsButton.click();

      subscribed = true;
    }

    await expect(this.page.getByText(subscriptionUpdatedNotification)).toBeVisible();
    return subscribed;
  }
}

export default NewsletterSubscriptionPage;
