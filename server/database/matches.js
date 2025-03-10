// database/matches.js
import { USER_ROLES } from "./auth.js";
import { pgClient, protectOperation } from "./PgClient.js";

const stripFRC = (teamNumber) => {
  if (teamNumber && teamNumber.startsWith("frc")) {
    return teamNumber.substring(3);
  }
  return teamNumber;
};

// database/matches.js
export const storeOrUpdateMatchesInternal = async (event_code, matches) => {
  const tableName = `matches_${event_code}`;
  const client = await pgClient();
  try {
    // Ensure the table exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        key TEXT PRIMARY KEY,
        comp_level TEXT,
        set_number INT,
        match_number INT,
        r1 TEXT,
        r2 TEXT,
        r3 TEXT,
        b1 TEXT,
        b2 TEXT,
        b3 TEXT,
        event_key TEXT
      );
    `;
    await client.query(createTableQuery);

    // Iterate through matches and upsert each record.
    for (const match of matches) {
      const { key, comp_level, set_number, match_number, event_key } = match;
      const redTeams = match.alliances?.red?.team_keys || [];
      const blueTeams = match.alliances?.blue?.team_keys || [];

      const sanitize = (teamKey) =>
        teamKey ? teamKey.replace(/^frc/, "") : null;
      const r1 = sanitize(redTeams[0]);
      const r2 = sanitize(redTeams[1]);
      const r3 = sanitize(redTeams[2]);
      const b1 = sanitize(blueTeams[0]);
      const b2 = sanitize(blueTeams[1]);
      const b3 = sanitize(blueTeams[2]);

      const upsertQuery = `
        INSERT INTO ${tableName} 
        (key, comp_level, set_number, match_number, r1, r2, r3, b1, b2, b3, event_key)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (key) DO UPDATE SET
          comp_level = EXCLUDED.comp_level,
          set_number = EXCLUDED.set_number,
          match_number = EXCLUDED.match_number,
          r1 = EXCLUDED.r1,
          r2 = EXCLUDED.r2,
          r3 = EXCLUDED.r3,
          b1 = EXCLUDED.b1,
          b2 = EXCLUDED.b2,
          b3 = EXCLUDED.b3,
          event_key = EXCLUDED.event_key;
      `;
      await client.query(upsertQuery, [
        key,
        comp_level,
        set_number,
        match_number,
        r1,
        r2,
        r3,
        b1,
        b2,
        b3,
        event_key,
      ]);
    }
  } finally {
    await client.release();
  }
};

export const storeMatchesInternal = async (event_code, matches) => {
  // Define the dynamic table name; note we sanitize event_code in the route so this is safe.
  const tableName = `matches_${event_code}`;
  const client = await pgClient();
  try {
    // Create the table if it does not exist
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      key TEXT PRIMARY KEY,
      comp_level TEXT,
      set_number INT,
      match_number INT,
      r1 TEXT,
      r2 TEXT,
      r3 TEXT,
      b1 TEXT,
      b2 TEXT,
      b3 TEXT,
      event_key TEXT
      );
      `;
    await client.query(createTableQuery);

    // Loop through each match and insert the data into the table.
    for (const match of matches) {
      const { key, comp_level, set_number, match_number, event_key } = match;
      // Extract team keys for alliances (r1, r2, r3 for red and b1, b2, b3 for blue)
      const redTeams = match.alliances?.red?.team_keys || [];
      const blueTeams = match.alliances?.blue?.team_keys || [];
      const r1 = stripFRC(redTeams[0]) || null;
      const r2 = stripFRC(redTeams[1]) || null;
      const r3 = stripFRC(redTeams[2]) || null;
      const b1 = stripFRC(blueTeams[0]) || null;
      const b2 = stripFRC(blueTeams[1]) || null;
      const b3 = stripFRC(blueTeams[2]) || null;

      const insertQuery = `
        INSERT INTO ${tableName} 
        (key, comp_level, set_number, match_number, r1, r2, r3, b1, b2, b3, event_key)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (key) DO NOTHING;
        `;
      let response = await client.query(insertQuery, [
        key,
        comp_level,
        set_number,
        match_number,
        r1,
        r2,
        r3,
        b1,
        b2,
        b3,
        event_key,
      ]);
      console.log(response);
    }
  } finally {
    await client.release();
  }
};
export const getScoutMatchInternal = async (eventKey, station, matchKey) => {
  // Validate station
  const allowedStations = ["r1", "r2", "r3", "b1", "b2", "b3"];
  if (!allowedStations.includes(station)) {
    throw new Error("Invalid station parameter");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(eventKey)) {
    throw new Error("Invalid eventKey");
  }
  // Dynamically build the table name
  const tableName = `matches_${eventKey}`;
  const client = await pgClient();
  try {
    // Note: table name and column name cannot be parameterized, so we've validated them above.
    const query = `
      SELECT match_number, comp_level, event_key, set_number, ${station} AS team, r1, r2, r3, b1, b2, b3
      FROM ${tableName}
      WHERE key = $1
      `;
    const result = await client.query(query, [`${eventKey}_${matchKey}`]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } finally {
    await client.release();
  }
};
export const getMatchDataInternal = async (eventKey, matchKey) => {
  // Validate eventKey to prevent SQL injection issues.
  if (!/^[a-zA-Z0-9_]+$/.test(eventKey)) {
    throw new Error("Invalid eventKey");
  }
  // Build the table name dynamically.
  const tableName = `matches_${eventKey}`;
  const client = await pgClient();
  try {
    // Construct the query to fetch the row where the primary key matches
    // the combined eventKey and matchKey (as stored in the table).
    const query = `
      SELECT *
      FROM ${tableName}
      WHERE key = $1
    `;
    const result = await client.query(query, [`${eventKey}_${matchKey}`]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } finally {
    await client.release();
  }
};

export const getScoutMatch = protectOperation(getScoutMatchInternal, [
  USER_ROLES.USER,
]);
// Optionally, protect this operation so that only authorized users can access it.
export const getMatchData = protectOperation(getMatchDataInternal, [
  USER_ROLES.USER,
]);

export const storeMatches = protectOperation(storeMatchesInternal, [
  USER_ROLES.ADMIN,
]);

// Optionally protect the operation.
export const storeOrUpdateMatches = protectOperation(
  storeOrUpdateMatchesInternal,
  [USER_ROLES.ADMIN]
);
