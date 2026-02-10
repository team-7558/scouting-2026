// server/database/cycles.js
import { USER_ROLES } from "./auth.js";
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
        "key" TEXT PRIMARY KEY,
        match_key TEXT,
        cycle_index INT,
        phase TEXT,
        type TEXT,
        location TEXT,
        start_time INT,
        success BOOLEAN,
        end_time INT,
        rate INT,
        robot TEXT,
        report_id TEXT,
        pin_count INT,
        foul_count INT
      );
    `;
    console.log(await client.query(createTableQuery));
    // console.log("created table");

    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i];

      // Always stringify JSON values if not null.
      const location =
        cycle.location != null
          ? JSON.stringify(cycle.location)
          : null;

      const cycleTime =
        typeof cycle.startTime === "number" && typeof cycle.endTime === "number"
          ? cycle.endTime - cycle.startTime
          : null;
      const key = `${eventKey}_${matchKey}_${additionalData.reportId}_${i}`;

      const pinCount = cycle.pinCount || null;
      const foulCount = cycle.foulCount || null;

      const insertQuery = `
        INSERT INTO ${tableName} 
          ("key", 
          match_key,
          cycle_index,
          phase, 
          type, 
          location, 
          start_time,
          success,
          end_time,
          rate,
          robot,
          report_id,
          pin_count,
          foul_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (key) DO NOTHING;
      `;
      const values = [
        key,
        matchKey,
        i,
        cycle.phase,
        cycle.type,
        location,
        cycle.startTime,
        cycle.success,
        cycle.endTime,
        cycle.rate,
        additionalData.robot,
        additionalData.reportId,
        pinCount,
        foulCount,
      ];
      await client.query(insertQuery, values);
    }
  } finally {
    await client.release();
  }
};

// Helper function to safely parse JSON strings.
const safeJSONParse = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return JSON.parse(value);
      } catch (e) {
        // If parsing fails, just return the original value.
        return value;
      }
    }
  }
  return value;
};

export const getCyclesByReportInternal = async (eventKey, reportId) => {
  const tableName = `cycles_${eventKey}`;
  const client = await pgClient();
  try {
    const query = `
      SELECT *
      FROM ${tableName}
      WHERE report_id = $1
      ORDER BY cycle_index ASC
    `;
    const result = await client.query(query, [reportId]);
    return result.rows;
  } finally {
    await client.release();
  }
};

export const getCyclesByReport = protectOperation(getCyclesByReportInternal, [
  USER_ROLES.USER,
]);
export const storeCycles = protectOperation(storeCyclesInternal, [
  USER_ROLES.USER,
]);
