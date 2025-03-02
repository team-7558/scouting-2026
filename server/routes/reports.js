// server/api/reports.js
import express from "express";
import {
  getReportsAndCyclesFiltered,
  storeReportAndCycles,
} from "../database/matchReportHelper.js";

const router = express.Router();

/**
 * GET /api/reports
 *
 * Query parameters:
 *   - eventKey (required)
 *   - matchKey (optional)
 *   - robot (optional)
 *
 * Returns a list of reports (each with attached cycles) filtered by the provided parameters.
 */
router.get("/", async (req, res) => {
  const { eventKey, matchKey, robot } = req.query;
  if (!eventKey) {
    return res.status(400).json({ error: "Missing eventKey query parameter" });
  }
  try {
    const reports = await getReportsAndCyclesFiltered(
      req,
      eventKey,
      matchKey,
      robot
    );
    res.json(reports);
  } catch (error) {
    console.error("Error fetching filtered reports with cycles:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// New route to submit a match, storing both report and cycles
router.post("/submit", async (req, res) => {
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

export default router;
