import { test, expect } from '@playwright/test';
import { DatabaseUtil } from '../../utils/database';
import { PasskeyHelper, PasskeyDatabaseHelper, MockCredential } from '../../utils/passkey-helper';

test.describe('Next.js Passkey Login Tests', () => {
  let db: DatabaseUtil;
  let passkeyDb: PasskeyDatabaseHelper;

  test.beforeAll(async () => {
    // Initialize database connection
    db = new DatabaseUtil();
    await db.connect();
    passkeyDb = new PasskeyDatabaseHelper(db);
  });

  test.afterAll(async () => {
    // Clean up database connection
    await db.disconnect();
  });

  test('should complete passkey registration and login flow with virtual authenticator', async ({ page, browserName }) => {
    // Set up WebAuthn API mocking
    PasskeyHelper.setupWebAuthnMock(page);

    // Open the app home page
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Click the sign in button
    await page.getByTestId('sign-in-button').click();
    
    // Click passkey button using helper
    await PasskeyHelper.clickPasskeyButton(page, browserName);
    
    // All browsers use redirect flow for passkey authentication
    // Handle the passkey flow (including support check issues)
    await PasskeyHelper.handleFirstTimePasskeyFlow(page);
    
    // Wait for authentication to complete
    // await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 20000 });
    
    // Confirm logged in state
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
    
    // Verify successful login
    await expect(page.url()).not.toContain('loginSuccessUrl');
  });

  test('should handle passkey authentication with existing user', async ({ page, browserName }) => {
    // Create mock credentials for existing user
    const existingCredential: MockCredential = {
      id: 'existing-credential-id',
      type: 'public-key',
      rawId: new ArrayBuffer(32),
      response: {
        clientDataJSON: new ArrayBuffer(64),
        authenticatorData: new ArrayBuffer(64),
        signature: new ArrayBuffer(64),
        userHandle: new ArrayBuffer(32)
      }
    };

    // Set up WebAuthn API mocking with existing credentials
    PasskeyHelper.setupWebAuthnMockWithCredentials(page, [existingCredential]);

    // Open the app home page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Click the sign in button
    await page.getByTestId('sign-in-button').click();
    
    // Click passkey button using helper
    await PasskeyHelper.clickPasskeyButton(page, browserName);
    
    // Wait for authentication to complete
    // await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 20000 });
    
    // Confirm logged in state
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
  });

  test('should handle passkey authentication failure', async ({ page, browserName }) => {
    // Set up WebAuthn API mocking that fails
    PasskeyHelper.setupWebAuthnMockFailure(page, 'User cancelled');

    // Open the app home page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Click the sign in button
    await page.getByTestId('sign-in-button').click();
    
    // Click passkey button using helper
    await PasskeyHelper.clickPasskeyButton(page, browserName);
    
    // Wait for error message
    await PasskeyHelper.waitForPasskeyError(page);
    
    // Verify user is not logged in
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).not.toBeVisible();
  });

  test('should create test user with passkey in database', async ({ page, browserName }) => {
    // Generate unique test user data
    const testUser = PasskeyHelper.generateTestUser('passkey-test');
    
    // Create mock credential for the user
    const mockCredential = PasskeyHelper.createMockCredential(testUser.userId);
    
    // Set up the user in the database (if you have the schema)
    await passkeyDb.createTestUserWithPasskey({
      email: testUser.email,
      userId: testUser.userId,
      credentialId: testUser.credentialId,
      publicKey: 'mock-public-key-data'
    });

    // Set up WebAuthn API mocking with the created credential
    PasskeyHelper.setupWebAuthnMockWithCredentials(page, [mockCredential]);
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Click the sign in button
    await page.getByTestId('sign-in-button').click();
    
    // Click passkey button using helper
    await PasskeyHelper.clickPasskeyButton(page, browserName);
    
    // Wait for authentication to complete
    // await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 20000 });
    
    // Confirm logged in state
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
    
    // Clean up test user
    await passkeyDb.cleanupTestUser(testUser.userId);
  });

  test('should handle multiple passkey credentials for same user', async ({ page, browserName }) => {
    // Create multiple mock credentials for the same user
    const credentials: MockCredential[] = [
      PasskeyHelper.createMockCredential('user-123'),
      PasskeyHelper.createMockCredential('user-123'),
      PasskeyHelper.createMockCredential('user-123')
    ];

    // Set up WebAuthn API mocking with multiple credentials
    PasskeyHelper.setupWebAuthnMockWithCredentials(page, credentials);

    // Open the app home page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Click the sign in button
    await page.getByTestId('sign-in-button').click();
    
    // Click passkey button using helper
    await PasskeyHelper.clickPasskeyButton(page, browserName);
    
    // Wait for authentication to complete
    await page.waitForSelector('#civic-auth-iframe', { state: 'hidden', timeout: 20000 });
    
    // Confirm logged in state
    await expect(page.locator('#civic-dropdown-container').locator('button:has-text("Ghost")')).toBeVisible({ timeout: 20000 });
  });
});
