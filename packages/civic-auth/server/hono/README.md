# CivicAuth Hono Example App

A minimal Hono application demonstrating integration with **Civic Auth** for user authentication using OAuth 2.0 and PKCE. This example includes endpoints to initiate authentication, handle callbacks, and access protected routes.

## 🚀 Prerequisites

- **pnpm**: Ensure you have _pnpm_ installed.
- **Civic Auth Account**: Obtain your `CLIENT_ID` from the [Civic Auth Dashboard](https://auth.civic.com/dashboard).

## 🛠 Installation

Install Dependencies using _pnpm_

```bash
pnpm install
```

## 🔧 Configuration

Create a `.env` file in the root directory and set the following environment variables:

```env
CLIENT_ID=your_civic_auth_client_id
SESSION_SECRET=your_secure_session_secret
```

- **CLIENT_ID**: Your CivicAuth application client ID.

## 🏃 Running the App

Start the hono server using _pnpm_:

```bash
pnpm dev
```

The server will start on `http://localhost:3000`.

## 🔍 Usage

Visit `http://localhost:3000/` to trigger a login process.

## 📚 Further Reading

- [Civic Auth Documentation](https://docs.civic.com/)
- [Express.js Documentation](https://expressjs.com/)

---

Feel free to reach out to the [Civic Support Team](mailto:support@civic.com) for any questions or assistance with integration.
