import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import apiRoutes from "./routes/api.js";
import webhookRoutes from "./routes/webhook.js";
import reportsRoutes from "./routes/reports.js";
import adminRoutes from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const app = express();

// Parse JSON first so req.body is populated
app.use(express.json());
app.use(cors({
  origin: "https://scouting-2026-cybn.onrender.com",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Logging middleware AFTER parsing
app.use((req, res, next) => {
  const start = Date.now();

  console.log("----- INCOMING REQUEST -----");
  console.log("Time:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);

  console.log("Headers:", {
    "content-type": req.headers["content-type"],
    authorization: req.headers["authorization"],
    origin: req.headers["origin"]
  });

  console.log("Query:", req.query);
  console.log("Params:", req.params);
  console.log("Body:", req.body);
  console.log("----------------------------");

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
});
app.use((err, req, res, next) => {
  console.error("JSON parse error:", err.message);
  res.status(400).json({ error: err.message });
});
// console.log(app);

// Use the auth routes
app.use("/api/reports", reportsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);
app.use("/webhook", webhookRoutes);

// Have Node serve the files for our built React app
// app.use(express.static(path.resolve(__dirname, "../client/build")));
// app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
// });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("server listening on port " + PORT);
});
