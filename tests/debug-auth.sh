#!/bin/bash

# Run auth tests with debug output enabled

echo "🔍 Running AuthX Authentication Tests in Debug Mode"
echo "=================================================="
echo

# Set environment variables
export DEBUG=true
export NODE_ENV=test

# Check if Jest is installed
if ! command -v npx &> /dev/null; then
  echo "❌ Error: npx is not installed"
  echo "Please install Node.js and npm first"
  exit 1
fi

# Run the auth tests with verbose output
echo "📋 Starting auth test execution with debugging enabled..."
npx jest tests/auth.test.js --verbose --detectOpenHandles

# Get the exit code
EXIT_CODE=$?

# Exit with the same code
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Auth tests passed successfully!"
else
  echo "❌ Tests failed with exit code: $EXIT_CODE"
fi

exit $EXIT_CODE 