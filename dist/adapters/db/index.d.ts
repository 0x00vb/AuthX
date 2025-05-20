import { AuthXConfig } from '../../config/types';
import { DbAdapter } from './adapter';
/**
 * Factory function to get the appropriate database adapter based on configuration
 * @param config The AuthX configuration
 * @returns The database adapter instance
 */
export declare function getDbAdapter(config: AuthXConfig): DbAdapter;
export { DbAdapter } from './adapter';
export { MongoDbAdapter } from './mongodb';
export { PostgresAdapter } from './postgres';
export { MySqlAdapter } from './mysql';
