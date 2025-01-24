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
    runMode: 1,
    openMode: 0,
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
    tags: '',
    stage: '',
    NEXT_JS_BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
    REACT_BASE_URL: process.env.BASE_URL || 'http://localhost:3006',
    EXPRESS_BASE_URL: process.env.BASE_URL || 'http://localhost:3007',
    FASTIFY_BASE_URL: process.env.BASE_URL || 'http://localhost:3008',
    HONO_BASE_URL: process.env.BASE_URL || 'http://localhost:3009',
    WAGMI_BASE_URL: process.env.BASE_URL || 'http://localhost:3010',
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:3001',
    LOGIN_APP_URL: process.env.LOGIN_APP_URL || 'http://localhost:3004',
    DUMMY_APP_URL: process.env.DUMMY_APP_URL || 'http://localhost:9090',
    SAMPLE_REACT_JS_URL: process.env.SAMPLE_REACT_JS_URL || 'http://localhost:3030',
    SAMPLE_NEXT_JS_URL: process.env.SAMPLE_NEXT_JS_URL || 'http://localhost:3000',
  },
});
