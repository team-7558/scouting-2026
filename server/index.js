import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const app = express();
app.use(cors());
console.log(app);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("server listening on port " + PORT);
});

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, "../client/build")));

// Handle GET requests to /api route
app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

// All other GET requests not handled before will return our React app
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
});
