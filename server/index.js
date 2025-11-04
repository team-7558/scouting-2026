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

// Custom logging middleware
const logRequest = (req, res, next) => {
  const { method, url } = req;
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${method} ${url} ${res.statusCode} - ${duration}ms`);
  });

  next();
};

const app = express();
app.use(logRequest);
app.use(express.json());
app.use(cors());
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
