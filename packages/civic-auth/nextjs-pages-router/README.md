# Civic Auth NextJS Pages Router Example

This example demonstrates the challenges and gaps when attempting to use Civic Auth with NextJS Pages Router, following the "any backend" approach.

## Executive Summary: Pages Router Compatibility Analysis

**Current Status**: ❌ **NOT PRODUCTION READY**

While the Civic Auth SDK theoretically supports Pages Router through the "any backend" approach, our testing reveals **fundamental architectural gaps** that make it unsuitable for production use without significant additional development from Civic.

### Official Support Status

According to [Civic's official documentation](https://docs.civic.com/integration/nextjs):
> "These steps apply to the App Router. If you are using the Pages Router, please contact us for integration steps."

This confirms that **Pages Router is not officially supported** with documented integration steps.

## Critical Gaps Preventing Production Use

### 1. **PKCE Flow Incompatibility** 🚨 **BLOCKING**
- **Issue**: "Code verifier not found in storage" error during OAuth callback
- **Root Cause**: The React SDK's PKCE implementation expects browser-based storage, but Pages Router's server-side callback handling creates a storage context mismatch
- **Impact**: Authentication flow fails completely
- **Evidence**: Consistent reproduction in our testing environment

### 2. **Dual Storage Context Problem** 🚨 **BLOCKING**  
- **Issue**: Pages Router requires different storage implementations for:
  - API routes (`NextJSApiCookieStorage`)
  - Server-side rendering (`NextJSCookieStorage`) 
- **Root Cause**: No unified storage abstraction for Pages Router contexts
- **Impact**: Session data inconsistency between client and server
- **Evidence**: Manual implementation required vs. App Router's built-in storage

### 3. **Missing NextJS Integration Layer** ⚠️ **HIGH IMPACT**
- **App Router Has**: Built-in `createCivicAuthPlugin`, automatic provider configuration, pre-built handlers
- **Pages Router Lacks**: Any NextJS-specific integration tooling
- **Impact**: Developers must manually implement OAuth flow, error handling, and configuration
- **Evidence**: Compare App Router's 10-line setup vs. Pages Router's 100+ lines of custom code

### 4. **Server-Side Authentication Gaps** ⚠️ **HIGH IMPACT**
- **App Router Has**: Built-in `getUser()` function for server components
- **Pages Router Requires**: Manual `CivicAuth` class instantiation in every `getServerSideProps`
- **Impact**: Significantly more complex server-side implementation
- **Evidence**: No equivalent convenience functions in the SDK for Pages Router

### 5. **No Route Protection Middleware** ⚠️ **MEDIUM IMPACT**
- **App Router Has**: Pre-built `authMiddleware()` for route protection
- **Pages Router Lacks**: Any built-in route protection mechanism
- **Impact**: Must implement custom authentication checks in every protected route
- **Evidence**: No Pages Router middleware examples in official documentation

## Architectural Comparison

| Feature | App Router | Pages Router | Gap Severity |
|---------|------------|--------------|--------------|
| OAuth Flow | ✅ Built-in handler | ❌ Manual implementation | 🚨 Blocking |
| PKCE Support | ✅ Seamless | ❌ Storage context issues | 🚨 Blocking |
| Provider Setup | ✅ Auto-configured | ⚠️ Manual client ID | ⚠️ High |
| Server-side Auth | ✅ `getUser()` function | ⚠️ Manual class instantiation | ⚠️ High |
| Route Protection | ✅ Built-in middleware | ❌ Custom implementation | ⚠️ Medium |
| Error Handling | ✅ Built-in | ❌ Manual implementation | ⚠️ Medium |

## Business Impact Assessment

### Development Effort Required
- **App Router**: ~2-4 hours for full implementation
- **Pages Router**: ~2-3 weeks for production-ready implementation (including error handling, testing, edge cases)

### Maintenance Burden
- **App Router**: Minimal - relies on official SDK updates
- **Pages Router**: High - custom implementation requires ongoing maintenance and testing

### Risk Assessment
- **App Router**: Low - officially supported, well-documented
- **Pages Router**: High - unsupported configuration, custom OAuth implementation

## Recommendations

### For Immediate Use
1. **Migrate to App Router**: This is the only officially supported path
2. **Use Alternative Auth**: Consider NextAuth.js or similar for Pages Router projects

### For Future Civic Development
To make Pages Router production-ready, Civic would need to develop:

1. **Pages Router Integration Package**: Similar to the App Router plugin
2. **Unified Storage Abstraction**: Handle context switching between API routes and SSR
3. **PKCE Flow Adaptation**: Resolve storage context issues in server-side callbacks
4. **Convenience Functions**: Pages Router equivalents of `getUser()`, `authMiddleware()`, etc.
5. **Official Documentation**: Complete integration guide with examples

## Technical Evidence Sources

- [Civic Auth Official Documentation](https://docs.civic.com/integration/nextjs)
- [Civic Auth NPM Package](https://www.npmjs.com/package/@civic/auth)
- App Router Example: `/packages/civic-auth/nextjs-app-router/`
- Express Backend Example: `/packages/civic-auth/express/`
- Testing Results: This Pages Router implementation attempt

---

## Current Implementation Status

**This implementation demonstrates the gaps but is NOT functional for production use.**

### What's Implemented
- ✅ Basic Pages Router structure with `CivicAuthProvider`
- ✅ Custom `NextJSCookieStorage` classes for different contexts  
- ✅ Manual API route handling for OAuth callbacks
- ✅ Server-side `CivicAuth` instantiation in `getServerSideProps`

### What's Broken
- ❌ **PKCE flow fails**: "Code verifier not found in storage" 
- ❌ **Authentication doesn't complete**: OAuth callback fails
- ❌ **Server-side user data always null**: Storage context mismatch
- ❌ **Sign out functionality broken**: No proper logout URL generation

## Running the Broken Example

⚠️ **This example will not work** but demonstrates the implementation attempt:

```bash
yarn install
yarn dev
```

The app will run on port 3001. You can attempt sign-in, but it will fail at the OAuth callback stage.

## Environment Setup

Create a `.env.local` file with:
```
NEXT_PUBLIC_CIVIC_CLIENT_ID=your-client-id-here
```