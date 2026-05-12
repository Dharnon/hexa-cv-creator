/**
 * Genera Excel con maestro MPLEISTUNG (código + match code).
 * Uso: npx ts-node scripts/export-maestro-servicios-xlsx.ts
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs';
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

  const rows = await exec<{ LEISTUNGSNUMMER: string; MATCHCODE: string | null }>(
    conn,
    `
    SELECT LEISTUNGSNUMMER, MATCHCODE
    FROM "PRODU_HEXA"."MPLEISTUNG"
    ORDER BY LEISTUNGSNUMMER
    `,
  );

  conn.disconnect(() => {});

  const outDir = path.join(__dirname, '..', 'exports');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'maestro-servicios.xlsx');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'hexa-cv-creator';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Maestro servicios', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'Código servicio', key: 'code', width: 16 },
    { header: 'Match code', key: 'match', width: 62 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle' };

  for (const r of rows) {
    sheet.addRow({ code: r.LEISTUNGSNUMMER, match: r.MATCHCODE ?? '' });
  }

  await workbook.xlsx.writeFile(outPath);
  console.log(`Escrito: ${outPath} (${rows.length} filas)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
