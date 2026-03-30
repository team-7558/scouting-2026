// routes/admin.js
import express from "express";
import notion from "../services/notionClient.js"; // adjust the path as needed
import { getTeam, setShootingRate, storeTeams } from "../database/team.js";
import { verifyToken } from "./auth.js";
// import { storePitScouting } from "../database/pit_scouting.js";

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

    res.json({
      message: "Notion pit scouting data imported successfully",
      importedCount: pages.length,
    });
  } catch (error) {
    console.error("Error importing pit scouting data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/teamShotRate", verifyToken, async (req, res) => {
  const { eventKey, team, bps } = req.body;
  return await setShootingRate(req, eventKey, team, bps, res);
});

//returns an array of all teams with their shot rates
router.get("/teamShotRate", verifyToken, async (req, res) => {
  const { eventKey, robotNumber } = req.body;
  const response = await getTeam(req, eventKey, robotNumber);
  if (response.rowCount===0) {
    return res.status(400).json({ message: "Robot not found" });
  }
  return res.status(200).json(response.rows[0]);
});

router.post("/addTeamsToEvent", verifyToken, async (req, res) => {
  const { eventKey, teams } = req.body;
  if (!eventKey || !teams) {
    return res.status(400).json({ message: "Missing eventKey or teams" });
  }

  try {
    storeTeams(req, eventKey, teams);
    res.status(200).json({ message: "Stored teams" });
  } catch (error) {
    console.error(error);
    res.status(500),json({ message: "Error saving teams" });
  }
});

export default router;
