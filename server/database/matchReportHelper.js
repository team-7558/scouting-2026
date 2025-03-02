import { storeReport, getReportsFiltered } from "./reports.js";
import { storeCycles, getCyclesByReport } from "./cycles.js";

/*
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

/**
 * Fetch reports filtered by eventKey, optional matchKey, and/or optional robot.
 * For each report, fetch and attach its cycles.
 *
 * @param {string} eventKey - The event identifier.
 * @param {string|null} matchKey - (Optional) The match key to filter reports.
 * @param {string|null} robot - (Optional) The robot identifier to filter reports.
 * @returns {Promise<Array>} A promise that resolves to an array of reports with cycles attached.
 */
export const getReportsAndCyclesFiltered = async (
  req,
  eventKey,
  matchKey,
  robot
) => {
  // getReportsFiltered should build the query dynamically based on provided filters.
  const reports = await getReportsFiltered(req, eventKey, matchKey, robot);
  for (let report of reports) {
    // Attach cycles using the report's id.
    report.cycles = await getCyclesByReport(req, eventKey, report.id);
  }
  return reports;
};
