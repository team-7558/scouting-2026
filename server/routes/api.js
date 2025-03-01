import express from "express";
import { customAlphabet } from "nanoid";
import { getScoutMatch, storeMatches } from "../database/matches.js";
import { storeReportAndCycles } from "../database/matchReportHelper.js";
import { getReport } from "../database/reports.js";
import { getCycles } from "../database/cycles.js";

// no underscores vs default alphabet
const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 12);

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

// POST route to fetch and store match data based on event_code provided in the request body.
router.post("/matches", async (req, res) => {
  // Expecting { event_code: "your_event_code_here" } in the request body
  const { event_code } = req.body;

  // Validate the event_code to allow only alphanumeric characters and underscores
  if (!event_code || !/^[a-zA-Z0-9_]+$/.test(event_code)) {
    return res.status(400).json({ message: "Invalid or missing event code" });
  }

  // Build the URL for the TBA API match_simple endpoint.
  const tbaUrl = `https://www.thebluealliance.com/api/v3/event/${event_code}/matches/simple`;

  try {
    // Use global fetch (available in Node 18+; otherwise install and import node-fetch)
    const response = await fetch(tbaUrl, {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY, // Ensure your API key is set in your environment variables.
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return res.status(500).json({
        message: "Failed to fetch data from TBA API: " + res.message,
      });
    }

    const matches = await response.json();

    // Call the database module to store the matches in a table named matches_{event_code}
    await storeMatches(req, event_code, matches);

    res.json({ message: "Matches stored successfully", count: matches.length });
  } catch (error) {
    console.error("Error processing match data:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

router.get("/getScoutMatch", async (req, res) => {
  const { eventKey, station, matchKey } = req.query;
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

    // Strip "frc" prefix from the team string (if present)
    let teamNumber = matchData.team;
    if (teamNumber && teamNumber.startsWith("frc")) {
      teamNumber = teamNumber.substring(3);
    }

    let opponents = { r1: matchData.r1, r2: matchData.r2, r3: matchData.r3 };
    if (station.startsWith("r")) {
      opponents = { b1: matchData.b1, b2: matchData.b2, b3: matchData.b3 };
    }

    res.json({
      teamNumber,
      match_number: matchData.match_number,
      comp_level: matchData.comp_level,
      eventKey: matchData.eventKey,
      set_number: matchData.set_number,
      opponents,
      reportId: nanoid(),
    });
  } catch (error) {
    console.error("Error querying scoutMatch:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// New route to submit a match, storing both report and cycles
router.post("/submitMatch", async (req, res) => {
  const { eventKey, matchKey, station, matchData } = req.body;

  // Validate required parameters
  if (!eventKey || !matchKey || !station || !matchData || !matchData.reportId) {
    return res
      .status(400)
      .json({ message: "Missing required parameters or reportId" });
  }

  try {
    // Store report and cycles in sequence.
    await storeReportAndCycles(req, eventKey, matchKey, matchData, station);

    res.json({
      message: "Match submitted successfully",
      reportId: matchData.reportId,
    });
  } catch (error) {
    console.error("Error submitting match:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// New route to get report and cycles based on eventKey, matchKey, and robot
router.get("/getReportData", async (req, res) => {
  const { eventKey, matchKey, robot } = req.query;

  if (!eventKey || !matchKey || !robot) {
    return res.status(400).json({
      message: "Missing required query parameters: eventKey, matchKey, robot",
    });
  }

  try {
    const report = await getReport(req, eventKey, matchKey, robot);
    const cycles = await getCycleses(req, eventKey, matchKey, robot);

    res.json({ report, cycles });
  } catch (error) {
    console.error("Error fetching report data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
export default router;
