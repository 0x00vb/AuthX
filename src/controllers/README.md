# Controllers

This directory contains the HTTP controllers that handle incoming requests for the AuthX package.

## Responsibility

Controllers are responsible for:

- Accepting HTTP requests
- Validating request data
- Calling appropriate services for business logic
- Returning HTTP responses

Controllers should NOT contain business logic. They should delegate to services for any data processing or business rule implementation.

## Structure

- `auth.ts`: Handles authentication-related requests (register, login, etc.)
- `role.ts`: Handles role management requests (future implementation)
- `user.ts`: Handles user management requests (future implementation)

## Guidelines

1. Keep controllers focused on HTTP concerns
2. Always validate incoming data
3. Handle errors consistently
4. Return standardized response formats
5. Delegate business logic to services 