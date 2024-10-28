import {Page} from '@playwright/test';

export class Browser {
  page: Page;
  errors: string[] = [];

  constructor(page: Page) {
    this.page = page;
    this.errors = [];
    this._initializeListeners();
  }

  _initializeListeners() {
    // Listen for console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.errors.push(`Console error: ${msg.text()}`);
      }
      if (msg.type() === 'warning') {
        this.errors.push(`Console warning: ${msg.text()}`);
      }
    });

    // Listen for page errors (uncaught exceptions, etc.)
    this.page.on('pageerror', (exception) => {
      this.errors.push(`Page error: ${exception.message}`);
    });

    // Listen for failed requests
    this.page.on('requestfailed', (request) => {
      const failure = request.failure();
      if (failure) {
        this.errors.push(`Request failed: ${request.url()} - ${failure.errorText}`);
      }
    });
  }

  getErrors() {
    return this.errors;
  }
}
