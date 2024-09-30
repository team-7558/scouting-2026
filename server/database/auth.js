import { pgClient, protectOperation } from "./PgClient.js";
import bcrypt from "bcrypt";

export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  USER: "user",
});

const createUserInternal = async (
  username,
  plainPassword,
  role = USER_ROLES.USER
) => {
  const client = await pgClient();
  try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Insert the new user with role into the users table
    const query = `
       INSERT INTO users (username, password, role) 
       VALUES ($1, $2, $3) 
       RETURNING user_id;
     `;

    const res = await client.query(query, [username, hashedPassword, role]);

    const user = res.rows[0];
    console.log(`User created with ID: ${user.user_id}`);
    return user;
  } catch (err) {
    console.error("Error creating user:", err.stack);
    throw err;
  } finally {
    await client.release();
  }
};

const authenticateUserInternal = async (username, plainPassword) => {
  const client = await pgClient();
  try {
    // Retrieve the user by username, including role
    const query =
      "SELECT user_id, password, role FROM users WHERE username = $1";
    const res = await client.query(query, [username]);

    if (res.rows.length > 0) {
      const user = res.rows[0];
      const isMatch = await bcrypt.compare(plainPassword, user.password);

      if (isMatch) {
        console.log(
          `User authenticated: ID ${user.user_id}, Role: ${user.role}`
        );
        return user;
      } else {
        throw new Error("Invalid password");
      }
    } else {
      throw new Error("User not found");
    }
  } catch (err) {
    throw err;
  } finally {
    await client.release();
  }
};

export const createUser = protectOperation(createUserInternal, [
  USER_ROLES.ADMIN,
]);
export const authenticateUser = protectOperation(authenticateUserInternal);
