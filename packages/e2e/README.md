# E2E Testing

This package contains end-to-end tests for all Civic Auth example applications using Playwright and Cypress.

## 🎯 Features

- **Playwright Tests**: Modern, reliable browser automation
- **Cypress Tests**: Alternative testing framework for some scenarios
- **Allure Reporting**: Rich, detailed test reports with videos and screenshots
- **Multi-browser Support**: Chrome, Firefox, Safari (WebKit)
- **CI/CD Integration**: Automatic test execution and report generation

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
yarn install

# Install Playwright browsers
yarn playwright install --with-deps
```

### Running Tests

#### Playwright Tests
```bash
# Run all Playwright tests
yarn test:playwright

# Run with UI mode
yarn test:playwright:ui

# Run with Allure reporting
yarn test:allure
```

#### Cypress Tests
```bash
# Open Cypress UI
yarn test:e2e

# Run Cypress tests
yarn test:e2e:run
```

## 📊 Allure Reports

### Local Development
```bash
# Run tests and view report immediately
yarn test:allure

# Or step by step
yarn test:playwright:allure
yarn allure:generate
yarn allure:open
```

### CI Reports
After GitHub Actions runs:
1. Go to the Actions tab
2. Download artifacts:
   - `allure-report-*` - HTML report (extract and open `index.html`)
   - `test-results-*` - Videos, screenshots, and traces
   - `allure-results-*` - Raw Allure data

## 🎬 Video Recording

Tests automatically record videos on failures:
- **Format**: WebM
- **Location**: `test-results/` directory
- **Allure Integration**: Videos embedded in failure reports
- **CI Upload**: Videos available as GitHub artifacts

## 📁 Test Structure

```
playwright/tests/
├── nextjs-login.spec.ts          # Next.js authentication flow
├── reactjs-login.spec.ts         # React.js authentication flow
├── express-login.spec.ts         # Express server authentication
├── fastify-login.spec.ts         # Fastify server authentication
├── hono-login.spec.ts            # Hono server authentication
├── vanillajs-login.spec.ts       # VanillaJS authentication
├── wagmi-login.spec.ts           # Wagmi Web3 authentication
└── solana-*.spec.ts              # Solana wallet integration tests
```

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)
- **Browsers**: Chrome, Firefox, Safari
- **Video Recording**: On failures only
- **Screenshots**: On failures only
- **Traces**: On failures only
- **Allure Reporter**: Automatic integration

### Allure Configuration
- **Results Directory**: `allure-results/`
- **Report Directory**: `allure-report/`
- **Video Attachments**: Automatic
- **Screenshot Attachments**: Automatic

## 🚀 CI/CD Integration

### GitHub Actions
- **Automatic Testing**: Runs on push/PR
- **Multi-browser**: Tests across Chrome, Firefox, Safari
- **Artifact Upload**: Reports, videos, and traces
- **Allure Reports**: Rich HTML reports with historical data

### Workflow Files
- `test-example-app-playwright.yml` - Main testing workflow
- `allure-report-publish.yml` - GitHub Pages publishing (optional)
- `e2e-tests-with-allure.yml` - Enhanced reporting workflow

## 📚 Documentation

- [Allure Reports](./README-Allure.md) - Detailed Allure setup and usage
- [GitHub Pages Integration](./README-GitHub-Pages.md) - Publishing reports to GitHub Pages

## 🐛 Troubleshooting

### Common Issues
1. **Browser not found**: Run `yarn playwright install --with-deps`
2. **Allure not working**: Check `yarn install` completed successfully
3. **Videos not appearing**: Ensure tests are failing (videos only on failures)
4. **CI failures**: Check artifact uploads in GitHub Actions

### Getting Help
- Check test output for detailed error messages
- Download CI artifacts for videos and traces
- Review Allure reports for step-by-step execution details
