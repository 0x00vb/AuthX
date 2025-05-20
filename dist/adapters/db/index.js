"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlAdapter = exports.PostgresAdapter = exports.MongoDbAdapter = void 0;
exports.getDbAdapter = getDbAdapter;
const mongodb_1 = require("./mongodb");
const postgres_1 = require("./postgres");
const mysql_1 = require("./mysql");
/**
 * Factory function to get the appropriate database adapter based on configuration
 * @param config The AuthX configuration
 * @returns The database adapter instance
 */
function getDbAdapter(config) {
    switch (config.dbType) {
        case 'mongodb':
            return new mongodb_1.MongoDbAdapter(config);
        case 'postgres':
            return new postgres_1.PostgresAdapter(config);
        case 'mysql':
            return new mysql_1.MySqlAdapter(config);
        default:
            throw new Error(`Unsupported database type: ${config.dbType}`);
    }
}
var mongodb_2 = require("./mongodb");
Object.defineProperty(exports, "MongoDbAdapter", { enumerable: true, get: function () { return mongodb_2.MongoDbAdapter; } });
var postgres_2 = require("./postgres");
Object.defineProperty(exports, "PostgresAdapter", { enumerable: true, get: function () { return postgres_2.PostgresAdapter; } });
var mysql_2 = require("./mysql");
Object.defineProperty(exports, "MySqlAdapter", { enumerable: true, get: function () { return mysql_2.MySqlAdapter; } });
//# sourceMappingURL=index.js.map