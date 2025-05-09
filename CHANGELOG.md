# AuthX Test Framework Changelog

## Test Suite Improvements - [Date]

### Added
- Debug mode for test execution with detailed logging
- Script to run all tests in debug mode (`tests/debug-all.sh`)
- Script to run auth tests in debug mode (`tests/debug-auth.sh`)
- Setup helper module for centralizing test utilities
- Better error handling and reporting in test helpers
- Test server now captures more details for debugging
- Manual verification utility for email verification testing

### Fixed
- Tests now properly handle different status code responses
- Email processing now works with various email formats
- Enhanced token extraction from emails and database
- Fixed issues with test setup and teardown
- Improved error handling in all test suites
- Tests now gracefully handle optional features

### Changed
- Tests now adapt to different implementation details
- More resilient testing approach for verification flows
- Improved documentation for test helpers and utilities
- Better conditional test execution based on feature availability
- Enhanced logging for test execution and debugging

### Documentation
- Updated tests/README.md with debug mode instructions
- Added documentation for all test helpers
- Improved test error handling documentation
- Added usage examples for debug mode

## Initial Test Suite - [Previous Date]

### Added
- Initial authentication test suite (auth.test.js)
- Initial user management test suite (user.test.js)
- Initial 2FA test suite (2fa.test.js)
- Basic email and token testing helpers
- Test server configuration with in-memory data store
- Basic test execution scripts 