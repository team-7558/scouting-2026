import express from "express";
import jwt from "jsonwebtoken";
import { authenticateUser, createUser } from "../database/auth.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Sign-in endpoint
router.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await authenticateUser(req, username, password);
    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // Respond with the token
    return res.json({ token });
  } catch (err) {
    return res.status(401).json({
      message: "Invalid credentials",
      error: err.message,
    });
  }
});

// Sign-in endpoint
router.post("/createUser", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const user = await createUser(req, username, password, role);
    return res.send("Success: " + JSON.stringify(user));
  } catch (err) {
    console.log(err);
    return res
      .status(401)
      .json({ message: "Issue creating user", error: err.message });
  }
});
export const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  console.log("verifying token: " + token);
  if (!token) {
    return res.redirect("/signin"); // Redirect to login page if no token is provided
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // Extract token from "Bearer <token>"
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect("/signin"); // Redirect to login page if token is invalid
  }
};

export const extractRoleFromRequest = async (req) => {
  const token = req.headers["authorization"];

  if (!token) {
    throw new Error("PgClient: No token provided");
  }

  try {
    const role = jwt.verify(token, JWT_SECRET).role; // Extract token from "Bearer <token>"
    return role;
  } catch (err) {
    throw new Error("PgClient: Failed to verify token " + err.message);
  }
};

export default router;
