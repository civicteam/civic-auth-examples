import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Get the Civic Auth version from the installed package
 */
function getCivicAuthVersion(): string {
  try {
    // Try to read from a test app's node_modules first
    const paths = [
      '../civic-auth/nextjs/node_modules/@civic/auth/package.json',
      '../civic-auth/reactjs/node_modules/@civic/auth/package.json',
      '../../node_modules/@civic/auth/package.json',
      '../../../node_modules/@civic/auth/package.json'
    ];
    
    for (const path of paths) {
      try {
        const packagePath = join(__dirname, path);
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
        return packageJson.version;
      } catch (error) {
        // Continue to next path
      }
    }
    
    // Fallback to environment variable or default
    return process.env.CIVIC_AUTH_VERSION || 'Latest';
  } catch (error) {
    return 'Latest';
  }
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './playwright/tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['allure-playwright', { 
      outputFolder: process.env.ALLURE_RESULTS_DIR || 'allure-results',
      detail: true,
      suiteTitle: false,
      environmentInfo: {
        'Test Environment': 'Development',
        'Civic Auth Version': getCivicAuthVersion(),
        'Report URL': 'https://civicteam.github.io/civic-auth-examples/civic-auth/',
        'GitHub Workflow': process.env.GITHUB_WORKFLOW || 'Local Run',
        'Run ID': process.env.GITHUB_RUN_ID || 'N/A'
      },
      categoriesPath: './allure-categories.json'
    }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Record video for failed tests */
    video: 'retain-on-failure',
    
    /* Take screenshots on failure */
    screenshot: 'only-on-failure',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    
    /* Set default timeout for all actions to 30 seconds */
    actionTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox also needs to ignore HTTPS errors for cross-origin auth server communication
        ignoreHTTPSErrors: true,
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // WebKit is stricter about cross-origin frame access and HTTPS errors
        ignoreHTTPSErrors: true,
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
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
