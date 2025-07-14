// @ts-check

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from "node:fs";

dotenv.config({ path: path.resolve(__dirname, '.env') });

function getTestFiles(baseDir: string, customDir?: string): string[] {
  // TODO REMOVE WHEN PIPELINE IS FIXED
  console.log(`Getting test files from ${baseDir} and ${customDir}`);

  const baseFiles = new Set(fs.readdirSync(baseDir).filter(file => file.endsWith('.spec.ts')));

  if (!customDir || !fs.existsSync(customDir)) {
    return Array.from(baseFiles);
  }

  const customFiles = fs.readdirSync(customDir).filter(file => file.endsWith('.spec.ts'));

  if(customFiles.length === 0) {
    console.log(process.cwd());
    return Array.from(baseFiles);
  }

  const testFiles = new Set<string>();

  // Get base files that have an override in custom
  for (const file of baseFiles) {
    const baseFilePath = path.join(baseDir, file);
    const customFilePath = path.join(customDir, file);

    testFiles.add(fs.existsSync(customFilePath) ? customFilePath : baseFilePath);
  }

  // Add custom tests that aren't in base
  for (const file of customFiles) {
    if (!baseFiles.has(file)) {
      testFiles.add(path.join(customDir, file));
    }
  }

  return Array.from(testFiles);
}

const testFiles = getTestFiles(
    path.join(__dirname, 'base-tests'),
    path.join(__dirname, 'tests'),
);

console.log(testFiles);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Increase default timeout */
  timeout: 120_000,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://hyva-demo.elgentos.io/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Ignore https errors if they apply (should only happen on local) */
    ignoreHTTPSErrors: true,
  },

  /*
   * Setup for global cookie to bypass CAPTCHA, remove '.example' when used.
   * If this is disabled remove storageState from all project objects.
   */
  globalSetup: require.resolve('./bypass-captcha.config.ts'),

  /* Configure projects for major browsers */
  projects: [
    // Import our auth.setup.ts file
    //{ name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      name: 'chromium',
      testMatch: testFiles,
      use: {
        ...devices['Desktop Chrome'],
        storageState: './auth-storage/chromium-storage-state.json',
      },
    },

    {
      name: 'firefox',
      testMatch: testFiles,
      use: {
        ...devices['Desktop Firefox'],
        storageState: './auth-storage/firefox-storage-state.json',
      },
    },

    {
      name: 'webkit',
      testMatch: testFiles,
      use: {
        ...devices['Desktop Safari'],
        storageState: './auth-storage/webkit-storage-state.json',
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
