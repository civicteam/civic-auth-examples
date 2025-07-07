# Vanilla JavaScript

Integrate Civic Auth into your Vanilla JavaScript application with just a few lines of code.

## Quick Start

### Prerequisites

- A Civic Auth Client ID (get it from [auth.civic.com](https://auth.civic.com))

### Installation

**NPM**

```bash
npm install @civic/auth
```

### Simple Setup

1. **HTML**:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App with Civic Auth</title>
  </head>
  <body>
    <h1>My App</h1>

    <button id="loginButton">Sign In</button>
    <button id="logoutButton">Sign Out</button>

    <div id="authContainer"></div>
    <script type="module" src="main.js"></script>
  </body>
</html>
```

2. **JavaScript** (`main.js`):

```javascript
import { CivicAuth } from "@civic/auth/vanillajs";

// Initialize auth directly with top-level await
const authClient = await CivicAuth.create({
  clientId: "YOUR_CLIENT_ID",
  targetContainerElement: document.getElementById("authContainer"),
});

// Sign in
document.getElementById("loginButton").addEventListener("click", async () => {
  try {
    const user = await authClient.startAuthentication();
  } catch (error) {
    console.error("Authentication failed:", error);
  }
});

// Sign out
document.getElementById("logoutButton").addEventListener("click", async () => {
  await authClient?.logout();
});
```

That's it! Replace `YOUR_CLIENT_ID` with your actual client ID and you're done.

### Configuration Options

| Field                    | Required | Default                          | Description                                                                               |
| ------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `clientId`               | Yes      | -                                | Your Civic Auth client ID from [auth.civic.com](https://auth.civic.com)                   |
| `redirectUrl`            | No       | Current URL                      | OAuth redirect URL after authentication                                                   |
| `targetContainerElement` | No       | -                                | DOM element where embedded iframe will be rendered                                        |
| `displayMode`            | No       | `embedded`                       | How the auth UI is displayed: `embedded`, `modal`, `redirect`, or `new_tab`               |
| `scopes`                 | No       | `['openid', 'profile', 'email']` | OAuth scopes to request                                                                   |
| `consent`                | No       | `consent`                        | Whether to show consent screen: `undefined`, `none`, `login`, `consent`, `select_account` |

### Display Modes

The `displayMode` option controls how the authentication UI is presented:

- **`embedded`** (default): The auth UI loads in an iframe within your specified container element
- **`modal`**: The auth UI opens in a modal overlay on top of your current page
- **`redirect`**: Full page navigation to the Civic auth server and back to your site
- **`new_tab`**: Opens auth flow in a new browser tab/popup window

### Logout

Logging out is very simple.

```javascript
const logout = async () => {
  await authClient?.logout();
};
```

**User object access:**

- Use `authClient.getCurrentUser()` to retrieve current user information before logout
- Use `authClient.isAuthenticated()` to check if user is currently logged in

## API Reference

### CivicAuth Class

#### `startAuthentication()`

Initiates the authentication process.

**Returns:** Promise that resolves when authentication completes or rejects on error

#### `getCurrentUser()`

Retrieves the current authenticated user's information.

**Returns:** Promise that resolves to a user object or null if not authenticated

#### `isAuthenticated()`

Checks if a user is currently authenticated.

**Returns:** Promise that resolves to a boolean indicating authentication status

#### `logout()`

Logs out the user.

Returns a boolean or throws an error if unsuccessful
