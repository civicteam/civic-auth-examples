# Civic Auth examples

This repository contains a collection of sample applications demonstrating how to integrate with the Civic Auth libraries - [@civic/auth](npmjs.com/package/@civic/auth) and [@civic/auth-web3](npmjs.com/package/@civic/auth-web3) - in various environments and frameworks.

## Contents
The repository includes the following samples:
* **Civic Auth**:
    * [NextJS](packages/civic-auth/nextjs): NextJS sample app integration with Civic Auth.
    * [ReactJS](packages/civic-auth/reactjs): ReactJS sample app integration with Civic Auth.
    * server:
        * [Express](packages/civic-auth/server/express): A minimal Express.js app integrated with Civic Auth for user authentication using OAuth 2.0 and PKCE.
        * [Hono](packages/civic-auth/server/hono): A minimal Hono app integrated with Civic Auth for user authentication using OAuth 2.0 and PKCE.

* **Civic Auth Web3**:
    * [Wagmi](packages/civic-auth-web3/wagmi): reference implementation of a simple Wagmi app integration with Civic Auth Web3 SDK.

* **Start apps**:
Before running, be sure to set the client id in .env files for each app. You can find 
examples in the .env.example files
    from the root:
    ```pnpm install```
    ```pnpm build```
    ```pnpm dev```

* **Running cypress tests**:
    ```cd packages/e2e```:
    ```pnpm install```
    ```pnpm cypress open --browser chrome```





