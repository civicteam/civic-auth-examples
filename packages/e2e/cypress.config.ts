import { defineConfig } from 'cypress';
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
// @ts-ignore
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild';

// The module doesn't work with typescript, so using require for compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');

import dotenv from 'dotenv';

dotenv.config();

module.exports = defineConfig({
  projectId: "cmyigw",
  // Uncomment if the 'rerun' isn't working as expected
  // videosFolder: 'cypress/videos',
  // video: true,
  videoCompression: true,
  // so that we don't get CORS errors in iframe mode
  chromeWebSecurity: false,
  retries: {
    experimentalStrategy: 'detect-flake-and-pass-on-threshold',
    experimentalOptions: {
      maxRetries: 1,
      passesRequired: 1
    },
    openMode: true,
    runMode: true
  },
  e2e: {
    defaultCommandTimeout: 20000,
    pageLoadTimeout: 30000,
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/**/*.feature',
    testIsolation: false,
    async setupNodeEvents(on, config) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const bundler = createBundler({
        plugins: [createEsbuildPlugin(config)],
      });
      on('file:preprocessor', bundler);
      await addCucumberPreprocessorPlugin(on, config);

      return config;
    },
  },
  env: {
    stepDefinitions: 'cypress/e2e/step_definitions/**/*.ts',
    clientId: process.env.CYPRESS_CLIENT_ID,
    NEXT_JS_BASE_URL: 'http://localhost:3000',
    REACT_BASE_URL: 'http://localhost:3001',
    EXPRESS_BASE_URL: 'http://localhost:3002',
    FASTIFY_BASE_URL: 'http://localhost:3003',
    HONO_BASE_URL: 'http://localhost:3004',
    WAGMI_BASE_URL: 'http://localhost:3005',
    SOLANA_BASE_URL: 'http://localhost:3006',
  },
});
