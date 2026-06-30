// @ts-check

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from "node:fs";
import { getHttpCredentials } from '@utils/env.utils';

dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

// Files that should never be matched by the regular browser projects.
// setup.spec.ts is excluded because setup now runs as the 'setup' project
// (see init.setup.ts and the project block below). Defensive guard for any
// stray legacy or user copies as well.
const EXCLUDED_SPEC_FILES = new Set(['setup.spec.ts']);

function getTestFiles(baseDir: string, customDir?: string): string[] {
  const baseFiles = new Set(
      fs.readdirSync(baseDir)
          .filter(file => file.endsWith('.spec.ts'))
          .filter(file => !EXCLUDED_SPEC_FILES.has(file))
          .map(file => path.join(baseDir, file))
  );

  if (!customDir || !fs.existsSync(customDir)) {
    return Array.from(baseFiles);
  }

  const customFiles = fs.readdirSync(customDir)
      .filter(file => file.endsWith('.spec.ts'))
      .filter(file => !EXCLUDED_SPEC_FILES.has(file))
      .map(file => path.join(customDir, file));

  if (customFiles.length === 0) {
    return Array.from(baseFiles);
  }

  const testFiles = new Set<string>();

  // Get base files that have an override in custom
  for (const file of baseFiles) {
    const baseFilePath = path.join(baseDir, path.basename(file));
    const customFilePath = path.join(customDir, path.basename(file));

    testFiles.add(fs.existsSync(customFilePath) ? customFilePath : baseFilePath);
  }

  // Add custom tests that aren't in base
  for (const file of customFiles) {
    if (!baseFiles.has(path.basename(file))) {
      testFiles.add(file);
    }
  }

  return Array.from(testFiles);
}

function getSetupFiles(baseDir: string, customDir?: string): string[] {
  const baseFiles = new Set(
      fs.readdirSync(baseDir)
          .filter(file => file.endsWith('.setup.ts'))
          .map(file => path.join(baseDir, file))
  );

  if (!customDir || !fs.existsSync(customDir)) {
    return Array.from(baseFiles);
  }

  const customFiles = fs.readdirSync(customDir)
      .filter(file => file.endsWith('.setup.ts'))
      .map(file => path.join(customDir, file));

  if (customFiles.length === 0) {
    return Array.from(baseFiles);
  }

  const setupFiles = new Set<string>();

  for (const file of baseFiles) {
    const baseFilePath = path.join(baseDir, path.basename(file));
    const customFilePath = path.join(customDir, path.basename(file));
    setupFiles.add(fs.existsSync(customFilePath) ? customFilePath : baseFilePath);
  }

  for (const file of customFiles) {
    if (!baseFiles.has(path.basename(file))) {
      setupFiles.add(file);
    }
  }

  return Array.from(setupFiles);
}

const testFiles = getTestFiles(
    path.join(__dirname, 'base-tests'),
    path.join(__dirname, 'tests'),
);

const setupFiles = getSetupFiles(
    path.join(__dirname, 'base-tests'),
    path.join(__dirname, 'tests'),
);

function getArtifactRoot(): string {
  const currentDir = path.resolve(__dirname);
  const parts = currentDir.split(path.sep);
  const appIndex = parts.findIndex((part, index) =>
      part === 'app' &&
      parts[index + 1] === 'design' &&
      parts[index + 2] === 'frontend' &&
      parts[index + 5] === 'web' &&
      parts[index + 6] === 'playwright'
  );

  if (appIndex >= 0) {
    return path.resolve(currentDir, '../../../../../../../');
  }

  return currentDir;
}

const artifactRoot = getArtifactRoot();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Directory containing the test files */
  testDir: '.',
  /* Set an output directory */
  outputDir: path.join(artifactRoot, 'test-results'),
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  // workers: process.env.CI ? 1 : undefined,
  /* Increase default timeout */
  timeout: 60_000,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { outputFolder: path.join(artifactRoot, 'playwright-report') }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://hyva-demo.elgentos.io/',

    // Record video based on PLAYWRIGHT_VIDEO environment variable
    // See https://playwright.dev/docs/api/class-testoptions#test-options-video
    video: (process.env.PLAYWRIGHT_VIDEO as 'on' | 'off' | 'retain-on-failure' | 'on-first-retry') || 'retain-on-failure',

    // Create a screenshot at the end of a test if the test fails.
    // See https://playwright.dev/docs/api/class-testoptions#test-options-screenshot
    screenshot: (process.env.PLAYWRIGHT_SCREENSHOT as 'on' | 'off' | 'only-on-failure' | 'on-first-failure') || 'only-on-failure',

    // Collect trace when retrying a failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'retain-on-failure',

    /* Ignore https errors if they apply (should only happen on local) */
    ignoreHTTPSErrors: true,

    /* HTTP Basic Auth for environments behind HTTP authentication (e.g. review sites) */
    httpCredentials: getHttpCredentials(),
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: setupFiles,
      use: {
        ...devices['Desktop Chrome'],
        userAgent: 'Playwright',
        trace: 'on',
      },
    },

    {
      name: 'chromium',
      testMatch: testFiles,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        userAgent: 'Playwright'
      },
    },

    {
      name: 'firefox',
      testMatch: testFiles,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        userAgent: 'Playwright'
      },
    },

    {
      name: 'webkit',
      testMatch: testFiles,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Safari'],
        userAgent: 'Playwright'
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
