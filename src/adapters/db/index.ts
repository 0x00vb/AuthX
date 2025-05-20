import { AuthXConfig } from '../../config/types';
import { DbAdapter } from './adapter';
import { MongoDbAdapter } from './mongodb';
import { PostgresAdapter } from './postgres';
import { MySqlAdapter } from './mysql';

/**
 * Factory function to get the appropriate database adapter based on configuration
 * @param config The AuthX configuration
 * @returns The database adapter instance
 */
export function getDbAdapter(config: AuthXConfig): DbAdapter {
  switch (config.dbType) {
    case 'mongodb':
      return new MongoDbAdapter(config);
    case 'postgres':
      return new PostgresAdapter(config);
    case 'mysql':
      return new MySqlAdapter(config);
    default:
      throw new Error(`Unsupported database type: ${config.dbType}`);
  }
}

export { DbAdapter } from './adapter';
export { MongoDbAdapter } from './mongodb';
export { PostgresAdapter } from './postgres';
export { MySqlAdapter } from './mysql'; 