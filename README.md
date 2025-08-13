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
    ```yarn install```
    ```yarn build```
    ```yarn dev```

* **Running cypress tests**:
    ```cd packages/e2e```:
    ```yarn install```
    ```yarn cypress open --browser chrome```

Note: One particular test, `nextjs-loginSuccessUrl.feature`, won't work unless the NextJS app is started with the `LOGIN_SUCCESS_URL` env var set to `"/customSuccessRoute"`. CI does this in the `test-login-success-url.yml` job, which specifically runs that spec.





## Updating Civic packages across all samples

Use the helper script to update `@civic/auth` and `@civic/auth-web3` wherever they are used. Run from the repo root.

- Dry-run (shows what would be updated):
```bash
scripts/update-auth.sh --dry-run
```

- Update both to latest with exact pinning (-E):
```bash
scripts/update-auth.sh --range exact
```

- Update to specific versions with caret range (default):
```bash
scripts/update-auth.sh --web3 0.7.2 --auth 0.9.5 --range caret
```

- Use tilde range:
```bash
scripts/update-auth.sh --web3 0.7.2 --auth 0.9.5 --range tilde
```

Notes:
- The script discovers projects that depend on `@civic/auth` or `@civic/auth-web3` and runs `yarn add` in each, updating their local `yarn.lock` files.
- When `--range exact` is used, dependencies are pinned exactly.
- Without `--range exact`, Yarn’s default range behavior applies.

