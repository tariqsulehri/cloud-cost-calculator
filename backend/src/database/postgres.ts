import 'dotenv/config';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

const DEFAULT_DATABASE_NAME = 'cloud_cost_calculator';

export function targetDatabaseName(): string {
  return databaseNameFromUrl(process.env.DATABASE_URL) ?? DEFAULT_DATABASE_NAME;
}

export function databaseUrl(): string {
  return withDatabaseName(process.env.DATABASE_URL ?? `postgresql://postgres:@localhost:5432/${DEFAULT_DATABASE_NAME}`, targetDatabaseName());
}

export function adminDatabaseUrl(): string {
  return withDatabaseName(process.env.DATABASE_URL ?? 'postgresql://postgres:@localhost:5432/postgres', 'postgres');
}

export function withDatabaseName(rawUrl: string, databaseName: string): string {
  const url = new URL(rawUrl);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

export function databaseNameFromUrl(rawUrl?: string): string | null {
  if (!rawUrl) {
    return null;
  }

  const url = new URL(rawUrl);
  const databaseName = url.pathname.replace(/^\//, '').trim();
  return databaseName || null;
}

export function createPool(connectionString = databaseUrl()): Pool {
  return new Pool({ connectionString });
}

export async function withTransaction<T>(client: PoolClient, callback: () => Promise<T>): Promise<T> {
  await client.query('begin');
  try {
    const result = await callback();
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}

export async function queryOne<T extends QueryResultRow>(client: PoolClient, sql: string, values: unknown[] = []): Promise<T | null> {
  const result: QueryResult<T> = await client.query(sql, values);
  return result.rows[0] ?? null;
}
