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

  /**
   * @feature Page Status Checker
   *  @scenario Pages should give a 200 response
   *    @given I want to navigate to a page on the website
   *    @when I navigate to a page
   *    @then the page should give a 200 response
   */
  async navigateAndCheckStatus() {
    const response = await this.page.goto(this.url);
    expect(response?.status()).toBe(200);
  }

  /**
   * @feature Error Checker
   *  @scenario Playwright checks for errors
   *    @given There might be errors during the execution of a test
   *    @when The amount of errors in the console is more than 0
   *    @then Playwright captures these in the test report.
   */
  async waitAndCheckForErrors(timeout = 2000) {
    await this.page.waitForTimeout(timeout);
    await this.captureConsoleErrors();
    const errors = this.errorHandler.getErrors();
    this.errors = this.errors.concat(errors);
    expect(this.errors).toHaveLength(0);
  }

  /**
   * @feature Console Error Collection
   *  @scenario Errors have been captured in the console
   *    @given I run tests that trigger this function
   *    @when there are errors logged to the console
   *    @then these should be added to the errors object.
   */
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

  /**
   * @feature Performance Measure
   *  @scenario Loading time should not be greater than specified value
   *    @given I perform an action that requires loading (e.g. navigate to a page)
   *    @when the page is done loading
   *    @then the loading time should not be greater than the allowed loading time.
   */
  async measurePerformance() {
    const timing = JSON.parse(await this.page.evaluate(() => JSON.stringify(window.performance.timing)));
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    expect(loadTime).toBeLessThan(globalExpect.maxPageLoadTimeInMs);
  }

  /**
   * @feature Page Tester
   *  @scenario QA wants to check pages using the above features.
   *    @given I have set the flag to test pages for errors
   *    @when a test is performed that calls this function
   *    @then all the functions above should be executed.
   */
  async testPage() {
    if (flags.testForPageErrors) {
      await this.navigateAndCheckStatus();
      await this.waitAndCheckForErrors();
      await this.measurePerformance();
    }
  }
}
