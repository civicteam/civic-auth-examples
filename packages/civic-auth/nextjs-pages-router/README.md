# Civic Auth NextJS Pages Router Example

This example demonstrates using Civic Auth with NextJS Pages Router, following the "any backend" approach.

## Key Differences from App Router

1. **Provider Setup**: Uses `_app.tsx` with `CivicAuthProvider` from `@civic/auth/react` instead of the NextJS-specific wrapper
2. **Client ID Configuration**: Requires manual `clientId` prop configuration, whereas App Router handles this automatically through the `createCivicAuthPlugin` in `next.config.ts`
3. **API Routes**: Uses Pages Router API structure (`pages/api/auth/[...civicauth].ts`) with manual adaptation of App Router handlers
4. **Server-Side Auth**: No direct equivalent to App Router's `getUser()` function for server-side user data
5. **Client-Side Focused**: Currently relies primarily on client-side authentication state

## Gaps Identified Through Testing

1. **Manual Client ID Configuration**: 
   - **Gap**: Pages Router requires manual `clientId` prop in `CivicAuthProvider`
   - **App Router**: Client ID is automatically configured via `createCivicAuthPlugin` in `next.config.ts`
   - **Workaround**: Use environment variable `NEXT_PUBLIC_CIVIC_CLIENT_ID`

2. **API Handler Compatibility**: 
   - **Gap**: App Router handler returns `Response` objects, but Pages Router expects `NextApiResponse` methods
   - **Workaround**: Manual conversion between response formats in API route

3. **Server-Side User Data**: 
   - **Gap**: No built-in equivalent to App Router's `getUser()` function for server-side operations
   - **Impact**: Cannot easily get user data in `getServerSideProps` or API routes
   - **Workaround**: Rely on client-side user state via `useUser()` hook

4. **Sign Out Functionality**:
   - **Gap**: Sign out process encounters errors with the Auth server
   - **Status**: Identified during testing but needs investigation

5. **Session Management**: 
   - **Gap**: No built-in session handling for server-side operations
   - **Impact**: Difficult to protect server-side routes or API endpoints

## Running the Example

```bash
yarn install
yarn dev
```

The app will run on port 3001 to avoid conflicts with the App Router example.

## Environment Setup

Create a `.env.local` file with:
```
NEXT_PUBLIC_CIVIC_CLIENT_ID=your-client-id-here
```

## Implementation Status

✅ Basic authentication flow works  
✅ Sign in functionality works  
✅ Client-side user state management works  
❌ Sign out functionality has server errors  
❌ Server-side user data access not available  
❌ Server-side route protection not implemented