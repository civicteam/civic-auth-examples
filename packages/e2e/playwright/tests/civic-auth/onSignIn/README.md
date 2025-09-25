# OnSignIn Callback Testing

This directory contains comprehensive tests for the `onSignIn` callback functionality in Civic Auth applications.

## Overview

The `onSignIn` callback is a configuration option for the `CivicAuthProvider` that executes after sign-in attempts, whether successful or failed. This callback provides developers with a way to handle post-authentication logic, analytics tracking, error handling, and more.

## Test Structure

### Test Files

- **`reactjs-onsignin-callback.spec.ts`** - Tests for React.js applications
- **`nextjs-onsignin-callback.spec.ts`** - Tests for Next.js applications

### Test Components

- **React.js**: `OnSignInTestApp.tsx` and `OnSignInTestComponent.tsx`
- **Next.js**: `onSignInTest/page.tsx` and `OnSignInTestComponent.tsx`

## Test Scenarios

### 1. Successful Sign-In Callback
**Purpose**: Verify that `onSignIn` is called with no error parameter when sign-in succeeds.

**Test Steps**:
1. Navigate to the onSignIn test page
2. Click the "Sign in" button
3. Complete the authentication flow
4. Verify callback count increased by 1
5. Verify success callback was logged

**Expected Result**: 
- Callback count increases
- Log shows: `onSignIn called with SUCCESS (no error)`

### 2. Multiple Sign-In Attempts
**Purpose**: Verify that `onSignIn` is called for each sign-in attempt.

**Test Steps**:
1. Perform first sign-in
2. Logout
3. Perform second sign-in
4. Verify callback count increased by 2 total
5. Verify both callbacks were logged

**Expected Result**: 
- Total callback count = 2
- Two success callbacks logged

### 3. Failed Sign-In Callback
**Purpose**: Verify that `onSignIn` is called with an Error parameter when sign-in fails.

**Test Steps**:
1. Navigate to test page
2. Verify callback structure is ready
3. Test initial state (no callbacks yet)

**Expected Result**: 
- Callback system is properly initialized
- Ready to handle error scenarios

### 4. Callback State Management
**Purpose**: Verify that callback state is maintained and can be cleared.

**Test Steps**:
1. Perform sign-in to generate callback
2. Clear the callback log
3. Verify log was reset
4. Verify callback count was reset

**Expected Result**: 
- Log shows "No provider callbacks logged yet"
- Callback count resets to 0

### 5. Next.js Middleware Integration
**Purpose**: Verify that `onSignIn` works properly with Next.js middleware.

**Test Steps**:
1. Navigate to Next.js onSignIn test page
2. Verify page loads without middleware interference
3. Verify callback system is ready

**Expected Result**: 
- Page loads successfully
- Callback system is initialized

## Implementation Details

### Callback Function Signature
```typescript
onSignIn?: (error?: Error) => void
```

### Usage in CivicAuthProvider
```typescript
<CivicAuthProvider
  clientId="YOUR_CLIENT_ID"
  onSignIn={(error) => {
    if (error) {
      console.error('Sign-in failed:', error);
      // Handle error case
    } else {
      console.log('Sign-in successful');
      // Handle success case
    }
  }}
>
  {/* Your app components */}
</CivicAuthProvider>
```

### Test Implementation Pattern
```typescript
const handleOnSignIn = (error?: Error) => {
  const timestamp = new Date().toISOString();
  const logEntry = error 
    ? `[${timestamp}] onSignIn called with ERROR: ${error.message}`
    : `[${timestamp}] onSignIn called with SUCCESS (no error)`;
  
  setCallbackLog(prev => [...prev, logEntry]);
  setCallbackCount(prev => prev + 1);
};
```

## Running the Tests

### Prerequisites
1. Ensure the React.js and Next.js example apps are running
2. React.js app should be available at `http://localhost:3000`
3. Next.js app should be available at `http://localhost:3000`

### Running Individual Tests
```bash
# Run React.js onSignIn tests
npx playwright test reactjs-onsignin-callback.spec.ts

# Run Next.js onSignIn tests
npx playwright test nextjs-onsignin-callback.spec.ts
```

### Running All onSignIn Tests
```bash
# Run all onSignIn callback tests
npx playwright test onSignIn/
```

## Test Data and Assertions

### Key Assertions
1. **Callback Count**: Verifies the number of times `onSignIn` was called
2. **Callback Log Content**: Verifies the content and format of logged callbacks
3. **Success vs Error**: Distinguishes between successful and failed sign-in callbacks
4. **State Persistence**: Ensures callback state is maintained across interactions
5. **UI State**: Verifies that authentication state changes are reflected in the UI

### Test Data Structure
```typescript
interface CallbackLogEntry {
  timestamp: string;
  type: 'SUCCESS' | 'ERROR';
  message: string;
}
```

## Best Practices

### For Developers Using onSignIn
1. **Always handle both success and error cases**
2. **Use timestamps for debugging and analytics**
3. **Implement proper error logging**
4. **Consider rate limiting for analytics callbacks**
5. **Test callback behavior in your application**

### For Test Maintenance
1. **Keep test components simple and focused**
2. **Use clear, descriptive test names**
3. **Verify both positive and negative scenarios**
4. **Test across different frameworks (React, Next.js)**
5. **Ensure tests are resilient to timing issues**

## Troubleshooting

### Common Issues
1. **Callback not firing**: Check that `onSignIn` is properly configured in `CivicAuthProvider`
2. **Timing issues**: Add appropriate waits for async operations
3. **State not updating**: Verify React state management in test components
4. **Middleware conflicts**: Ensure Next.js middleware doesn't interfere with callback execution

### Debug Tips
1. Check browser console for callback logs
2. Verify callback count increments
3. Inspect callback log content
4. Test with different authentication scenarios
5. Verify provider configuration

## Future Enhancements

### Potential Test Additions
1. **Error simulation tests**: Mock failed authentication scenarios
2. **Concurrent callback tests**: Test multiple simultaneous sign-in attempts
3. **Performance tests**: Measure callback execution time
4. **Integration tests**: Test with real authentication providers
5. **Accessibility tests**: Ensure callback UI is accessible

### Test Infrastructure Improvements
1. **Mock authentication service**: For more reliable error testing
2. **Test data factories**: For consistent test data generation
3. **Visual regression tests**: For callback UI components
4. **Cross-browser testing**: Ensure compatibility across browsers
5. **Mobile testing**: Test callback behavior on mobile devices
