import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// Mock user data
const users = [
  {
    id: 1,
    username: "testuser",
    password: "password123", // Plain text password
  },
];

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Sign-in endpoint
router.post("/signin", (req, res) => {
  const { username, password } = req.body;

  // Check if user exists
  const user = users.find((user) => user.username === username);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Validate password
  if (password !== user.password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Create JWT token
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "1h",
  });

  // Respond with the token
  res.json({ token });
});

export const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  console.log("verifying token: " + token);
  if (!token) {
    return res.redirect("/signin"); // Redirect to login page if no token is provided
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET); // Extract token from "Bearer <token>"
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect("/signin"); // Redirect to login page if token is invalid
  }
};

export default router;
