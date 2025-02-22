// database/matches.js
import { pgClient, protectOperation } from "./PgClient.js";

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
      const r1 = redTeams[0] || null;
      const r2 = redTeams[1] || null;
      const r3 = redTeams[2] || null;
      const b1 = blueTeams[0] || null;
      const b2 = blueTeams[1] || null;
      const b3 = blueTeams[2] || null;

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

// Wrap the internal function with protectOperation if you want to restrict usage (for example to admins).
// If no role restriction is needed, you can leave the allowed roles array empty.
export const storeMatches = protectOperation(storeMatchesInternal, []);
