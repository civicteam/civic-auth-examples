# Passkey Authentication Testing

This directory contains tests for passkey authentication using Playwright. The tests use WebAuthn API mocking to simulate passkey authentication flows.

## Files

- `nextjs-passkey-login.spec.ts` - Main passkey authentication tests
- `../utils/passkey-helper.ts` - Utility functions for passkey testing

## Test Scenarios

### 1. Basic Passkey Registration and Login
Tests the complete flow of registering a new passkey and then using it to log in.

### 2. Existing User Passkey Authentication
Tests authentication with a user who already has passkey credentials registered.

### 3. Passkey Authentication Failure
Tests error handling when passkey authentication fails (user cancels, no credentials found, etc.).

### 4. Database Integration
Tests creating test users with passkey credentials in the database and cleaning them up.

### 5. Multiple Credentials
Tests handling multiple passkey credentials for the same user.

## How It Works

### WebAuthn API Mocking
The tests use Playwright's `addInitScript` to mock the WebAuthn API (`navigator.credentials`) in the browser. This allows us to:

- Simulate successful credential creation and retrieval
- Test error scenarios
- Control the authentication flow without requiring real hardware authenticators

### Virtual Authenticator
Instead of requiring real passkey hardware, the tests use a virtual authenticator that:

- Generates realistic credential IDs and responses
- Simulates the WebAuthn protocol
- Provides consistent behavior across test runs

### Database Integration
The tests can optionally create test users with passkey credentials in your database:

```typescript
// Create a test user with passkey
const testUser = PasskeyHelper.generateTestUser('passkey-test');
await passkeyDb.createTestUserWithPasskey({
  email: testUser.email,
  userId: testUser.userId,
  credentialId: testUser.credentialId,
  publicKey: 'mock-public-key-data'
});
```

## Running the Tests

```bash
# Run all passkey tests
npx playwright test nextjs-passkey-login.spec.ts

# Run specific test
npx playwright test nextjs-passkey-login.spec.ts -g "should complete passkey registration"

# Run with UI
npx playwright test nextjs-passkey-login.spec.ts --ui
```

## Configuration

### Environment Variables
Make sure you have the following environment variables set:

```bash
DATABASE_URL=your_database_connection_string
CLIENT_ID=your_civic_client_id
```

### Browser Compatibility
The tests handle different browser behaviors:

- **Chrome/Firefox**: Uses iframe flow for authentication
- **WebKit (Safari)**: Uses redirect flow for authentication

## Customization

### Adding New Test Scenarios
1. Create a new test in `nextjs-passkey-login.spec.ts`
2. Use the `PasskeyHelper` utilities for consistent behavior
3. Add appropriate assertions for your specific requirements

### Modifying WebAuthn Mocking
Edit the `PasskeyHelper` class in `passkey-helper.ts` to:

- Change credential generation logic
- Add new error scenarios
- Modify response formats

### Database Schema
If you need to adapt the database operations, modify the `PasskeyDatabaseHelper` class:

```typescript
// Example: Adapt to your schema
async createTestUserWithPasskey(userData) {
  await this.db.client.query(`
    INSERT INTO users (id, email, created_at) 
    VALUES ($1, $2, NOW())
  `, [userData.userId, userData.email]);
  
  await this.db.client.query(`
    INSERT INTO passkey_credentials (id, user_id, public_key, created_at)
    VALUES ($1, $2, $3, NOW())
  `, [userData.credentialId, userData.userId, userData.publicKey]);
}
```

## Best Practices

1. **Isolation**: Each test should be independent and clean up after itself
2. **Realistic Data**: Use realistic credential formats and sizes
3. **Error Testing**: Test both success and failure scenarios
4. **Browser Coverage**: Test across different browsers (Chrome, Firefox, Safari)
5. **Database Cleanup**: Always clean up test data to avoid test pollution

## Troubleshooting

### Common Issues

1. **Test Selectors Not Found**: Make sure the Civic Auth UI has the expected `data-testid` attributes
2. **Database Connection**: Verify your `DATABASE_URL` is correct and accessible
3. **Timeout Issues**: Increase timeout values if your auth server is slow
4. **Browser Differences**: Check that your test handles both iframe and redirect flows

### Debugging

Enable Playwright's debug mode:

```bash
npx playwright test nextjs-passkey-login.spec.ts --debug
```

Or add screenshots on failure:

```typescript
test('should complete passkey login', async ({ page }) => {
  // Your test code here
  await page.screenshot({ path: 'passkey-test.png' });
});
```

## Alternative Approaches

### Real Hardware Testing
For testing with real passkey hardware:

1. Use Playwright's device emulation
2. Configure real authenticators (YubiKey, etc.)
3. Handle actual biometric prompts

### Third-Party Libraries
Consider these libraries for more advanced WebAuthn testing:

- `@simplewebauthn/browser` - WebAuthn browser library
- `@simplewebauthn/server` - WebAuthn server library
- `webauthn-mock` - WebAuthn mocking library

### CI/CD Integration
For continuous integration:

```yaml
# Example GitHub Actions workflow
- name: Run Passkey Tests
  run: |
    npx playwright install
    npx playwright test nextjs-passkey-login.spec.ts --reporter=html
```

## Security Considerations

- Never use real user credentials in tests
- Use isolated test databases
- Clean up all test data after tests complete
- Don't commit sensitive configuration to version control
