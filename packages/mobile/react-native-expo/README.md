# Civic Auth Mobile App

React Native Expo app with OAuth2/OIDC authentication using Civic Auth for mobile environments. This example uses [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/) to handle the authentication.

## Quick Start

1. **Install dependencies**

   ```bash
   yarn install
   ```

2. **Create a Civic Auth account**

- Sign-up at [auth.civic.com](https://auth.civic.com) and get your client ID.
- Add the application domain as `civicauth:///` under the Domains Menu. This will allow the app to redirect back to the mobile app after authentication.

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Update the `EXPO_PUBLIC_CLIENTID` in `.env` with your Civic Auth client ID:

   ```bash
   EXPO_PUBLIC_CLIENTID=your-civic-client-id
   ```

4. **Start the app**
   ```bash
   npx expo start
   ```

## App Architecture

Single-page design with automatic authentication handling:

- **Main page** (`app/index.tsx`) - Shows sign-in or authenticated content.
- **AuthGuard** - Component to protect routes that need authentication.
- **AuthContext** - Centralized authentication state management and authentication flow control.

### Basic screen example

```typescript
import { AuthGuard } from "@/components/AuthGuard";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

function AuthenticatedContent() {
  const { state, signOut } = useContext(AuthContext);

  return (
    <View>
      <Text>Welcome, {state.user?.name}!</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}

export default function HomeScreen() {
  return (
    <AuthGuard>
      <AuthenticatedContent />
    </AuthGuard>
  );
}
```

## File Structure

```
app/
  ├── index.tsx           # Main page with AuthGuard
  └── _layout.tsx         # Root layout with AuthProvider

components/
  ├── AuthGuard.tsx       # Authentication wrapper
  └── AuthScreen.tsx      # Sign-in interface

contexts/
  └── AuthContext.tsx     # Authentication state management

config/
  └── civicAuth.ts        # Civic Auth configuration
```

## Development

The app uses [file-based routing](https://docs.expo.dev/router/introduction) and can be opened in:

- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

## Disclaimer

This project provides a minimal example of how to integrate Civic Auth into a React Native app. It still lacks some basic features that are not related to the core functionality but are required for a real-world application, like:

- Secure token storage to persist the authentication state between sessions.
- Refresh token handling for token expiration.
