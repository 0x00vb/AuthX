You are a senior full-stack engineer agent. Your task is to perform a full functional analysis and then guide the development of an authentication package with the following requirements:
🔐 Package Goals:

    Provide authentication features: login, register, forgot/reset password, and role management.

    Be framework-ready for both JavaScript and TypeScript projects.

    Offer clean and extensible architecture with modular folders.

    Be secure by design, following OWASP best practices.

    Support multiple databases: MongoDB, PostgreSQL, MySQL (using a DB abstraction strategy).

    Be easy to integrate and extend with custom roles and behaviors.

    Include unit/integration test utilities for fast setup and testing.

🧱 Initial Functional Analysis

Perform a complete functional breakdown:

    Core features (auth flows)

    User and role models

    DB abstraction mechanism

    Security integrations (JWT, bcrypt, validation, rate limiting, etc.)

    Extensibility points

    Configuration and customization

    Error handling standardization

    Testing strategy (unit + integration)

    JavaScript compatibility layer

📁 Project Folder Structure

Create the following clean folder layout:

src/
├── adapters/              # DB, email, cache (injections and abstractions)
├── controllers/           # Route logic handlers
├── middleware/            # Auth guards, validators, rate limiting
├── models/                # User, Roles, Sessions
├── routes/                # Auth, user, roles API routes
├── services/              # Business logic (auth, role mgmt, etc.)
├── utils/                 # Helpers: token generation, email templates, etc.
├── index.ts               # Entrypoint
└── config/                # Environment, secrets, db config
tests/
├── unit/
├── integration/
└── mocks/

🧭 Agent Instructions – Development Path

Guide your agent through the following development phases:
PHASE 1 – Core Setup

    Set up a TypeScript project with ExpressJS

    Add build configuration for JavaScript + TypeScript compatibility (tsup / esbuild)

    Setup index.ts to load .env and bootstrap Express app

PHASE 2 – Database Abstraction Layer

    Design a database adapter interface

    Implement MongoDB, PostgreSQL, and MySQL adapter implementations

    Implement a dynamic DB loader based on .env

PHASE 3 – User & Role Models

    Define core models: User, Role

    Create schemas with abstraction support (use interfaces)

    Allow custom role definitions

PHASE 4 – Auth Services

    register(): validate input, hash password, save user, assign default role

    login(): compare password, return JWT

    forgotPassword(): send email token

    resetPassword(): verify token, update password

    Add refresh tokens and token expiration

PHASE 5 – Middleware & Security

    JWT verification middleware

    Role-based guard middleware

    Rate limiter (express-rate-limit)

    Input validation middleware

PHASE 6 – Routes & Controllers

    Create routes for:

        /auth/register

        /auth/login

        /auth/forgot-password

        /auth/reset-password

    Hook routes to controllers → services

PHASE 7 – Extensibility & Config

    Expose public API methods to be imported in other apps

    Allow role customization via a config file or init method

    Provide documentation comments in code

PHASE 8 – Testing Strategy

    Set up Jest + Supertest

    Mock DB adapters for unit tests

    Write sample integration tests (register/login flow)

    Add CI-ready test script

PHASE 9 – Packaging & Distribution

    Export JavaScript + TypeScript compatible builds

    Provide install/setup instructions in README

    Add typed configuration interface

✅ Deliverables

    Full functional breakdown

    Directory + file structure

    Implementation plan for each module

    Commented guides per folder for developer onboarding

    Basic README draft for final package