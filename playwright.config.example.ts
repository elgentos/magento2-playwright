import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from "node:fs";
dotenv.config({ path: path.resolve(__dirname, '.env') });

function getTestFiles(baseDir: string, customDir: string): string[] {
  const testFiles = new Set<string>();

  function getAllFiles(dir: string): string[] {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const allFiles: string[] = [];
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        allFiles.push(...getAllFiles(fullPath));
      } else {
        allFiles.push(fullPath);
      }
    }
    return allFiles;
  }

  const baseFiles = getAllFiles(baseDir);
  const customFiles = getAllFiles(customDir);

  const baseRelativePaths = new Map(
    baseFiles.map((file) => [path.relative(baseDir, file), file])
  );

  const customRelativePaths = new Map(
    customFiles.map((file) => [path.relative(customDir, file), file])
  );

  for (const [relativePath, baseFilePath] of baseRelativePaths.entries()) {
    const customFilePath = customRelativePaths.get(relativePath);
    testFiles.add(customFilePath || baseFilePath);
  }

  for (const [relativePath, customFilePath] of customRelativePaths.entries()) {
    if (!baseRelativePaths.has(relativePath)) {
      testFiles.add(customFilePath);
    }
  }

  return Array.from(testFiles);
}

const testFiles = getTestFiles(
  path.join(__dirname, 'tests', 'base'),
  path.join(__dirname, 'tests', 'custom'),
);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
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
    baseURL: process.env.BASE_URL || 'https://hyva-demo.elgentos.io/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Ignore https errors if they apply (should only happen on local) */
    ignoreHTTPSErrors: true,
  },
  /* Setup for global cookie to bypass CAPTCHA, remove '.example' when used */
  globalSetup: require.resolve('./bypass-captcha.config.example.ts'),

  /* Configure projects for major browsers */
  projects: [
    // TODO: uncomment the setup line once authentication works!
    // Import our auth.setup.ts file
    //{ name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      // TODO: uncomment dependency and storage state once authentication works!
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
        storageState: './auth-storage/firefox-storage-state.json', },
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
