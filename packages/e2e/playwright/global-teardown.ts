import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Running global teardown...');
  
  // Launch a browser to clear any test sessions
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Clear all browser data
  await context.clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  await browser.close();
  console.log('Global teardown complete: Browser state cleared');
}

export default globalTeardown;
