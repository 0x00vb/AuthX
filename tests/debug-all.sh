#!/bin/bash

# Run all tests with debug output enabled

echo "🔍 Running All AuthX Tests in Debug Mode"
echo "======================================"
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

# Make sure the tests directory exists
if [ ! -d "tests" ]; then
  echo "❌ Error: tests directory not found"
  exit 1
fi

# Test files in order of dependency
TEST_FILES=(
  "tests/auth.test.js"
  "tests/user.test.js"
  "tests/2fa.test.js"
)

# Run each test file sequentially with proper error handling
for test_file in "${TEST_FILES[@]}"; do
  echo -e "\n📋 Running test suite: $test_file"
  npx jest "$test_file" --verbose --detectOpenHandles
  
  # Check the exit code
  if [ $? -ne 0 ]; then
    echo "❌ Test suite $test_file failed"
    echo "Stopping test execution"
    exit 1
  fi
  
  echo "✅ Test suite $test_file passed"
done

echo -e "\n✨ All test suites completed successfully!"
exit 0 