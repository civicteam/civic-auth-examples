import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Running global setup...');
  
  // Launch a browser to clear any existing sessions
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
  console.log('Global setup complete: Browser state cleared');
}

export default globalSetup;
