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
  /* Global teardown */
  globalTeardown: require.resolve('./playwright/global-teardown.ts'),
  /* Setup file to attach videos on failure */
  // setupMatch: '**/test-hooks.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 3 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html", { open: "never" }], // Don't auto-open in CI
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/results.xml" }],
    ["list"], // Console output for debugging
    ["allure-playwright", { 
      outputFolder: "allure-results",
      detail: true,
      suiteTitle: true,
    }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    
    /* Set default timeout for all actions to 30 seconds */
    actionTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome needs special flags for cross-origin iframe communication with localhost
        // This is required because the auth server (public network) communicates with localhost (private network)
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process,BlockInsecurePrivateNetworkRequests',
            '--disable-site-isolation-trials',
          ],
        },
      },
    },

    {
      name: 'Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox also needs to ignore HTTPS errors for cross-origin auth server communication
        ignoreHTTPSErrors: true,
      },
    },

    {
      name: 'WebKit',
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
