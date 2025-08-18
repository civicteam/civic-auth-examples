# Allure Reporting for Playwright Tests

This project has been configured with [Allure Report](https://allurereport.org/) integration to provide rich, detailed test reports for your Playwright tests.

## Features

- **Rich test reports** with detailed step-by-step execution
- **Screenshots and attachments** for better debugging
- **Test categorization** with tags, features, and stories
- **Historical data** and trend analysis
- **CI/CD integration** with automatic report generation

## Local Development

### Prerequisites

Make sure you have the dependencies installed:

```bash
cd packages/e2e
yarn install
```

### Running Tests with Allure

#### Option 1: Run tests and immediately view report
```bash
yarn test:allure
```

This will:
1. Run Playwright tests with Allure reporter
2. Generate the HTML report
3. Serve the report in your browser automatically

#### Option 2: Step-by-step approach
```bash
# Run tests with Allure reporter
yarn test:playwright:allure

# Generate the report
yarn allure:generate

# Open the report in browser
yarn allure:open
```

### Available Scripts

- `yarn test:playwright:allure` - Run Playwright tests with Allure reporter only
- `yarn allure:generate` - Generate HTML report from results
- `yarn allure:open` - Open the generated report in browser
- `yarn allure:serve` - Generate and serve report in one command
- `yarn test:allure` - Run tests and serve report (recommended for local dev)

### Report Outputs

- **allure-results/** - Raw test execution data (JSON files)
- **allure-report/** - Generated HTML report

Both directories are gitignored and will be created automatically.

## CI/CD Integration

### GitHub Actions

The Allure integration is automatically enabled in CI workflows:

1. **Test Execution**: Tests run with Allure reporter
2. **Report Generation**: HTML reports are generated after test completion
3. **Artifact Upload**: Both raw results and HTML reports are uploaded as GitHub artifacts

### Accessing CI Reports

After a workflow run:

1. Go to the GitHub Actions run page
2. Look for artifacts section at the bottom
3. Download artifacts:
   - `allure-report-*` - HTML report (extract and open index.html)
   - `allure-results-*` - Raw data (for aggregating with other runs)

### Artifact Naming

Artifacts are named with the pattern:
- `allure-report-{project-path}-{browser}-{run-number}`
- `allure-results-{project-path}-{browser}-{run-number}`

This ensures unique artifacts for each test configuration.

## Report Features

### Test Organization

Tests are organized with:
- **Features**: High-level functionality areas
- **Stories**: User story classifications
- **Tags**: Searchable labels for filtering
- **Severity**: Critical, Major, Minor, Trivial

### Rich Test Data

Each test includes:
- **Steps**: Detailed step-by-step execution
- **Screenshots**: Automatic screenshots at key points
- **Attachments**: API responses, logs, and other data
- **Timing**: Execution duration and performance data
- **Browser Info**: Which browser/environment was used

### Historical Analysis

When running multiple test sessions:
- **Trends**: See pass/fail rates over time
- **Retries**: View retry attempts and patterns
- **Flaky Tests**: Identify unstable tests

## Example Test Enhancement

The `nextjs-login.spec.ts` file has been enhanced to demonstrate Allure features:

```typescript
import { allure } from 'allure-playwright';

test('should complete full login and logout flow', async ({ page, browserName }) => {
  // Test metadata
  await allure.description('This test validates the complete authentication flow');
  await allure.owner('E2E Team');
  await allure.tag('auth', 'login', 'logout', 'nextjs');
  await allure.severity('critical');
  await allure.story('User Authentication');
  await allure.feature('Login/Logout Flow');

  // Organized steps with screenshots
  await allure.step('Navigate to application homepage', async () => {
    await page.goto('http://localhost:3000');
    await allure.attachment('Homepage Screenshot', await page.screenshot(), { 
      contentType: 'image/png' 
    });
  });

  await allure.step('Initiate login process', async () => {
    await page.getByTestId('sign-in-button').click();
  });

  // ... more steps
});
```

## Best Practices

### Test Organization
- Use consistent feature and story names
- Apply relevant tags for filtering
- Set appropriate severity levels

### Screenshots and Attachments
- Take screenshots at key decision points
- Attach API responses for debugging
- Include relevant data as JSON attachments

### Step Organization
- Break complex tests into logical steps
- Use descriptive step names
- Nest related sub-steps appropriately

### Performance Considerations
- Screenshots add overhead - use judiciously
- Consider using screenshots only on failures in fast test suites
- Clean up old allure-results periodically

## Troubleshooting

### Report Generation Fails
```bash
# Clean and regenerate
rm -rf allure-results allure-report
yarn test:playwright:allure
yarn allure:generate
```

### Missing Screenshots
- Ensure screenshots are taken after page loads
- Check that elements are visible before screenshotting
- Verify sufficient timeouts for dynamic content

### CI Artifacts Not Appearing
- Check that tests actually ran (even failed tests generate reports)
- Verify the workflow completed (artifacts upload at the end)
- Ensure sufficient retention days in workflow configuration

## Further Reading

- [Allure Report Documentation](https://allurereport.org/docs/)
- [Allure Playwright Integration](https://allurereport.org/docs/frameworks/playwright/)
- [GitHub Actions Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
