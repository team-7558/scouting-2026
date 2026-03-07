import { USER_ROLES } from "./auth.js";
import { getMatchDataInternal } from "./matches.js";
import { pgClient, protectOperation } from "./PgClient.js";

const storeTeamsInternal = async (event_code, teams) => {
    // Define the dynamic table name; note we sanitize event_code in the route so this is safe.
  const tableName = `teams_${event_code}`;
  const client = await pgClient();
  try {
    // Create the table if it does not exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
        team_number INT,
        team_name TEXT
        );
      `;
    await client.query(createTableQuery);

    // Loop through each match and insert the data into the table.
    for (const team of teams) {
      const { teamNumber, teamName } = team;

      const insertQuery = `
        INSERT INTO ${tableName} 
        (team_number, team_name)
        VALUES ($1, $2);
        `;
      let response = await client.query(insertQuery, [
        teamNumber, teamName
      ]);
      console.log(response);
    }
  } finally {
    await client.release();
  }
};

export const storeTeams = protectOperation(storeTeamsInternal, [USER_ROLES.Admin]);