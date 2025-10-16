#!/bin/bash

# Script to add diagnostic monitoring to all Playwright test files
# This helps debug CI failures by logging console messages and network errors

echo "Adding diagnostic monitoring to all test files..."

# Find all test spec files
find playwright/tests -name "*.spec.ts" -type f | while read -r file; do
  echo "Processing: $file"
  
  # Check if the file already has setupDiagnostics
  if grep -q "setupDiagnostics" "$file"; then
    echo "  ✓ Already has diagnostics, skipping"
    continue
  fi
  
  # Check if file has the test-helpers import
  if ! grep -q "from.*test-helpers" "$file"; then
    # Add import after the existing imports
    sed -i '' '/^import.*allure-playwright/a\
import { setupDiagnostics } from '\''../../utils/test-helpers'\'';
' "$file"
    echo "  ✓ Added import"
  fi
  
  # Add setupDiagnostics call after test.setTimeout or at start of test
  # Look for pattern: test('...', async ({ page
  sed -i '' '/async ({ page.*}) => {/a\
    setupDiagnostics(page, '\'''"$file"''\'');
' "$file"
  
  echo "  ✓ Added setupDiagnostics call"
done

echo ""
echo "Done! Diagnostics added to all test files."
echo "Now tests will log console messages and network failures to help debug CI issues."

