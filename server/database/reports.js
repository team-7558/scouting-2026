// server/database/reports.js
import { USER_ROLES } from "./auth.js";
import { getMatchDataInternal } from "./matches.js";
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
export const getMatchPreviousReportsInternal = async (eventKey, matchKey) => {
  // Validate eventKey to avoid SQL injection issues.
  if (!/^[a-zA-Z0-9_]+$/.test(eventKey)) {
    throw new Error("Invalid eventKey");
  }
  // Retrieve the match data using our existing internal function.
  const matchData = await getMatchDataInternal(eventKey, matchKey);
  if (!matchData) {
    throw new Error("Match not found");
  }
  // Extract team keys from the match data.
  const teams = [
    matchData.r1,
    matchData.r2,
    matchData.r3,
    matchData.b1,
    matchData.b2,
    matchData.b3,
  ].filter(Boolean); // Remove any null/undefined entries
  if (teams.length === 0) return [];

  // Assume that reports are stored in a dynamic table named `reports_${eventKey}`.
  const reportsTable = `reports_${eventKey}`;
  const client = await pgClient();
  try {
    // Build placeholders for the SQL IN clause (e.g., $1, $2, ..., $6)
    const placeholders = teams.map((_, i) => `$${i + 1}`).join(", ");
    const query = `
      SELECT *
      FROM ${reportsTable}
      WHERE robot IN (${placeholders})
    `;
    const result = await client.query(query, teams);
    return result.rows;
  } finally {
    await client.release();
  }
};

export const getReportsFilteredInternal = async (eventKey, matchKey, robot) => {
  const tableName = `reports_${eventKey}`;
  const client = await pgClient();
  try {
    let conditions = ["event_key = $1"];
    let values = [eventKey];
    let paramIndex = 2;

    if (matchKey) {
      conditions.push(`match_key = $${paramIndex}`);
      values.push(matchKey);
      paramIndex++;
    }
    if (robot) {
      conditions.push(`robot = $${paramIndex}`);
      values.push(robot);
    }

    const query = `
    SELECT *
    FROM ${tableName}
    WHERE ${conditions.join(" AND ")}
    `;
    const result = await client.query(query, values);
    if (!result.rows || result.rows.length == 0) {
      return await getMatchPreviousReportsInternal(eventKey, matchKey);
    }
    return result.rows;
  } finally {
    await client.release();
  }
};
// Protect the operation so that only authorized users (e.g., USER role) can access it.
export const getMatchPreviousReports = protectOperation(
  getMatchPreviousReportsInternal,
  [USER_ROLES.USER]
);

export const getReportsFiltered = protectOperation(getReportsFilteredInternal, [
  USER_ROLES.USER,
]);

export const getReport = protectOperation(getReportInternal, [USER_ROLES.USER]);
export const storeReport = protectOperation(storeReportInternal, [
  USER_ROLES.USER,
]);
