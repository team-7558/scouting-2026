import express from "express";
import jwt from "jsonwebtoken";
import {
  authenticateUser,
  createUser,
  updatePassword,
} from "../database/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Extract user information from the JWT token
export const extractUserFromRequest = (req) => {
  const token = req.headers["authorization"];

  if (!token) {
    throw new Error("No token provided.");
  }

  try {
    const user = jwt.verify(token, JWT_SECRET); // Ensure correct token extraction
    return user;
  } catch (err) {
    throw new Error("Failed to verify token: " + err.message);
  }
};

// Extract only the role from the token using extractUserFromRequest to avoid duplicate logic
export const extractRoleFromRequest = (req) => {
  try {
    const user = extractUserFromRequest(req);
    return user.role;
  } catch (err) {
    throw new Error("Failed to extract role: " + err.message);
  }
};

// Sign-in endpoint
router.post("/signin", async (req, res) => {
  let { username, password } = req.body;
  username = username.toLowerCase();

  try {
    const user = await authenticateUser(req, username, password);

    // Ensure ID is a number before signing the token
    const token = jwt.sign(
      {
        id: Number(user.id),
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ token });
  } catch (err) {
    return res.status(401).json({
      message: "Invalid credentials",
      error: err.message,
    });
  }
});

// Create User Endpoint
router.post("/createUser", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const user = await createUser(req, username, password, role);
    return res.send("Success: " + JSON.stringify(user));
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: err.message });
  }
});

// Update Password Endpoint
router.post("/updatePassword", async (req, res) => {
  try {
    const user = extractUserFromRequest(req);
    console.log(user);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both old and new passwords are required" });
    }

    const result = await updatePassword(req, user.id, oldPassword, newPassword);
    res.json(result);
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
