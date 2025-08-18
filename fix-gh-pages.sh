#!/bin/bash

# Script to fix the corrupted gh-pages branch
# The allure-reports directory got converted to a submodule reference

echo "Fixing corrupted gh-pages branch..."

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Clone the repository
git clone https://github.com/civicteam/civic-auth-examples.git
cd civic-auth-examples

# Checkout gh-pages branch
git checkout gh-pages

# Remove the submodule reference
git rm --cached allure-reports
rm -rf allure-reports

# Create a clean allure-reports directory
mkdir -p allure-reports

# Commit the fix
git add allure-reports
git commit -m "Fix: Remove corrupted submodule reference for allure-reports"

# Push the fix
git push origin gh-pages

echo "gh-pages branch has been fixed!"
echo "The allure-reports submodule reference has been removed."
echo "The workflow should now be able to checkout the branch without errors."
