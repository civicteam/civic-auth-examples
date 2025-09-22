# civic-auth web3 Wagmi example with NextJS frontend code

## Setup
1. Create a `.env.local` file in this directory with your Civic Auth Client ID:
   ```
   CLIENT_ID=your-client-id-here
   ```
   Get your CLIENT_ID from [https://civic.com/](https://civic.com/)

2. Optionally, set a custom auth server (defaults to production):
   ```
   AUTH_SERVER=https://auth-dev.civic.com/oauth
   ```

3. Install dependencies and run:
   ```bash
   yarn && yarn dev
   ```

4. Log in with Civic, see your embedded wallet address and balance, and send ETH to another wallet