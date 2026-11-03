export interface RuntimeR2Object {
  arrayBuffer(): Promise<ArrayBuffer>;
}

type RuntimeD1Value = string | number | null | ArrayBuffer | Uint8Array;

export interface RuntimeD1Result<T = Record<string, unknown>> {
  success: boolean;
  results?: T[];
  meta: { changes?: number; last_row_id?: number | string };
}

export interface RuntimeD1PreparedStatement {
  bind(...values: RuntimeD1Value[]): RuntimeD1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }>;
  run<T = Record<string, unknown>>(): Promise<RuntimeD1Result<T>>;
}

export interface RuntimeD1Database {
  prepare(query: string): RuntimeD1PreparedStatement;
  batch<T = Record<string, unknown>>(
    statements: RuntimeD1PreparedStatement[],
  ): Promise<RuntimeD1Result<T>[]>;
}

export interface RuntimeR2Bucket {
  get(key: string): Promise<RuntimeR2Object | null>;
  put(
    key: string,
    value: Uint8Array,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
}

export interface RuntimeBindings {
  database?: RuntimeD1Database;
  documentsBucket?: RuntimeR2Bucket;
}

let runtimeBindings: RuntimeBindings = {};

export function configureRuntimeBindings(bindings: RuntimeBindings) {
  runtimeBindings = bindings;
}

export function getDocumentsBucket() {
  return runtimeBindings.documentsBucket;
}

export function getDatabase() {
  if (!runtimeBindings.database) {
    throw new Error('The Cloudflare D1 database binding is unavailable.');
  }
  return runtimeBindings.database;
}
