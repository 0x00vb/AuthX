# Adapters

This directory contains adapter implementations for external dependencies and services.

## Structure

- `db/`: Database adapters for different database types (MongoDB, PostgreSQL, MySQL)
- `email/`: Email service adapters for sending emails (future implementation)
- `cache/`: Cache adapters for caching data (future implementation)

## Database Adapters

The DB adapters implement a common interface defined in `db/adapter.ts` to provide database operations for the authentication package. Each database implementation follows the same interface, making it easy to switch between different database backends.

### Supported Databases

- MongoDB: `db/mongodb.ts`
- PostgreSQL: `db/postgres.ts`
- MySQL: `db/mysql.ts`

## How to Extend

To add a new database adapter:

1. Create a new file in the `db/` directory, e.g., `db/redis.ts`
2. Implement the `DbAdapter` interface from `db/adapter.ts`
3. Add the new adapter to the factory function in `db/index.ts` 