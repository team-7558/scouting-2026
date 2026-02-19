import express from "express";
import jwt from "jsonwebtoken";
import {
  authenticateUser,
  createUser,
  updatePassword,
} from "../database/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Middleware to protect routes
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1]; // Expect "Bearer <token>"
    if (!token) return res.status(401).json({ message: "Malformed token" });

    console.log(token);
    const user = jwt.verify(token, JWT_SECRET);
    console.log(user);
    req.user = user; // attach user to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Failed to verify token", error: err.message });
  }
};

// Utility functions (safe)
export const extractUserFromRequest = (req) => {
  if (!req.user) throw new Error("User not authenticated");
  return req.user;
};

export const extractRoleFromRequest = (req) => {
  const user = extractUserFromRequest(req);
  return user.role;
};

// ----------------- ROUTES -----------------

// Sign-in endpoint (PUBLIC)
router.post("/signin", async (req, res) => {
  let { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  username = username.toLowerCase();

  try {
    const user = await authenticateUser(req, username, password);

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

// Create user endpoint (PUBLIC, optional)
router.post("/createUser", async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await createUser(req, username, password, role);
    return res.json({ success: true, user });
  } catch (err) {
    console.error("Error creating user:", err);
    return res.status(500).json({ message: err.message });
  }
});

// Update password (PROTECTED)
router.post("/updatePassword", verifyToken, async (req, res) => {
  try {
    const user = extractUserFromRequest(req);
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both old and new passwords are required" });
    }

    const result = await updatePassword(req, user.id, oldPassword, newPassword);
    res.json(result);
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;