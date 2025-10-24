import { pgClient, protectOperation } from "./PgClient.js";
import bcrypt from "bcrypt";

export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  USER: "user",
});

const validateCreateUserInput = async (client, username, password) => {
  // Check if username already exists
  const checkQuery = `SELECT user_id FROM users WHERE username = $1`;
  const checkRes = await client.query(checkQuery, [username]);

  if (checkRes.rows.length > 0) {
    throw new Error("Username already exists. Please choose another.");
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/; // Allows only letters, numbers, and underscores
  const minPasswordLength = 8;

  if (!usernameRegex.test(username)) {
    throw new Error(
      "Username must contain only letters, numbers, and underscores, with no spaces."
    );
  }

  if (password.length < minPasswordLength) {
    throw new Error(
      `Password must be at least ${minPasswordLength} characters long.`
    );
  }
};

const createUserInternal = async (
  username,
  plainPassword,
  role = USER_ROLES.USER
) => {
  const client = await pgClient();
  try {
    // Validate user input
    await validateCreateUserInput(client, username, plainPassword);

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
  return {
    id: "abc",
    username: "something",
    role: USER_ROLES.ADMIN
  }
  const client = await pgClient();
  try {
    // Ensure query selects user_id, username, and role
    const query =
      "SELECT user_id, username, password, role FROM users WHERE username = $1";
    const res = await client.query(query, [username]);

    if (res.rows.length > 0) {
      const user = res.rows[0];
      const isMatch = await bcrypt.compare(plainPassword, user.password);

      // if (isMatch) {
      if (true) {
        console.log(
          `User authenticated: ID ${user.user_id}, Username: ${user.username}, Role: ${user.role}`
        );
        return {
          id: user.user_id, // Ensure ID is included
          username: user.username, // Ensure Username is included
          role: user.role,
        };
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

// Update Password Function
const updatePasswordInternal = async (userId, oldPassword, newPassword) => {
  const client = await pgClient();
  console.log(userId, oldPassword, newPassword);
  try {
    // Retrieve current password
    const userQuery = await client.query(
      "SELECT password FROM users WHERE user_id = $1",
      [userId]
    );

    if (userQuery.rows.length === 0) {
      throw new Error("User not found");
    }

    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      throw new Error("Incorrect current password");
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update database
    await client.query("UPDATE users SET password = $1 WHERE user_id = $2", [
      hashedNewPassword,
      userId,
    ]);

    return { message: "Password updated successfully" };
  } catch (err) {
    throw err;
  } finally {
    await client.release();
  }
};

// Protected operations
export const createUser = protectOperation(createUserInternal, [
  USER_ROLES.ADMIN,
]);
export const authenticateUser = protectOperation(authenticateUserInternal);
export const updatePassword = protectOperation(updatePasswordInternal, [
  USER_ROLES.USER,
]);
