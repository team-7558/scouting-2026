// // database/pit_scouting.js
// import { pgClient, protectOperation } from "./PgClient.js";
// import { USER_ROLES } from "./auth.js";

// // Helper function that processes a Notion property based on its type.
// const processProperty = (prop) => {
//   if (!prop) return null;
//   switch (prop.type) {
//     case "number":
//       return prop.number;
//     case "checkbox":
//       return prop.checkbox;
//     case "multi_select":
//       return Array.isArray(prop.multi_select)
//         ? prop.multi_select.map((item) => item.name).join(", ")
//         : null;
//     case "rich_text":
//       return Array.isArray(prop.rich_text)
//         ? prop.rich_text.map((part) => part.plain_text).join("")
//         : null;
//     case "title":
//       return Array.isArray(prop.title)
//         ? prop.title.map((part) => part.plain_text).join("")
//         : null;
//     case "select":
//       return prop.select ? prop.select.name : null;
//     case "files":
//       return Array.isArray(prop.files) &&
//         prop.files.length > 0 &&
//         prop.files[0].file
//         ? prop.files[0].file.url
//         : null;
//     default:
//       return null;
//   }
// };

// // Mapping from Notion property keys to database column names.
// const propertyMapping = {
//   "Team Num.": "team_number",
//   Tier: "tier",
//   "Alg. De-score": "alg_descore",
//   "Primary Role": "primary_role",
//   "Auto Plans": "auto_plans",
//   Picture: "picture",
//   "HP Pref": "hp_pref",
//   "Coral Pickup": "coral_pickup",
//   Endgame: "endgame",
//   "Driver Exp.": "driver_exp",
//   Drivetrain: "drivetrain",
//   "Algae Scoring": "algae_scoring",
//   "Coral Scoring": "coral_scoring",
//   "Team Name": "team_name",
// };

// export const storePitScoutingInternal = async (eventKey, pages) => {
//   // Ensure eventKey is a string before sanitizing.
//   const eventKeyStr = String(eventKey);
//   const sanitizedEventKey = eventKeyStr.replace(/[^a-zA-Z0-9_]/g, "");
//   const tableName = `pit_scouting_${sanitizedEventKey}`;
//   const client = await pgClient();

//   try {
//     // Create table with columns matching the expected types.
//     const createTableQuery = `
//       CREATE TABLE IF NOT EXISTS ${tableName} (
//         id TEXT PRIMARY KEY,
//         team_number INTEGER,
//         tier TEXT,
//         alg_descore BOOLEAN,
//         primary_role TEXT,
//         auto_plans TEXT,
//         picture TEXT,
//         hp_pref TEXT,
//         coral_pickup TEXT,
//         endgame TEXT,
//         driver_exp TEXT,
//         drivetrain TEXT,
//         algae_scoring TEXT,
//         coral_scoring TEXT,
//         team_name TEXT
//       );
//     `;
//     await client.query(createTableQuery);

//     // Process each Notion page.
//     for (const page of pages) {
//       const id = page.id;
//       const processedData = {};

//       // Loop over our mapping so we generically process each property.
//       for (const notionKey in propertyMapping) {
//         const columnName = propertyMapping[notionKey];
//         processedData[columnName] = processProperty(page.properties[notionKey]);
//       }

//       // Upsert the record into the table.
//       const upsertQuery = `
//         INSERT INTO ${tableName} 
//           (id, team_number, tier, alg_descore, primary_role, auto_plans, picture, hp_pref, coral_pickup, endgame, driver_exp, drivetrain, algae_scoring, coral_scoring, team_name)
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
//         ON CONFLICT (id) DO UPDATE SET
//           team_number = EXCLUDED.team_number,
//           tier = EXCLUDED.tier,
//           alg_descore = EXCLUDED.alg_descore,
//           primary_role = EXCLUDED.primary_role,
//           auto_plans = EXCLUDED.auto_plans,
//           picture = EXCLUDED.picture,
//           hp_pref = EXCLUDED.hp_pref,
//           coral_pickup = EXCLUDED.coral_pickup,
//           endgame = EXCLUDED.endgame,
//           driver_exp = EXCLUDED.driver_exp,
//           drivetrain = EXCLUDED.drivetrain,
//           algae_scoring = EXCLUDED.algae_scoring,
//           coral_scoring = EXCLUDED.coral_scoring,
//           team_name = EXCLUDED.team_name;
//       `;
//       await client.query(upsertQuery, [
//         id,
//         processedData.team_number,
//         processedData.tier,
//         processedData.alg_descore,
//         processedData.primary_role,
//         processedData.auto_plans,
//         processedData.picture,
//         processedData.hp_pref,
//         processedData.coral_pickup,
//         processedData.endgame,
//         processedData.driver_exp,
//         processedData.drivetrain,
//         processedData.algae_scoring,
//         processedData.coral_scoring,
//         processedData.team_name,
//       ]);
//     }
//   } finally {
//     await client.release();
//   }
// };

// // Only ADMIN users can invoke this operation.
// export const storePitScouting = protectOperation(storePitScoutingInternal, [
//   USER_ROLES.ADMIN,
// ]);

// export const getPitScoutingByRobotInternal = async (eventKey, robot) => {
//   const eventKeyStr = String(eventKey);
//   const sanitizedEventKey = eventKeyStr.replace(/[^a-zA-Z0-9_]/g, "");
//   const tableName = `pit_scouting_${sanitizedEventKey}`;
//   const client = await pgClient();
//   try {
//     const query = `SELECT * FROM ${tableName} WHERE team_number = $1`;
//     const result = await client.query(query, [robot]);
//     return result.rows;
//   } finally {
//     await client.release();
//   }
// };

// // Optionally, protect the operation (here only ADMINs are allowed, adjust as needed)
// export const getPitScoutingByRobot = protectOperation(
//   getPitScoutingByRobotInternal,
//   [USER_ROLES.USER]
// );
