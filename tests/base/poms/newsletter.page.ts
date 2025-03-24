import {expect, type Locator, type Page} from '@playwright/test';

import slugs from '../config/slugs.json';

import UIReference from '../config/element-identifiers/element-identifiers.json';
import outcomeMarker from '../config/outcome-markers/outcome-markers.json';

export class NewsletterSubscriptionPage {
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
      await this.page.waitForLoadState();
    } else {
      // user is not yet subscribed, test runs subscribe
      subscriptionUpdatedNotification = outcomeMarker.account.newsletterSavedNotification;
      
      await this.newsletterCheckElement.check();
      await this.saveSubscriptionsButton.click();
      subscribed = true;
      await this.page.waitForLoadState();
    }

    await this.page.getByText(subscriptionUpdatedNotification).waitFor();
    await expect(this.page.getByText(subscriptionUpdatedNotification)).toBeVisible();

    // Navigate to newsletter page, because saving the subscription redirects to the account page
    await this.page.goto(slugs.account.newsLetterSlug);

    if(subscribed){
      await expect(this.newsletterCheckElement).toBeChecked();
    } else {
      await expect(this.newsletterCheckElement).not.toBeChecked();
    }
  }
}
