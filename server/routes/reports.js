// reports.js
import express from "express";
import {
  getReportsAndCyclesFiltered,
  storeReportAndCycles,
} from "../database/matchReportHelper.js";
import { calculateAverageMetrics } from "../metrics/reports.js";
import { getMatchDataInternal } from "../database/matches.js";
// Import the new pit scouting query function:
import { getPitScoutingByRobotInternal } from "../database/pit_scouting.js";

const router = express.Router();

/**
 * GET /api/reports
 *
 * Query parameters:
 *   - eventKey (required)
 *   - matchKey (optional)
 *   - robot (optional)
 *
 * Returns a list of reports (each with attached cycles) filtered by the provided parameters,
 * and averages as a map of robot -> calculateAverageMetrics(reportsForRobot).
 * If a robot is provided, also returns that robot’s pit scouting data.
 */
router.get("/", async (req, res) => {
  const { eventKey, matchKey, robot } = req.query;
  if (!eventKey) {
    return res.status(400).json({ error: "Missing eventKey query parameter" });
  }
  try {
    // Get filtered reports (this may already filter by robot/matchKey)
    const reports = await getReportsAndCyclesFiltered(
      req,
      eventKey,
      matchKey,
      robot
    );

    // Group reports by robot
    const reportsByRobot = {};
    reports.forEach((report) => {
      const robotId = report.robot; // assuming the report object has a "robot" field
      if (!reportsByRobot[robotId]) {
        reportsByRobot[robotId] = [];
      }
      reportsByRobot[robotId].push(report);
    });

    // Calculate averages for each robot group
    let averages = {};
    Object.keys(reportsByRobot).forEach((robotId) => {
      averages[robotId] = calculateAverageMetrics(reportsByRobot[robotId]);
    });
    if (matchKey) {
      // Retrieve the match data using our existing internal function.
      const matchData = await getMatchDataInternal(eventKey, matchKey);
      if (!matchData) {
        throw new Error("Match not found");
      }
      const robotStations = {
        [matchData.r1]: "r1",
        [matchData.r2]: "r2",
        [matchData.r3]: "r3",
        [matchData.b1]: "b1",
        [matchData.b2]: "b2",
        [matchData.b3]: "b3",
      };
      console.log(robotStations, averages);
      Object.keys(robotStations).forEach((robotKey) => {
        if (averages[robotKey]) {
          averages[robotKey].matchStation = robotStations[robotKey];
        }
      });
    }

    // If a robot is provided, get its pit scouting data.
    let pitScouting = null;
    if (robot) {
      pitScouting = await getPitScoutingByRobotInternal(eventKey, robot);
    }

    res.json({ averages, reports, pitScouting });
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
