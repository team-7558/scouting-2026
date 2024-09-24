import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import cors from "cors";

import authRoutes, { verifyToken } from "./routes/auth.js";
import apiRoutes from "./routes/api.js";

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
console.log(app);

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, "../client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
});

// Use the auth routes
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("server listening on port " + PORT);
});
