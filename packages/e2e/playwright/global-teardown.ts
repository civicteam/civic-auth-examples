import { FullConfig } from '@playwright/test';

/**
 * Global teardown - runs after all tests
 */
async function globalTeardown(config: FullConfig) {
  console.log('All tests completed');
}

export default globalTeardown;

