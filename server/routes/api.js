import express from "express";
import { customAlphabet } from "nanoid";
import { getScoutMatch, storeOrUpdateMatches } from "../database/matches.js";
import { fetchMatches } from "../services/tba.js";
import { getUsernameById, verifyToken } from "./auth.js";

// no underscores vs default alphabet
const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 12);

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.post("/matches", verifyToken, async (req, res) => {
  const { event_code } = req.body;
  if (!event_code || !/^[a-zA-Z0-9_]+$/.test(event_code)) {
    return res.status(400).json({ message: "Invalid or missing event code" });
  }

  try {
    const matches = await fetchMatches(event_code);
    await storeOrUpdateMatches(req, event_code, matches);
    res.json({
      message: "Matches stored/updated successfully",
      count: matches.length,
    });
  } catch (error) {
    console.error("Error processing match data:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

router.get("/getScoutMatch", verifyToken, async (req, res) => {
  // 1. Pull scoutId from the query parameters
  const { eventKey, station, matchKey, scoutId } = req.query;

  if (!eventKey || !station || !matchKey) {
    return res.status(400).json({
      message: "Missing required parameters: eventKey, station, matchKey",
    });
  }

  try {
    const matchData = await getScoutMatch(req, eventKey, station, matchKey);
    if (!matchData) {
      return res.status(404).json({ message: "Match not found" });
    }

    // --- 2. NEW: LOOKUP SCOUT NAME ---
    let username = null;
    if (scoutId) {
      // We pass 'req' because getUsernameById is wrapped in protectOperation
      username = await getUsernameById(req, scoutId);
    }
    // ---------------------------------

    // Strip "frc" prefix
    let teamNumber = matchData.team;
    if (teamNumber && teamNumber.startsWith("frc")) {
      teamNumber = teamNumber.substring(3);
    }

    let opponents = { r1: matchData.r1, r2: matchData.r2, r3: matchData.r3 };
    if (station.startsWith("r")) {
      opponents = { b1: matchData.b1, b2: matchData.b2, b3: matchData.b3 };
    }

    let nextMatchKey = matchData.comp_level + (matchData.match_number + 1);
    if (matchData.comp_level == "sf") {
      nextMatchKey = "sf" + (matchData.set_number + 1) + "m1";
    } else if (matchData.comp_level == "f") {
      nextMatchKey = "f1m" + (matchData.match_number + 1);
    }

    res.json({
      teamNumber,
      match_number: matchData.match_number,
      comp_level: matchData.comp_level,
      matchKey: matchKey,
      eventKey: matchData.eventKey,
      set_number: matchData.set_number,
      opponents,
      nextMatchKey,
      reportId: nanoid(),
      // --- 3. ADD USERNAME TO RESPONSE ---
      username: username || `Scout #${scoutId}`
    });
  } catch (error) {
    console.error("Error querying scoutMatch:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;