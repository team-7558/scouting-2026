import { USER_ROLES } from "./auth.js";
import { pgClient, protectOperation } from "./PgClient.js";

export const storeTeamsInternal = async (event_code, teams) => {
    // Define the dynamic table name; note we sanitize event_code in the route so this is safe.
  const tableName = `teams_${event_code}`;
  const client = await pgClient();
  try {
    // Create the table if it does not exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
        team_number INT,
        team_name TEXT,
        avg_shot_rate INT
        );
      `;
    await client.query(createTableQuery);

    // Loop through each match and insert the data into the table.
    for (const team of teams) {
      const teamNumber = team.team_number;
      const teamName = team.nickname;

      const insertQuery = `
        INSERT INTO ${tableName} 
        (team_number, team_name, avg_shot_rate)
        VALUES ($1, $2, $3);
        `;
      let response = await client.query(insertQuery, [
        teamNumber, teamName, null
      ]);
      console.log(teamNumber, teamName, response);
    }
  } finally {
    await client.release();
  }
};

const getTeamsInternal = async ({eventKey, teams}) => {
  const tableName = `teams_${eventKey}`;
  const client = await pgClient();
  try {
    const getAllTeamsQuery = `
    SELECT * FROM ${tableName}
    `;

    const getSpecificTeamsQuery = `
    SELECT * FROM ${tableName}
    WHERE team_number = ANY($1::int[])
    `;

    if (teams) return await client.query(getSpecificTeamsQuery, [teams]);
    else return await client.query(getAllTeamsQuery);
  } finally {
    await client.release();
  }
}

export const getTeams = protectOperation(getTeamsInternal, [USER_ROLES.USER]);

export const storeTeams = protectOperation(storeTeamsInternal, [USER_ROLES.Admin]);