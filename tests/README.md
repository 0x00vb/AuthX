# AuthX Automated Tests

This directory contains automated tests for the AuthX authentication framework. These tests cover all major features including authentication, user management, email verification, password reset, and two-factor authentication.

## Test Structure

The tests are organized into several suites:

1. **Authentication Tests** (`auth.test.js`): Tests for core authentication functionality
   - Registration
   - Login
   - JWT token handling
   - Email verification
   - Password reset

2. **User Management Tests** (`user.test.js`): Tests for user profile management
   - Profile updating
   - Password changing
   - Account deletion

3. **Two-Factor Authentication Tests** (`2fa.test.js`): Tests for 2FA features
   - 2FA setup
   - 2FA verification
   - 2FA disabling

## Running Tests

You can run individual test suites or all tests together:

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:auth
npm run test:user
npm run test:2fa

# Run with Jest directly
npx jest tests/auth.test.js --verbose
```

## Debug Mode

For troubleshooting failing tests, you can use the debug scripts:

```bash
# Run all tests in debug mode
./tests/debug-all.sh

# Run just the auth tests in debug mode
./tests/debug-auth.sh

# Enable debug mode with any Jest command
DEBUG=true npx jest tests/auth.test.js --verbose
```

Debug mode provides additional logging that shows:
- Email processing
- Token handling
- API responses
- Test flow decisions

## Test Server

The tests use a dedicated test server (`test-server.js`) that configures AuthX with:

- Memory adapter for non-persistent data storage
- Mock email service to capture and inspect emails
- Test-specific configurations

## Email Testing

For tests involving email verification and password reset:

1. The test server mocks email sending functionality to capture emails
2. Test routes expose verification and reset tokens for testing
3. The `EmailHelper` class provides methods to extract tokens from emails
4. When email extraction fails, direct database access is used as a fallback

## Important Notes

- Tests are designed to be resilient to different implementation details
- Tests adapt to different status codes and response formats
- Tests include conditional logic to handle optional features
- 2FA tests require the `speakeasy` package for generating TOTP codes
- Token helpers allow testing of invalid/expired tokens

## Test Coverage

Running the tests with `npm run test:all` will generate coverage reports in the `coverage` directory.

## Test Helpers

The tests use several helper modules:

- `EmailHelper` - For capturing and extracting tokens from emails
- `TokenHelper` - For parsing, verifying, and generating test tokens
- `setup.js` - Provides shared helper functions and utilities

## Extending Tests

When adding new features to AuthX, make sure to:

1. Add corresponding tests
2. Follow the existing pattern of test organization
3. Update the README if introducing new test categories
4. Use the debug utilities for troubleshooting 