# Google OAuth Examples

This directory contains examples demonstrating how to implement Google OAuth authentication with Express Auth Toolkit.

## Files

- `google-oauth-example.js` - A comprehensive example with EJS templates and complete configuration
- `google-oauth-minimal.js` - A minimal example with inline HTML templates
- `google-oauth-example.env` - Environment variables template for Google OAuth

## Setup

1. Create a project in the Google Developer Console (https://console.developers.google.com/)
2. Enable the Google+ API
3. Configure the OAuth consent screen
4. Create OAuth client ID credentials (Web application type)
5. Set authorized redirect URIs (e.g., http://localhost:3000/auth/oauth/google/callback)
6. Copy the `google-oauth-example.env` file to `.env` in your project root
7. Fill in your Google API credentials in the `.env` file

## Running the examples

### Full Example

```bash
# Install dependencies
npm install express express-auth-toolkit dotenv ejs

# Run the example
node google-oauth-example.js
```

### Minimal Example

```bash
# Install dependencies
npm install express express-auth-toolkit dotenv

# Run the example
node google-oauth-minimal.js
```

## Google OAuth Flow

1. User clicks "Login with Google" link
2. User is redirected to Google's authentication page
3. User logs in and approves the requested permissions
4. Google redirects back to the callback URL with an authorization code
5. The server exchanges the code for access tokens
6. User information is retrieved from Google
7. A user account is created (if it doesn't exist)
8. JWT tokens are generated for the user
9. User is redirected to the success page with the token

## Implementation Details

The examples demonstrate:

- Setting up OAuth routes with passport
- Configuring Google OAuth strategy
- Processing OAuth callbacks
- Handling user creation for new users
- Generating JWT tokens
- Protecting routes with authentication middleware

## Configuration Options

The `oauth.google` configuration object supports these options:

- `clientId` - Google OAuth client ID
- `clientSecret` - Google OAuth client secret
- `callbackUrl` - URL where Google will redirect after authentication
- `successRedirect` - URL to redirect on successful authentication
- `failureRedirect` - URL to redirect on failed authentication
- `scope` - Array of permission scopes to request

For more details, check the documentation in the main project. 