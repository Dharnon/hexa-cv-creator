import { Request, Response } from 'express';
import { db } from '../db/hanaClient';

interface EmployeeRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface UserProjectRow {
  employeeId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  projectId: string;
  projectName: string;
  year: number | string | null;
  client: string | null;
  totalHours: number | string | null;
}

const buildClientExpression = () => `
  CASE
    WHEN p.OCRCODE1 IS NOT NULL AND p.OCRCODE1 <> '' THEN p.OCRCODE1
    WHEN p.PROJEKTNAME LIKE '%:%' THEN SUBSTR_BEFORE(p.PROJEKTNAME, ':')
    ELSE NULL
  END
`;

const parseHours = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? '0'));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const ensureSapAvailable = (res: Response): boolean => {
  if (db.isAvailable()) {
    return true;
  }

  res.status(503).json({
    error: 'SAP HANA is unavailable',
    details: db.getFailureReason() ?? 'SAP HANA connection has not been established.',
  });
  return false;
};

export const getEmployees = async (_req: Request, res: Response) => {
  if (!ensureSapAvailable(res)) {
    return;
  }

  try {
    const query = `
      SELECT
        PERSONALNUMMER as "id",
        VORNAME as "firstName",
        NACHNAME as "lastName",
        EMAIL as "email"
      FROM "PRODU_HEXA"."MPPERSONENSTAMM"
      LIMIT 500
    `;

    const results = await db.execute<EmployeeRow>(query);
    res.json(results);
  } catch (error) {
    console.error('[server] Error fetching employees:', error);
    db.markUnavailable(error);
    res.status(500).json({
      error: 'Failed to fetch employees',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getUserProjectReport = async (req: Request, res: Response) => {
  const employeeId = String(req.query.employeeId ?? '').trim();

  if (!employeeId) {
    res.status(400).json({ error: 'employeeId query parameter is required' });
    return;
  }

  if (!ensureSapAvailable(res)) {
    return;
  }

  try {
    const query = `
      SELECT
        e.PERSONALNUMMER as "employeeId",
        e.VORNAME as "firstName",
        e.NACHNAME as "lastName",
        e.EMAIL as "email",
        p.PROJEKTNUMMER as "projectId",
        p.PROJEKTNAME as "projectName",
        YEAR(t.LEISTUNGSTAG) as "year",
        ${buildClientExpression()} as "client",
        SUM(t.MENGE) as "totalHours"
      FROM "PRODU_HEXA"."MPPROJEKTBUCHUNGSERFASSUNG" t
      LEFT JOIN "PRODU_HEXA"."MPPROJEKTSTAMM" p
        ON t.PROJEKTNUMMER = p.PROJEKTNUMMER
      LEFT JOIN "PRODU_HEXA"."MPPERSONENSTAMM" e
        ON t.PERSONALNUMMER = e.PERSONALNUMMER
      WHERE t.PERSONALNUMMER = ?
        AND p.PROJEKTNAME NOT LIKE '%Hexa%'
        AND p.PROJEKTNUMMER NOT LIKE '%Hexa%'
        AND (p.PROJEKTINTERN IS NULL OR p.PROJEKTINTERN = 0)
      GROUP BY
        e.PERSONALNUMMER,
        e.VORNAME,
        e.NACHNAME,
        e.EMAIL,
        p.PROJEKTNUMMER,
        p.PROJEKTNAME,
        YEAR(t.LEISTUNGSTAG),
        p.OCRCODE1
      ORDER BY "year" DESC, "totalHours" DESC
    `;

    const startedAt = Date.now();
    console.log(`[server] Loading SAP report for employee ${employeeId}`);
    const results = await db.execute<UserProjectRow>(query, [employeeId]);
    console.log(`[server] SAP report completed in ${Date.now() - startedAt}ms with ${results.length} rows.`);

    res.json(
      results.map((row) => ({
        ...row,
        totalHours: parseHours(row.totalHours),
        year: row.year ? parseInt(String(row.year), 10) : null,
      })),
    );
  } catch (error) {
    console.error('[server] Error fetching user project report:', error);
    db.markUnavailable(error);
    res.status(500).json({
      error: 'Failed to fetch user project report',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
