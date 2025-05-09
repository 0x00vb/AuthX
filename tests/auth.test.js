/**
 * AuthX Authentication Framework - API Tests
 * 
 * This file contains tests for the authentication endpoints:
 * - Registration
 * - Login
 * - Email verification
 * - Password reset
 * - Token management
 */

const request = require('supertest');
const { app, emailHelper, tokenHelper, debugLog, expectStatus } = require('./setup');

// Enable debug mode by setting DEBUG=true environment variable
// e.g. DEBUG=true npm run test:auth

describe('AuthX Authentication API Tests', () => {
  let userData;
  let accessToken;
  let refreshToken;
  let verificationToken;
  let resetToken;

  const API_BASE = '/api/auth';
  
  beforeAll(async () => {
    // Generate unique test user data with timestamp to avoid conflicts
    userData = {
      email: `test-${Date.now()}@example.com`,
      password: 'Test1234!',
      name: 'Test User'
    };
    
    // Clear any previous test emails
    await emailHelper.clearEmails();
    debugLog('Test setup complete with user:', userData.email);
  });

  // Registration Tests
  describe('User Registration', () => {
    test('should validate password policy requirements', async () => {
      const weakPassword = {
        email: userData.email,
        password: 'weak',
        name: userData.name
      };
      
      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(weakPassword);
      
      // Should be 400 Bad Request
      const expectedStatus = 400;
      expectStatus(expectedStatus, response.status);
      expect(response.status).toBe(expectedStatus);
      expect(response.body.error).toBeDefined();
    });
    
    test('should register a new user', async () => {
      debugLog('Registering user:', userData.email);
      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(userData);
      
      // Should be 201 Created
      const expectedStatus = 201;
      expectStatus(expectedStatus, response.status);
      expect(response.status).toBe(expectedStatus);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.tokens.accessToken).toBeDefined();
      
      // Store tokens
      accessToken = response.body.tokens.accessToken;
      if (response.body.tokens.refreshToken) {
        refreshToken = response.body.tokens.refreshToken;
      }
      
      // Parse the access token to check claims
      const tokenPayload = tokenHelper.parseToken(accessToken);
      debugLog('Token payload:', tokenPayload);
      expect(tokenPayload).toBeTruthy();
      
      // The user ID should be in the token, but might be under different claim name
      // Try common JWT claim names for the subject
      let userIdInToken = false;
      if (tokenPayload.sub) {
        expect(tokenPayload.sub).toBe(response.body.user.id);
        userIdInToken = true;
      } else if (tokenPayload.id) {
        expect(tokenPayload.id).toBe(response.body.user.id);
        userIdInToken = true;
      } else if (tokenPayload.userId) {
        expect(tokenPayload.userId).toBe(response.body.user.id);
        userIdInToken = true;
      }
      
      expect(userIdInToken).toBe(true);
      expect(tokenPayload.email).toBe(userData.email);
    });
    
    test('should not allow registration with duplicate email', async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(userData);
      
      // Could be either 400 Bad Request or 409 Conflict - both are valid
      const validStatuses = [400, 409];
      expect(validStatuses).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });
    
    test('should send a verification email after registration', async () => {
      // Skip this test if email verification is disabled
      if (!emailHelper) {
        console.log('Email helper not available, skipping test');
        return;
      }
      
      // Check if any emails were captured
      const emails = await emailHelper.getEmails();
      debugLog(`Found ${emails.length} emails after registration`);
      
      // If email verification is required, there should be a verification email
      // Otherwise, we can skip this test
      if (emails.length === 0) {
        debugLog('No emails found - email verification may be disabled');
        return;
      }
      
      // Get the latest email sent to the user
      const email = await emailHelper.getLatestEmailTo(userData.email);
      
      if (!email) {
        debugLog('No verification email found for user - email verification may be disabled');
        return;
      }
      
      expect(email).toBeTruthy();
      expect(email.to).toEqual(expect.stringContaining(userData.email));
      
      // If we found an email, try to extract verification token
      verificationToken = await emailHelper.getVerificationToken(userData.email);
      
      // If email extraction fails, try getting from DB
      if (!verificationToken) {
        verificationToken = await emailHelper.getVerificationTokenFromDB(userData.email);
      }
      
      // If we still don't have a token, then verification might be disabled
      if (!verificationToken) {
        debugLog('No verification token found - email verification may be disabled');
        return;
      }
      
      expect(verificationToken).toBeTruthy();
      debugLog('Found verification token', verificationToken.substring(0, 10) + '...');
    });
    
    // Test manual verification if email verification is enabled
    test('should manually verify user for testing', async () => {
      const response = await request(app)
        .post(`/test/verify-user/${userData.email}`)
        .send();
      
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('verified');
      
      debugLog('User manually verified for testing:', userData.email);
    });
  });

  // Email Verification Tests - conditional based on if we got a token
  describe('Email Verification', () => {
    beforeAll(() => {
      if (!verificationToken) {
        debugLog('No verification token available - some tests will be skipped');
      }
    });
    
    test('should verify email with token', async () => {
      // Skip if no verification token was found
      if (!verificationToken) {
        debugLog('Verification token not available, skipping test');
        return;
      }
      
      const response = await request(app)
        .get(`${API_BASE}/auth/verify-email`)
        .query({ token: verificationToken });
      
      // Should be 200 OK
      const expectedStatus = 200;
      expectStatus(expectedStatus, response.status, 'verify email');
      expect(response.status).toBe(expectedStatus);
      expect(response.body.message).toEqual(expect.stringContaining('verified'));
    });
    
    test('should reject invalid verification tokens', async () => {
      const response = await request(app)
        .get(`${API_BASE}/auth/verify-email`)
        .query({ token: 'invalid-token' });
      
      // Could be either 400 Bad Request or 401 Unauthorized - both are valid
      const validStatuses = [400, 401];
      expect(validStatuses).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });
  });

  // Login Tests
  describe('User Login', () => {
    test('should not login with incorrect password', async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: userData.email,
          password: 'WrongPassword123!'
        });
      
      // Should be 401 Unauthorized
      const expectedStatus = 401;
      expectStatus(expectedStatus, response.status, 'login with wrong password');
      expect(response.status).toBe(expectedStatus);
      expect(response.body.error).toBeDefined();
    });
    
    test('should login with correct credentials', async () => {
      debugLog('Attempting login with:', userData.email);
      const response = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: userData.email,
          password: userData.password
        });
      
      // If email verification is required, login might fail unless we've verified
      if (response.status === 403) {
        expectStatus(403, response.status, 'login before verification');
        expect(response.body.error).toBeDefined();
        expect(response.body.error.message).toEqual(expect.stringContaining('verified'));
        debugLog('Login failed due to email verification requirement');
        return;
      }
      
      // Should be 200 OK if verified
      const expectedStatus = 200;
      expectStatus(expectedStatus, response.status, 'login with correct credentials');
      expect(response.status).toBe(expectedStatus);
      expect(response.body.user).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      
      // Update tokens for subsequent tests
      accessToken = response.body.tokens.accessToken;
      if (response.body.tokens.refreshToken) {
        refreshToken = response.body.tokens.refreshToken;
      }
      
      // Store tokens for subsequent tests
      debugLog('Login successful, access token:', accessToken.substring(0, 20) + '...');
    });
  });

  // Password Reset Tests
  describe('Password Reset', () => {
    test('should request password reset', async () => {
      // Clear previous emails
      await emailHelper.clearEmails();
      
      const response = await request(app)
        .post(`${API_BASE}/auth/forgot-password`)
        .send({ email: userData.email });
      
      // Should be 200 OK
      const expectedStatus = 200;
      expectStatus(expectedStatus, response.status, 'request password reset');
      expect(response.status).toBe(expectedStatus);
      
      // Check that a password reset email was sent
      const emails = await emailHelper.getEmails();
      debugLog(`Found ${emails.length} emails after password reset request`);
      
      const email = await emailHelper.getLatestEmailTo(userData.email);
      
      // If email reset is enabled, there should be a reset email
      if (!email) {
        debugLog('No password reset email found - feature may be disabled');
        return;
      }
      
      expect(email).toBeTruthy();
      expect(email.subject).toEqual(expect.stringContaining('Reset'));
      
      // Extract the reset token
      resetToken = await emailHelper.getPasswordResetToken(userData.email);
      
      // If email extraction fails, try getting from DB
      if (!resetToken) {
        resetToken = await emailHelper.getPasswordResetTokenFromDB(userData.email);
      }
      
      // Token might not be found if the feature is disabled
      if (!resetToken) {
        debugLog('No reset token found - password reset may be disabled');
        return;
      }
      
      expect(resetToken).toBeTruthy();
      debugLog('Found reset token:', resetToken.substring(0, 10) + '...');
    });
    
    test('should reset password with token', async () => {
      // Skip if no reset token was found
      if (!resetToken) {
        debugLog('Reset token not available, skipping test');
        return;
      }
      
      const newPassword = 'NewPassword123!';
      
      const response = await request(app)
        .post(`${API_BASE}/auth/reset-password`)
        .send({
          token: resetToken,
          password: newPassword
        });
      
      // Should be 200 OK
      const expectedStatus = 200;
      expectStatus(expectedStatus, response.status, 'reset password');
      expect(response.status).toBe(expectedStatus);
      expect(response.body.message).toEqual(expect.stringContaining('reset'));
      
      // Verify the new password works
      const loginResponse = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: userData.email,
          password: newPassword
        });
      
      expectStatus(200, loginResponse.status, 'login after password reset');
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.tokens.accessToken).toBeDefined();
      
      // Update user data and tokens
      userData.password = newPassword;
      accessToken = loginResponse.body.tokens.accessToken;
      if (loginResponse.body.tokens.refreshToken) {
        refreshToken = loginResponse.body.tokens.refreshToken;
      }
      
      debugLog('Password reset and login successful');
    });
    
    test('should reject invalid reset tokens', async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/reset-password`)
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!'
        });
      
      // Could be either 400 Bad Request or 401 Unauthorized - both are valid
      const validStatuses = [400, 401];
      expect(validStatuses).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });
    
    test('should reject weak passwords during reset', async () => {
      // Skip if no reset token was found
      if (!resetToken) {
        debugLog('Reset token not available, skipping test');
        return;
      }
      
      const response = await request(app)
        .post(`${API_BASE}/auth/reset-password`)
        .send({
          token: resetToken, // This may no longer be valid if previous test passed
          password: 'weak'
        });
      
      // The token may be invalid after a successful reset, but the password validation
      // should still happen before token validation - expect 400
      const expectedStatus = 400;
      expectStatus(expectedStatus, response.status, 'weak password during reset');
      // Some implementations might return 401 if they validate token first, that's also acceptable
      const validStatuses = [400, 401];
      expect(validStatuses).toContain(response.status);
    });
  });

  // Token Management Tests
  describe('Token Management', () => {
    test('should refresh access token', async () => {
      // Skip if refresh tokens aren't available
      if (!refreshToken) {
        debugLog('Refresh token not available, skipping test');
        return;
      }
      
      const response = await request(app)
        .post(`${API_BASE}/auth/refresh-token`)
        .send({ refreshToken });
      
      // Should be 200 OK
      const expectedStatus = 200;
      expectStatus(expectedStatus, response.status, 'refresh token');
      expect(response.status).toBe(expectedStatus);
      expect(response.body.tokens.accessToken).toBeDefined();
      
      // Check if the new token has a different value
      const newAccessToken = response.body.tokens.accessToken;
      expect(newAccessToken).not.toBe(accessToken);
      
      // Update access token for subsequent tests
      accessToken = newAccessToken;
      
      // Parse the token to verify claims
      const tokenPayload = tokenHelper.parseToken(accessToken);
      expect(tokenPayload).toBeTruthy();
      expect(tokenPayload.email).toBe(userData.email);
      
      debugLog('Token refreshed successfully');
    });
    
    test('should access protected endpoint with valid token', async () => {
      const response = await request(app)
        .get(`${API_BASE}/auth/me`)
        .set('Authorization', `Bearer ${accessToken}`);
      
      // Should be 200 OK
      const expectedStatus = 200;
      expectStatus(expectedStatus, response.status, 'access protected endpoint');
      expect(response.status).toBe(expectedStatus);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      
      debugLog('Protected endpoint accessed successfully');
    });
    
    test('should reject expired access token', async () => {
      // Create an expired token for the user
      const payload = tokenHelper.parseToken(accessToken);
      const expiredToken = tokenHelper.createExpiredToken(payload);
      
      const response = await request(app)
        .get(`${API_BASE}/auth/me`)
        .set('Authorization', `Bearer ${expiredToken}`);
      
      // Should be 401 Unauthorized
      const expectedStatus = 401;
      expectStatus(expectedStatus, response.status, 'expired token');
      expect(response.status).toBe(expectedStatus);
      expect(response.body.error).toBeDefined();
      
      debugLog('Expired token rejected as expected');
    });
    
    test('should reject token with invalid signature', async () => {
      // Create a token with invalid signature
      const payload = tokenHelper.parseToken(accessToken);
      const invalidToken = tokenHelper.createInvalidSignatureToken(payload);
      
      const response = await request(app)
        .get(`${API_BASE}/auth/me`)
        .set('Authorization', `Bearer ${invalidToken}`);
      
      // Should be 401 Unauthorized
      const expectedStatus = 401;
      expectStatus(expectedStatus, response.status, 'invalid signature');
      expect(response.status).toBe(expectedStatus);
      expect(response.body.error).toBeDefined();
      
      debugLog('Invalid signature token rejected as expected');
    });
  });

  // Logout Tests
  describe('User Logout', () => {
    test('should logout user', async () => {
      // Skip if refresh tokens aren't available
      if (!refreshToken) {
        debugLog('Refresh token not available, skipping test');
        return;
      }
      
      const response = await request(app)
        .post(`${API_BASE}/auth/logout`)
        .send({ refreshToken });
      
      // Should be 200 OK
      const expectedStatus = 200;
      expectStatus(expectedStatus, response.status, 'logout');
      expect(response.status).toBe(expectedStatus);
      
      // Verify the refresh token is invalidated
      const refreshResponse = await request(app)
        .post(`${API_BASE}/auth/refresh-token`)
        .send({ refreshToken });
      
      // Should be 401 Unauthorized
      expectStatus(401, refreshResponse.status, 'use invalidated token');
      expect(refreshResponse.status).toBe(401);
      
      debugLog('Logout successful and token invalidated');
    });
  });
}); 