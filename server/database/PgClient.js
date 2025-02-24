import pg from "pg";
const { Pool } = pg;

import { extractRoleFromRequest } from "../routes/auth.js";
import { USER_ROLES } from "./auth.js";

// Database URI

const config = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = new Pool(config);

// the pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export const pgClient = async () => await pool.connect();

export const protectOperation =
  (operation, allowedroles = null) =>
  async (req, ...args) => {
    // return await operation(...args);
    try {
      const role = await extractRoleFromRequest(req);
      if (
        role == USER_ROLES.ADMIN ||
        !allowedroles ||
        allowedroles.length == 0 ||
        allowedroles.includes(role)
      ) {
        return await operation(...args);
      }
      throw new Error("Not authorized to used this route.");
    } catch (err) {
      console.log(err);
      throw err;
    }
  };
