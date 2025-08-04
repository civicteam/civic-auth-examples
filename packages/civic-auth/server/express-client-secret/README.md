```markdown
# CivicAuth Express Example App with Client Secret

A minimal Express.js application demonstrating integration with **Civic Auth** for user authentication using **OAuth 2.0 with Client Secret** instead of PKCE. This example shows how to implement server-side authentication flow suitable for confidential clients.

## 🚀 Prerequisites

- **Yarn**: Ensure you have _Yarn_ installed.
- **Civic Auth Account**: Obtain your `CLIENT_ID` and `CLIENT_SECRET` from the [Civic Auth Dashboard](https://auth.civic.com/dashboard).
- **Server Environment**: This example is designed for server-side applications where the client secret can be kept secure.

## 🛠 Installation

Install Dependencies using _Yarn_

```bash
yarn install
```

## 🔧 Configuration

Create a `.env` file in the root directory and set the following environment variables:

```env
CLIENT_ID=your_civic_auth_client_id
CLIENT_SECRET=your_civic_auth_client_secret
AUTH_SERVER=https://auth.civic.com/oauth
PORT=3000
```

- **CLIENT_ID**: Your CivicAuth application client ID.
- **CLIENT_SECRET**: Your CivicAuth application client secret (**Keep this secure!**)
- **AUTH_SERVER**: OAuth server URL (optional, defaults to `https://auth.civic.com/oauth`)
- **PORT**: Server port (optional, defaults to `3000`)

## 🏃 Running the App

Start the Express server using _Yarn_:

```bash
yarn dev
```

For production:

```bash
yarn build
yarn start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 🔍 Usage

Visit `http://localhost:3000` to trigger a login process.

Once authenticated, visit `http://localhost:3000/admin/hello`.

**Note**: This example uses **client secret authentication** instead of PKCE, making it suitable for server-side applications where the client secret can be securely stored.

## ⚠️ Security Considerations

**IMPORTANT**: The client secret must be kept secure and should never be:
- Exposed in client-side code
- Committed to version control
- Shared publicly
- Used in mobile or SPA applications

This authentication method is only suitable for:
- Server-side applications
- Backend services
- Applications running in secure server environments

## 📚 Further Reading

- [Civic Auth Documentation](https://docs.civic.com/)
- [Express.js Documentation](https://expressjs.com/)

---

Feel free to reach out to the [Civic Support Team](mailto:support@civic.com) for any questions or assistance with integration.
Can you just update the README here? I changed a lot. All I need you to do is make sure that this mentions that we're using client secret. 