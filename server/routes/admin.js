// routes/admin.js
import express from "express";
import notion from "../services/notionClient.js"; // adjust the path as needed
import { storePitScouting } from "../database/pit_scouting.js";

const router = express.Router();

// POST route to import Notion pit scouting data into SQL server.
router.post("/importNotionPitScouting", async (req, res) => {
  const { eventKey, databaseId } = req.body;

  if (!eventKey || !databaseId) {
    return res.status(400).json({ message: "Missing eventKey or databaseId" });
  }

  try {
    // Query the Notion database for all pages.
    const notionResponse = await notion.databases.query({
      database_id: databaseId,
    });
    const pages = notionResponse.results;
    // console.log(pages);
    // Store (upsert) the pit scouting data into the SQL table.
    await storePitScouting(req, eventKey, pages);

    res.json({
      message: "Notion pit scouting data imported successfully",
      importedCount: pages.length,
    });
  } catch (error) {
    console.error("Error importing pit scouting data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
