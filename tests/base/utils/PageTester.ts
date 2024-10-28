import {expect, Page} from '@playwright/test';
import {Browser} from './Browser';
import globalExpect from '../fixtures/verify/expects/global.json';
import flags from '../config/test-toggles.json';

export class PageTester {
  page: Page;
  url: string;
  errorHandler: Browser;
  errors: Object[];

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
    this.errorHandler = new Browser(page);
    this.errors = [];
  }

  async navigateAndCheckStatus() {
    const response = await this.page.goto(this.url);
    expect(response?.status()).toBe(200);
  }

  async waitAndCheckForErrors(timeout = 2000) {
    await this.page.waitForTimeout(timeout);
    await this.captureConsoleErrors();
    const errors = this.errorHandler.getErrors();
    this.errors = this.errors.concat(errors);
    expect(this.errors).toHaveLength(0);
  }

  async captureConsoleErrors() {
    this.page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        this.errors.push({
          message: msg.text(),
          location: msg.location(),
          type: msg.type()
        });
      }
    });
  }

  async measurePerformance() {
    const timing = JSON.parse(await this.page.evaluate(() => JSON.stringify(window.performance.timing)));
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    expect(loadTime).toBeLessThan(globalExpect.maxPageLoadTimeInMs);
  }

  async testPage() {
    if (flags.testForPageErrors) {
      await this.navigateAndCheckStatus();
      await this.waitAndCheckForErrors();
      await this.measurePerformance();
    }
  }
}
