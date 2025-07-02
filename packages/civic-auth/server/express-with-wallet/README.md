# Civic Auth Express Example with Wallet Creation

A minimal Express.js application demonstrating integration with **Civic Auth** for user authentication and **automatic wallet creation** on the backend using OAuth 2.0 and PKCE.

## 🚀 Prerequisites

- **Yarn**: Ensure you have _Yarn_ installed.
- **Civic Auth Account**: Obtain your `CLIENT_ID` from the [Civic Auth Dashboard](https://auth.civic.com/dashboard).

## 🛠 Installation

Install Dependencies using _Yarn_

```bash
yarn install
```

## 🔧 Configuration

Create a `.env` file in the root directory and set the following environment variables:

```env
CLIENT_ID=your_civic_auth_client_id
```

Optional environment variables:
```env
AUTH_SERVER=https://auth.civic.com/oauth  # Default OAuth server
PORT=3001                                 # Default port
```

## 🏃 Running the App

Start the Express server using _Yarn_:

```bash
yarn dev
```

The server will start on `http://localhost:3001`.

## 🔍 Usage

Visit `http://localhost:3001` to trigger a login process.

Once authenticated, visit `http://localhost:3001/admin/dashboard` to see your user information and **automatically created wallet addresses**.

## 📚 Further Reading

- [Civic Auth Documentation](https://docs.civic.com/)
- [Express.js Documentation](https://expressjs.com/)

---

Feel free to reach out to the [Civic Support Team](mailto:support@civic.com) for any questions or assistance with integration. 