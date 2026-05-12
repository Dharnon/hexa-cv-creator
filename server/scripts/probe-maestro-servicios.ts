/**
 * One-off / diagnostic: discover PRODU_HEXA tables related to servicios / maestro
 * and print sample rows. Run: npx ts-node scripts/probe-maestro-servicios.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import { createConnection } from '@sap/hana-client';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const params = {
  serverNode: `${process.env.HANA_HOST ?? ''}:${process.env.HANA_PORT ?? ''}`,
  uid: process.env.HANA_USER,
  pwd: process.env.HANA_PASSWORD,
  databaseName: process.env.HANA_DATABASE,
};

function exec<T = Record<string, unknown>>(
  conn: ReturnType<typeof createConnection>,
  sql: string,
  binds: unknown[] = [],
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    conn.exec(sql, binds as any, (err: Error | null, rows?: T[]) => {
      if (err) reject(err);
      else resolve(rows ?? []);
    });
  });
}

async function main() {
  const conn = createConnection();
  await new Promise<void>((resolve, reject) => {
    conn.connect(params, (err: Error | null) => (err ? reject(err) : resolve()));
  });

  const schema = 'PRODU_HEXA';

  const tables = await exec<{ TABLE_NAME: string }>(
    conn,
    `
    SELECT TABLE_NAME
    FROM SYS.TABLES
    WHERE SCHEMA_NAME = ?
      AND (
        UPPER(TABLE_NAME) LIKE '%SERVIC%'
        OR UPPER(TABLE_NAME) LIKE '%MAESTRO%'
        OR UPPER(TABLE_NAME) LIKE '%LEISTUNG%'
        OR UPPER(TABLE_NAME) LIKE '%SERVICE%'
      )
    ORDER BY TABLE_NAME
    `,
    [schema],
  );

  console.log('--- Tables in', schema, 'matching servicio/maestro/leistung/service ---');
  console.log(JSON.stringify(tables.map((t) => t.TABLE_NAME), null, 2));

  for (const { TABLE_NAME } of tables) {
    const cols = await exec<{ COLUMN_NAME: string; DATA_TYPE_NAME: string }>(
      conn,
      `
      SELECT COLUMN_NAME, DATA_TYPE_NAME
      FROM SYS.TABLE_COLUMNS
      WHERE SCHEMA_NAME = ? AND TABLE_NAME = ?
      ORDER BY POSITION
      `,
      [schema, TABLE_NAME],
    );
    console.log('\n===', TABLE_NAME, 'columns ===');
    console.log(cols.map((c) => `${c.COLUMN_NAME} (${c.DATA_TYPE_NAME})`).join(', '));

    try {
      const sample = await exec(
        conn,
        `SELECT * FROM "${schema}"."${TABLE_NAME}" LIMIT 5`,
      );
      console.log('--- sample (5 rows) ---');
      console.log(JSON.stringify(sample, null, 2));
    } catch (e) {
      console.log('--- sample failed:', e instanceof Error ? e.message : e);
    }
  }

  conn.disconnect(() => process.exit(0));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
