// server/database/reports.js
import { pgClient, protectOperation } from "./PgClient.js";

export const storeReportInternal = async (eventKey, report) => {
  const tableName = `reports_${eventKey}`;
  const client = await pgClient();
  try {
    // Updated table schema with unpacked endgame fields.
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id TEXT PRIMARY KEY,
        event_key TEXT,
        match_key TEXT,
        match_start_time BIGINT,
        submission_time BIGINT,
        role TEXT,
        comments TEXT,
        disabled BOOLEAN,
        driver_skill TEXT,
        defense_skill TEXT,
        scout_id INT,
        scout_name TEXT,
        robot TEXT,
        station TEXT
      );
    `;
    await client.query(createTableQuery);

    const insertQuery = `
      INSERT INTO ${tableName} 
        (id, event_key, match_key, match_start_time, submission_time, role, comments, disabled, driver_skill, defense_skill, scout_id, scout_name, robot, station)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO NOTHING
      RETURNING id;
    `;
    const submissionTime = Date.now();

    // Unpack the endgame fields with defaults if not present.
    const {
      role = null,
      comments = null,
      disabled = null,
      driverSkill = null,
      defenseSkill = null,
    } = report.endgame || {};

    const values = [
      report.reportId,
      eventKey,
      report.matchKey,
      report.matchStartTime,
      submissionTime,
      role,
      comments,
      disabled,
      driverSkill,
      defenseSkill,
      report.scoutId,
      report.scoutName,
      report.robot,
      report.station,
    ];
    const result = await client.query(insertQuery, values);
    return result.rows[0];
  } finally {
    await client.release();
  }
};

export const getReportInternal = async (eventKey, matchKey, robot) => {
  const tableName = `reports_${eventKey}`;
  const client = await pgClient();
  try {
    const query = `
      SELECT *
      FROM ${tableName}
      WHERE match_key = $1 AND robot = $2
    `;
    const result = await client.query(query, [matchKey, robot]);
    return result.rows;
  } finally {
    await client.release();
  }
};

export const getReport = protectOperation(getReportInternal, ["USER"]);
export const storeReport = protectOperation(storeReportInternal, ["USER"]);
