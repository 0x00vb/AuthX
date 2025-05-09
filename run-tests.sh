#!/bin/bash

# AuthX Test Runner Script
# This script runs the automated test suite for the AuthX authentication framework

echo "🔐 AuthX Authentication Framework Tests"
echo "======================================"
echo

# Set NODE_ENV to test
export NODE_ENV=test

# Check if Jest is installed
if ! command -v npx &> /dev/null; then
  echo "❌ Error: npx is not installed"
  echo "Please install Node.js and npm first"
  exit 1
fi

# Check if the tests directory exists
if [ ! -d "tests" ]; then
  echo "❌ Error: tests directory not found"
  exit 1
fi

# Check if test-server.js exists
if [ ! -f "test-server.js" ]; then
  echo "❌ Error: test-server.js not found"
  exit 1
fi

# Print test information
echo "Running tests with the following configuration:"
echo "- Auth tests: tests/auth.test.js"
echo "- User tests: tests/user.test.js"
echo "- 2FA tests: tests/2fa.test.js"
echo

# Run all tests using the test runner
echo "📋 Starting test execution..."
node tests/run-tests.js

# Get the exit code
EXIT_CODE=$?

# Exit with the same code
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed successfully!"
else
  echo "❌ Tests failed with exit code: $EXIT_CODE"
fi

exit $EXIT_CODE 