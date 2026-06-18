import { Client } from 'pg';
import { adminDatabaseUrl, targetDatabaseName } from '../database/postgres.js';

const databaseName = targetDatabaseName();
const client = new Client({ connectionString: adminDatabaseUrl() });

await client.connect();
try {
  const existing = await client.query<{ datname: string }>('select datname from pg_database where datname = $1', [databaseName]);
  if (existing.rowCount === 0) {
    await client.query(`create database ${quoteIdentifier(databaseName)}`);
    console.log(`Created database ${databaseName}.`);
  } else {
    console.log(`Database ${databaseName} already exists.`);
  }
} finally {
  await client.end();
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}
