// server/database/cycles.js
import { pgClient, protectOperation } from "./PgClient.js";

export const storeCyclesInternal = async (
  eventKey,
  matchKey,
  cycles,
  additionalData = {}
) => {
  const tableName = `cycles_${eventKey}`;
  const client = await pgClient();
  try {
    // Update the table schema to include new HANG cycle fields.
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        key TEXT PRIMARY KEY,
        match_key TEXT,
        cycle_index INT,
        phase TEXT,
        type TEXT,
        attained_location JSONB,
        start_time INT,
        deposit_type TEXT,
        deposit_location JSONB,
        end_time INT,
        cycle_time INT,
        robot TEXT,
        report_id TEXT,
        cage_location TEXT,
        cage_touch_time INT,
        cage_type TEXT,
        result TEXT
      );
    `;
    await client.query(createTableQuery);

    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i];

      // Always stringify JSON values if not null.
      const attainedLocation =
        cycle.attainedLocation != null
          ? JSON.stringify(cycle.attainedLocation)
          : null;
      const depositLocation =
        cycle.depositLocation != null
          ? JSON.stringify(cycle.depositLocation)
          : null;

      const cycleTime =
        typeof cycle.startTime === "number" && typeof cycle.endTime === "number"
          ? cycle.endTime - cycle.startTime
          : null;
      const key = `${eventKey}_${matchKey}_${additionalData.reportId}_${i}`;

      // For HANG cycles, include additional properties; for other cycle types, they will be null.
      const cageLocation = cycle.cageLocation || null;
      const cageTouchTime = cycle.cageTouchTime || null;
      const cageType = cycle.cageType || null;
      const resultField = cycle.result || null;

      const insertQuery = `
        INSERT INTO ${tableName} 
          (key, match_key, cycle_index, phase, type, attained_location, start_time, deposit_type, deposit_location, end_time, cycle_time, robot, report_id, cage_location, cage_touch_time, cage_type, result)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (key) DO NOTHING;
      `;
      const values = [
        key,
        matchKey,
        i,
        cycle.phase || null,
        cycle.type || null,
        attainedLocation,
        cycle.startTime || null,
        cycle.depositType || null,
        depositLocation,
        cycle.endTime || null,
        cycleTime,
        additionalData.robot || null,
        additionalData.reportId || null,
        cageLocation,
        cageTouchTime,
        cageType,
        resultField,
      ];
      await client.query(insertQuery, values);
    }
  } finally {
    await client.release();
  }
};

export const getCyclesInternal = async (eventKey, matchKey, robot) => {
  const tableName = `cycles_${eventKey}`;
  const client = await pgClient();
  try {
    const query = `
      SELECT *
      FROM ${tableName}
      WHERE match_key = $1 AND robot = $2
      ORDER BY cycle_index ASC
    `;
    const result = await client.query(query, [matchKey, robot]);
    // Optionally parse JSON columns.
    const cycles = result.rows.map((row) => ({
      ...row,
      attained_location: row.attained_location
        ? JSON.parse(row.attained_location)
        : null,
      deposit_location: row.deposit_location
        ? JSON.parse(row.deposit_location)
        : null,
    }));
    return cycles;
  } finally {
    await client.release();
  }
};

export const getCycles = protectOperation(getCyclesInternal, ["USER"]);
export const storeCycles = protectOperation(storeCyclesInternal, ["USER"]);
