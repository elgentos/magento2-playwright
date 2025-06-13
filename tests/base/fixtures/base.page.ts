import { Page } from '@playwright/test';

class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Waits for all Magewire requests to complete
   * This includes both UI indicators and actual network requests
   */
  async waitForMagewireRequests(): Promise<void> {
    // Wait for the Magewire messenger element to disappear or have 0 height
    await this.page.waitForFunction(() => {
      const element = document.querySelector('.magewire\\.messenger');
      return element && getComputedStyle(element).height === '0px';
    }, { timeout: 30000 });

    // Additionally wait for any pending Magewire network requests to complete
    await this.page.waitForFunction(() => {
      return !window.magewire || !(window.magewire as any).processing;
    }, { timeout: 30000 });

    // Small additional delay to ensure DOM updates are complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Waits for a specific network request to complete
   * @param urlPattern - URL pattern to match (e.g., '*/magewire/*')
   */
  async waitForNetworkRequest(urlPattern: string): Promise<void> {
    await this.page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === 200,
      { timeout: 30000 }
    );

    // Small additional delay to ensure DOM updates are complete
    await this.page.waitForTimeout(500);
  }
}

export default BasePage;
