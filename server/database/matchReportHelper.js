// server/database/matchReportHelper.js
import { storeReport } from "./reports.js";
import { storeCycles } from "./cycles.js";

/**
 * Stores a report and its associated cycles.
 *
 * @param {Object} req - The request object (for auth extraction by protectOperation)
 * @param {string} eventKey
 * @param {string} matchKey
 * @param {Object} matchData - Contains matchStartTime, robot, scoutId, scoutName, cycles, endgame, etc.
 * @param {string} station
 */
export const storeReportAndCycles = async (
  req,
  eventKey,
  matchKey,
  matchData,
  station
) => {
  // Prepare report data from matchData, including matchStartTime.
  const reportData = {
    matchKey,
    reportId: matchData.reportId,
    matchStartTime: matchData.matchStartTime,
    endgame: matchData.endgame,
    scoutId: matchData.scoutId,
    scoutName: matchData.scoutName,
    robot: matchData.robot,
    station,
  };

  // Store the report first
  const report = await storeReport(req, eventKey, reportData);
  // Now store cycles, passing additional data containing robot and the reportId.
  await storeCycles(req, eventKey, matchKey, matchData.cycles, {
    robot: matchData.robot,
    reportId: matchData.reportId,
  });

  return report;
};
