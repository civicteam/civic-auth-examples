# onSignIn Callback Testing

This directory contains comprehensive tests for the `onSignIn` callback functionality in Civic Auth.

## Overview

The `onSignIn` callback is a hook that executes after a sign-in attempt, whether successful or not. According to the [Civic Auth documentation](https://docs.civic.com/integration/react#advanced-configuration), it should be passed to the `CivicAuthProvider` component.

## Test Coverage

### Test Files

1. **`reactjs-onsignin-callback.spec.ts`** - Tests React.js implementation
2. **`nextjs-onsignin-callback.spec.ts`** - Tests Next.js implementation

### Test Scenarios

Each test file covers two critical scenarios:

#### 1. Successful Sign-In Callback
- **Purpose**: Verify `onSignIn` is called with no error parameter on successful authentication
- **Flow**: 
  - Navigate to test page with `onSignIn` callback
  - Click sign-in button
  - Complete authentication flow
  - Verify callback was called with success (no error)
- **Assertions**:
  - Console logs show success callback execution
  - No error logs are present

#### 2. Failed Sign-In Callback  
- **Purpose**: Verify `onSignIn` is called with error parameter on failed authentication
- **Flow**:
  - Navigate to test page with `onSignIn` callback
  - Intercept auth requests to simulate failure
  - Click sign-in button
  - Verify callback was called with error
- **Assertions**:
  - Console logs show error callback execution
  - Error parameter is properly passed

## Implementation Details

### Test Pages

- **React.js**: `/onsignin-test` route serves `OnSignInTest` component
- **Next.js**: `/onsignin-test` route serves `OnSignInTest` component

### Callback Implementation

```typescript
const handleSignIn = (error?: Error) => {
  if (error) {
    console.log('onSignIn callback - Error:', error.message);
  } else {
    console.log('onSignIn callback - Success: User signed in successfully');
  }
};
```

### Provider Configuration

```typescript
<CivicAuthProvider
  clientId={CLIENT_ID}
  onSignIn={handleSignIn}
  config={{ oauthServer: AUTH_SERVER || "https://auth.civic.com/oauth" }}
>
  {/* App content */}
</CivicAuthProvider>
```

## Running Tests

### Individual Test Files
```bash
# Run React.js onSignIn tests
yarn test:playwright packages/e2e/playwright/tests/civic-auth/onSignIn/reactjs-onsignin-callback.spec.ts

# Run Next.js onSignIn tests  
yarn test:playwright packages/e2e/playwright/tests/civic-auth/onSignIn/nextjs-onsignin-callback.spec.ts
```

### All onSignIn Tests
```bash
# Run all onSignIn callback tests
yarn test:playwright packages/e2e/playwright/tests/civic-auth/onSignIn/
```

### With Allure Reporting
```bash
# Generate detailed reports
yarn test:playwright:allure packages/e2e/playwright/tests/civic-auth/onSignIn/
yarn allure:serve
```

## Test Strategy Rationale

### Why These 4 Tests Are Sufficient

1. **Framework Coverage**: Both React.js and Next.js are the primary frontend frameworks
2. **Success + Error Paths**: The callback receives an optional `Error` parameter, requiring both scenarios
3. **E2E Approach**: Playwright tests verify real user flows and actual callback execution
4. **Real Integration**: Tests use actual Civic Auth components and authentication flows

### Why Not More Tests

- **UserButton vs Provider**: The `onSignIn` callback is designed for the `CivicAuthProvider`, not individual components
- **Custom Sign-In**: Custom sign-in buttons use the same underlying `signIn()` method, so they're covered by provider-level tests
- **Multiple Frameworks**: React.js and Next.js cover the main use cases; other frameworks would follow similar patterns

## Debugging

### Console Log Monitoring
Tests monitor console logs to verify callback execution:
- Success: `"onSignIn callback - Success: User signed in successfully"`
- Error: `"onSignIn callback - Error: [error message]"`

### Common Issues
1. **Callback Not Called**: Check that `onSignIn` is properly passed to `CivicAuthProvider`
2. **Wrong Error Handling**: Verify error parameter is properly checked in callback
3. **Timing Issues**: Tests include appropriate waits for async callback execution

## Future Enhancements

If additional test scenarios are needed:
1. **Multiple Callbacks**: Test multiple `onSignIn` callbacks
2. **Callback Chaining**: Test callback execution order
3. **Performance**: Test callback execution timing
4. **Error Types**: Test different error scenarios (network, validation, etc.)
