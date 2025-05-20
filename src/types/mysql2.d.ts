declare module 'mysql2/promise' {
  export interface Pool {
    getConnection(): Promise<PoolConnection>;
    query(sql: string, values?: any[]): Promise<any>;
    end(): Promise<void>;
  }

  export interface PoolConnection {
    query(sql: string, values?: any[]): Promise<any>;
    beginTransaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    release(): void;
  }

  export interface ResultSetHeader {
    affectedRows: number;
    insertId: number;
    warningStatus: number;
  }

  export interface FieldPacket {
    // Field information
  }

  export function createPool(config: string | object): Pool;
} 