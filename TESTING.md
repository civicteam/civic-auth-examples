# Testing Strategy for Civic Auth Examples

This document outlines our comprehensive testing strategy to ensure all code examples in documentation are valid, type-safe, and functional.

## 📋 Overview

All code snippets and examples in the Civic Auth documentation are **tested in CI** to guarantee they work correctly. This ensures developers can confidently copy-paste examples from our docs.

## 🎯 Testing Levels

### 1. **TypeScript Type Checking** (Fast Feedback)

Every example is type-checked to catch errors early.

**What:** Static analysis of TypeScript code without running it  
**When:** On every push, pull request  
**Duration:** ~2-5 minutes  
**Workflow:** `.github/workflows/typecheck.yml`

#### Projects Type-Checked:

**Web2 Examples:**
- ✅ Next.js example - TypeScript compiler (`tsc`)
- ✅ React example - TypeScript compiler (`tsc`)
- ✅ VanillaJS example - TypeScript compiler (`tsc`)
- ✅ Express server - TypeScript compiler (`tsc`)
- ✅ Fastify server - TypeScript compiler (`tsc`)
- ✅ Hono server - Bun's built-in type checking (during build)

**Web3 Examples:**
- ✅ Wagmi (Vite) - TypeScript compiler (`tsc`)
- ✅ Wagmi Next.js - TypeScript compiler (`tsc`)
- ✅ Solana Next.js 14 (with wallet adapter) - TypeScript compiler (`tsc`)
- ✅ Solana Next.js 14 (no wallet adapter) - TypeScript compiler (`tsc`)
- ✅ Solana Next.js 15 (with wallet adapter) - TypeScript compiler (`tsc`)
- ✅ Solana Next.js 15 (no wallet adapter) - TypeScript compiler (`tsc`)
- ✅ Solana Vite (with wallet adapter) - TypeScript compiler (`tsc`)
- ✅ Solana Vite (no wallet adapter) - TypeScript compiler (`tsc`)

**Testing Infrastructure:**
- ✅ E2E test suite - TypeScript compiler (`tsc`)

#### How to Run Locally:
```bash
# Check a specific example
cd packages/civic-auth/server/express
yarn typecheck

# Check all examples
cd packages/civic-auth/server/express && yarn typecheck
cd packages/civic-auth/server/fastify && yarn typecheck
cd packages/civic-auth/server/hono && yarn typecheck
cd packages/civic-auth/nextjs && yarn typecheck
cd packages/civic-auth/reactjs && yarn typecheck
```

### 2. **End-to-End (E2E) Tests** (Functional Validation)

Real browser tests that validate the complete authentication flow.

**What:** Automated browser tests using Playwright  
**When:** On every push, pull request, daily schedule  
**Duration:** ~15-30 minutes per test suite  
**Workflows:**  
- `.github/workflows/web2-e2e-tests-playwright-dev-mode.yml`
- `.github/workflows/web2-e2e-tests-playwright-start-mode.yml`
- `.github/workflows/web3-e2e-tests-playwright-dev-mode.yml`
- `.github/workflows/web3-e2e-tests-playwright-start-mode.yml`

#### Test Scenarios:

**Web2 Examples:**
- ✅ Next.js - Login, Email verification, Refresh tokens, Session rehydration, onSignIn callback
- ✅ React - Login, Email verification, onSignIn callback
- ✅ VanillaJS - Login (embedded, modal, new tab, redirect), Email verification, Refresh tokens, Session rehydration
- ✅ Express - Login, Email verification, loginSuccessUrl
- ✅ Fastify - Login, Email verification, loginSuccessUrl
- ✅ Hono - Login, Email verification, loginSuccessUrl

**Web3 Examples:**
- ✅ Wagmi - Login with wallet, balance display
- ✅ Solana with Wallet Adapter - Login, balance display
- ✅ Solana without Wallet Adapter - Login, balance display
- ✅ Embedded wallet flows

#### How to Run Locally:
```bash
cd packages/e2e

# Run all tests
yarn test:playwright

# Run specific test
yarn playwright test playwright/tests/civic-auth/login/express-login.spec.ts

# Run with UI for debugging
yarn test:playwright:ui

# Generate Allure report
yarn test:allure
```

### 3. **Build Verification**

All examples must successfully build before deployment.

**What:** Compile TypeScript, bundle assets, verify no build errors  
**When:** Part of E2E test workflow (runs before tests)  
**Included in:** All E2E test workflows

## 📊 Test Reports

### Allure Reports

Rich HTML reports with:
- ✅ Screenshots on failure
- ✅ Video recordings
- ✅ Step-by-step execution traces
- ✅ Historical trends

**View Reports:**
- **GitHub Actions Artifacts**: Download from any workflow run
- **GitHub Pages**: https://civicteam.github.io/civic-auth-examples/ (auto-published)

### How to View Reports Locally:
```bash
cd packages/e2e
yarn test:playwright:allure  # Run tests with Allure reporter
yarn allure:serve            # View report in browser
```

## 🔍 What Gets Tested

### Code Examples in Documentation

Every code snippet in our documentation corresponds to actual, tested code in this repository:

| Documentation Page | Example Location | Tests |
|-------------------|-----------------|-------|
| [React Integration](https://docs.civic.com/integration/react) | `packages/civic-auth/reactjs/` | E2E + TypeCheck |
| [Next.js Integration](https://docs.civic.com/integration/nextjs) | `packages/civic-auth/nextjs/` | E2E + TypeCheck |
| [VanillaJS Integration](https://docs.civic.com/integration/vanillajs) | `packages/civic-auth/vanillajs/` | E2E + TypeCheck |
| [Express Integration](https://docs.civic.com/integration/nodejs/express) | `packages/civic-auth/server/express/` | E2E + TypeCheck |
| [Fastify Integration](https://docs.civic.com/integration/nodejs/fastify) | `packages/civic-auth/server/fastify/` | E2E + TypeCheck |
| [Hono Integration](https://docs.civic.com/integration/nodejs/hono) | `packages/civic-auth/server/hono/` | E2E + TypeCheck |
| [Wagmi/Web3](https://docs.civic.com/web3/ethereum-evm) | `packages/civic-auth-web3/wagmi/` | E2E + TypeCheck |
| [Solana](https://docs.civic.com/web3/solana) | `packages/civic-auth-web3/solana/` | E2E + TypeCheck |

## 🚀 CI/CD Pipeline

```
┌─────────────────────┐
│   Code Push/PR      │
└──────────┬──────────┘
           │
           ├──────────────────────────────────┐
           ▼                                  ▼
┌─────────────────────┐          ┌─────────────────────┐
│  TypeScript Check   │          │  Version Check      │
│  (~2-5 minutes)     │          │  (npm packages)     │
│  ✓ All examples     │          └──────────┬──────────┘
└──────────┬──────────┘                     │
           │                                 │
           │  ✓ Type-safe                   │
           │                                 │
           ▼                                 ▼
┌──────────────────────────────────────────────────┐
│           E2E Tests (Playwright)                 │
│           (~15-30 min per suite)                 │
│  ┌──────────────┐  ┌──────────────┐             │
│  │   Web2       │  │   Web3       │             │
│  │  - Next.js   │  │  - Wagmi     │             │
│  │  - React     │  │  - Solana    │             │
│  │  - Vanilla   │  │              │             │
│  │  - Express   │  └──────────────┘             │
│  │  - Fastify   │                               │
│  │  - Hono      │                               │
│  └──────────────┘                               │
└──────────┬───────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Allure Reports     │
│  Published to       │
│  GitHub Pages       │
└─────────────────────┘
```

## ✅ Quality Guarantees

With this testing strategy, we guarantee:

1. **Type Safety**: All code is strictly type-checked with TypeScript
2. **Functional Correctness**: All authentication flows work end-to-end
3. **Multi-Browser Support**: Tests run on Chrome, Firefox, and Safari (WebKit)
4. **Regression Prevention**: Tests run on every change and daily
5. **Documentation Accuracy**: Code in docs matches tested examples

## 🛠️ Developer Workflow

### Before Committing:
```bash
# 1. Type check your changes
yarn typecheck

# 2. Run relevant E2E tests
cd packages/e2e
yarn playwright test [your-test-spec].spec.ts

# 3. Fix any issues
```

### Creating New Examples:
1. ✅ Add TypeScript configuration (`tsconfig.json`)
2. ✅ Add `typecheck` script to `package.json`
3. ✅ Create E2E test in `packages/e2e/playwright/tests/`
4. ✅ Add to CI workflow (`.github/workflows/`)
5. ✅ Verify in PR that all checks pass

## 📚 Additional Resources

- [E2E Testing Guide](./packages/e2e/README.md)
- [Allure Reports Documentation](./packages/e2e/README-Allure.md)
- [GitHub Pages Setup](./packages/e2e/README-GitHub-Pages.md)
- [Playwright Documentation](https://playwright.dev/)

## 🔧 Troubleshooting

### Type Check Failures
```bash
# Check specific file
npx tsc --noEmit src/your-file.ts

# Check with compiler options
npx tsc --noEmit --strict src/your-file.ts
```

### E2E Test Failures
```bash
# Run with UI mode for debugging
yarn test:playwright:ui

# Run with headed browser
yarn playwright test --headed

# Generate trace for debugging
yarn playwright test --trace on
```

### CI Failures
1. Check the specific workflow logs in GitHub Actions
2. Download artifacts (videos, screenshots, traces)
3. Review Allure report for detailed execution steps
4. Check if it's a flaky test (retry failures)

## 📞 Questions?

For questions about testing strategy or to report issues:
- Open an issue in this repository
- Contact the Civic Auth team

