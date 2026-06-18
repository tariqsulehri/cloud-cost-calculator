import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createPool, withTransaction } from '../database/postgres.js';

const migrationsDir = resolve(process.cwd(), 'migrations');
const pool = createPool();
const client = await pool.connect();

try {
  await client.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
  const applied: string[] = [];

  for (const file of files) {
    const exists = await client.query('select id from schema_migrations where id = $1', [file]);
    if ((exists.rowCount ?? 0) > 0) {
      continue;
    }

    const sql = await readFile(resolve(migrationsDir, file), 'utf8');
    await withTransaction(client, async () => {
      await client.query(sql);
      await client.query('insert into schema_migrations (id) values ($1)', [file]);
    });
    applied.push(file);
  }

  console.log(JSON.stringify({ applied, skipped: files.length - applied.length }, null, 2));
} finally {
  client.release();
  await pool.end();
}
