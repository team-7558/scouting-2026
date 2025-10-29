// calculateReportTotals.js

// Helper: safe check for "success" (prefer explicit success boolean, fall back to end_time presence)
const cycleSucceeded = (cycle) => {
  if (typeof cycle.success === "boolean") return cycle.success;
  return cycle.end_time !== null && cycle.end_time !== undefined;
};

// Helper: parse attained_location which might be JSON, a string, or an object
const parseAttainedLocation = (attained) => {
  if (!attained && attained !== 0) return null;
  if (typeof attained === "object") return attained;
  try {
    // maybe it's a JSON string
    const parsed = JSON.parse(attained);
    if (typeof parsed === "object") return parsed;
  } catch (e) {
    // not JSON, fall back to string
  }
  // return string form
  return String(attained);
};

export const calculateReportTotals = (report) => {
  // Default per-phase structure
  const DEFAULT_PHASE_STRUCTURE = {
    movement: {
      movementTime: 0,
      attempts: 0,
      successfulEnds: 0,
      movementRate: 0,
    },
    powerCell: {
      attainedCount: 0,
      // scoring breakdowns
      highScoreCount: 0,
      highMissCount: 0,
      lowScoreCount: 0,
      lowMissCount: 0,
      totalScoreCount: 0,
      feedCount: 0,
      avgScoringCycleTime: null,
      highAccuracy: 0,
      lowAccuracy: 0,
    },
    controlPanel: {
      positionAttempts: 0,
      positionCompleted: 0, // 0 or 1 (shouldn't happen more than once per match according to you)
      positionAvgTime: null,
      rotationAttempts: 0,
      rotationCompleted: 0, // 0 or 1
      rotationAvgTime: null,
      percentPositionDone: 0, // derived 0 or 1
      percentRotationDone: 0,
    },
    hang: {
      attempts: 0,
      successfulCount: 0,
      failCount: 0,
      parks: 0,
      shallowHangs: 0,
      deepHangs: 0,
      cycleTime: null,
      startTime: null,
      hangSuccessRate: 0,
    },
    defense: {
      totalTime: 0,
    },
    contact: {
      totalTime: 0,
      foulCount: 0,
      pinCount: 0,
    },
  };

  // Initialize results
  const results = {
    disabled: 0,
    // keep same post-match fields (if present on report object)
    driverSkill: report.driverSkill ?? "N/A",
    defenseSkill: report.defenseSkill ?? "N/A",
    auto: structuredClone(DEFAULT_PHASE_STRUCTURE),
    tele: structuredClone(DEFAULT_PHASE_STRUCTURE),
  };

  // For averaging scoring times per phase for power cell
  const powerCellScoringTimes = { auto: [], tele: [] };

  // For control panel times per phase/type
  const controlPanelTimes = {
    auto: { position: [], rotation: [] },
    tele: { position: [], rotation: [] },
  };

  // Keep disabled value
  results.disabled += Number(report.disabled ?? 0);

  // Guard: if no cycles, return early (but still return base structure)
  if (!Array.isArray(report.cycles) || report.cycles.length === 0) {
    // derived metrics already 0/null; return
    return results;
  }

  // Process cycles
  report.cycles.forEach((cycle) => {
    const phase = cycle.phase === "post_match" ? "tele" : cycle.phase; // treat post_match as tele
    if (!["auto", "tele"].includes(phase)) return; // ignore unknown phases

    const phaseResults = results[phase];
    const cycleType = cycle.type;
    const startTime = cycle.start_time !== undefined ? cycle.start_time : null;
    const endTime = cycle.end_time !== undefined ? cycle.end_time : null;
    const cycleTime = cycle.cycle_time !== undefined ? cycle.cycle_time : null;
    const depositType = cycle.deposit_type !== undefined ? cycle.deposit_type : null;
    const depositLocation = cycle.deposit_location !== undefined ? cycle.deposit_location : null;
    const attainedLocationRaw = cycle.attained_location !== undefined ? cycle.attained_location : null;
    const attainedLocation = parseAttainedLocation(attainedLocationRaw);

    switch (cycleType) {
      case "AUTO_MOVEMENT": {
        // Count attempt when startTime exists or even when cycle is present
        phaseResults.movement.attempts += 1;
        // record movementTime as the cycleTime (last one will be stored)
        if (cycleTime !== null) phaseResults.movement.movementTime = cycleTime;
        // successful end if end_time present
        if (endTime !== null) phaseResults.movement.successfulEnds += 1;
        // movementRate will be derived later
        break;
      }

      case "POWER_CELL": {
        // attainedCount = start_time not null (per your request)
        if (startTime !== null) phaseResults.powerCell.attainedCount += 1;

        // Determine success: prefer explicit success boolean, otherwise use end_time presence
        const success = cycleSucceeded(cycle);

        // Normalize depositLocation to string
        const locStr = depositLocation ? String(depositLocation).toUpperCase() : "";

        const isHigh =locStr.includes("POWER_PORT_HIGH");
        const isLow = locStr.includes("POWER_PORT_LOW");
        const isFeed = locStr.includes("FEED");

        if (isHigh) {
          if (success) phaseResults.powerCell.highScoreCount += 1;
          else phaseResults.powerCell.highMissCount += 1;
        } else if (isLow) {
          if (success) phaseResults.powerCell.lowScoreCount += 1;
          else phaseResults.powerCell.lowMissCount += 1;
        } else if (isFeed) {
          phaseResults.powerCell.feedCount += 1;
        }

        // totalScoreCount: count successes regardless of high/low
        if (success) phaseResults.powerCell.totalScoreCount += 1;

        // store cycleTime for averaging if success and cycleTime present
        if (cycleTime !== null) {
          powerCellScoringTimes[phase].push(cycleTime);
        }

        break;
      }

      case "CONTROL_PANEL": {
        // attained_location is JSON with 'position' or 'rotation', but could be string or object.
        // We'll interpret both object form and string forms.
        // Consider an attempt when startTime exists or when cycle exists.
        const loc = attainedLocation;
        // position detection
        let positionHit = false;
        let rotationHit = false;

        if (loc) {
          if (typeof loc === "string") {
            const s = loc.toLowerCase();
            if (s.includes("position")) positionHit = true;
            if (s.includes("rotation")) rotationHit = true;
          } else if (typeof loc === "object") {
            // check common keys & truthy values or explicit markers
            // e.g., { position: true } or { type: "position" }
            if (loc.position === true || loc.position === "true" || loc.type === "position" || loc.type === "POSITION")
              positionHit = true;
            if (loc.rotation === true || loc.rotation === "true" || loc.type === "rotation" || loc.type === "ROTATION")
              rotationHit = true;
            // also tolerate a key whose name contains position/rotation
            for (const k of Object.keys(loc)) {
              const lk = k.toLowerCase();
              if (lk.includes("position")) positionHit = positionHit || Boolean(loc[k]);
              if (lk.includes("rotation")) rotationHit = rotationHit || Boolean(loc[k]);
            }
          }
        }

        // If it's a position attempt
        if (positionHit || (!positionHit && !rotationHit && String(attainedLocationRaw).toLowerCase().includes("position"))) {
          phaseResults.controlPanel.positionAttempts += 1;
          // completed: prefer explicit success or presence of end_time
          if (cycleSucceeded(cycle)) {
            // According to you it shouldn't get done more than once per match - so store as 0/1
            phaseResults.controlPanel.positionCompleted = Math.min(1, phaseResults.controlPanel.positionCompleted + 1);
            // record time if we have both start and end
            if (startTime !== null && endTime !== null && endTime >= startTime && cycleTime !== null) {
              controlPanelTimes[phase].position.push(cycleTime);
            }
          }
        }

        // rotation attempt
        if (rotationHit || (!positionHit && !rotationHit && String(attainedLocationRaw).toLowerCase().includes("rotation"))) {
          phaseResults.controlPanel.rotationAttempts += 1;
          if (cycleSucceeded(cycle)) {
            phaseResults.controlPanel.rotationCompleted = Math.min(1, phaseResults.controlPanel.rotationCompleted + 1);
            if (startTime !== null && endTime !== null && endTime >= startTime && cycleTime !== null) {
              controlPanelTimes[phase].rotation.push(cycleTime);
            }
          }
        }

        break;
      }

      case "HANG": {
        phaseResults.hang.attempts += 1;
        if (cycle.start_time !== undefined && phaseResults.hang.startTime === null) {
          phaseResults.hang.startTime = cycle.start_time;
        }
        if (cycleTime !== null) {
          phaseResults.hang.cycleTime = cycleTime; // last recorded cycleTime
        }

        // result: FAIL_HANG, HANG, BALANCED, etc.
        const result = cycle.result ? String(cycle.result).toUpperCase() : null;
        if (result === "HANG" || result === "BALANCED") {
          // per your note: hang and balanced count as successful
          phaseResults.hang.successfulCount += 1;
        } else if (result === "FAIL_HANG") {
          phaseResults.hang.failCount += 1;
        } else if (result === "BALANCED"){
          phaseResults.hang.balancedCount += 1
        }
        break;
      }

      case "DEFENSE": {
        if (cycle.cycle_time !== null && cycle.cycle_time !== undefined) {
          phaseResults.defense.totalTime += Number(cycle.cycle_time);
        }
        break;
      }

      case "CONTACT": {
        if (cycle.cycle_time !== null && cycle.cycle_time !== undefined) {
          phaseResults.contact.totalTime += Number(cycle.cycle_time);
        }
        phaseResults.contact.pinCount += cycle.pin_count !== null && cycle.pin_count !== undefined ? Number(cycle.pin_count) : 0;
        phaseResults.contact.foulCount += cycle.foul_count !== null && cycle.foul_count !== undefined ? Number(cycle.foul_count) : 0;
        break;
      }

      default:
        break;
    }
  });

  // Derived metrics per phase
  for (const phase of ["auto", "tele"]) {
    const p = results[phase];

    // movementRate: successfulEnds / attempts (guard divide-by-zero)
    if (p.movement.attempts > 0) {
      p.movement.movementRate = p.movement.successfulEnds / p.movement.attempts;
    } else {
      p.movement.movementRate = 0;
    }

    // powerCell avg scoring cycle time
    if (powerCellScoringTimes[phase].length > 0) {
      const tot = powerCellScoringTimes[phase].reduce((acc, cur) => acc + cur, 0);
      p.powerCell.avgScoringCycleTime = tot / powerCellScoringTimes[phase].length;
    } else {
      p.powerCell.avgScoringCycleTime = null;
    }

    // powerCell high/low accuracy
    const highDenom = p.powerCell.highScoreCount + p.powerCell.highMissCount;
    p.powerCell.highAccuracy = highDenom > 0 ? p.powerCell.highScoreCount / highDenom : 0;
    const lowDenom = p.powerCell.lowScoreCount + p.powerCell.lowMissCount;
    p.powerCell.lowAccuracy = lowDenom > 0 ? p.powerCell.lowScoreCount / lowDenom : 0;

    // control panel average times
    const posTimes = controlPanelTimes[phase].position;
    const rotTimes = controlPanelTimes[phase].rotation;
    if (posTimes.length > 0) {
      p.controlPanel.positionAvgTime = posTimes.reduce((a, b) => a + b, 0) / posTimes.length;
    } else {
      p.controlPanel.positionAvgTime = null;
    }
    if (rotTimes.length > 0) {
      p.controlPanel.rotationAvgTime = rotTimes.reduce((a, b) => a + b, 0) / rotTimes.length;
    } else {
      p.controlPanel.rotationAvgTime = null;
    }

    // percent done (per-match, so either 0 or 1)
    p.controlPanel.percentPositionDone = p.controlPanel.positionCompleted > 0 ? 1 : 0;
    p.controlPanel.percentRotationDone = p.controlPanel.rotationCompleted > 0 ? 1 : 0;

    // hang success rate (successfulCount / attempts)
    if (p.hang.attempts > 0) {
      p.hang.hangSuccessRate = p.hang.successfulCount / p.hang.attempts;
    } else {
      p.hang.hangSuccessRate = 0;
    }
  }

  return results;
};

// ---------- Average metrics helper (keeps similar shape to your original but generic) ----------
export const calculateAverageMetrics = (reports) => {
  if (!Array.isArray(reports) || reports.length === 0) return {};

  const averageMetrics = {
    disabled: null,
    auto: {},
    tele: {},
  };

  // disabled: average over numeric values
  let disabledSum = 0;
  let disabledCount = 0;
  reports.forEach((r) => {
    if (r.totals && typeof r.totals.disabled === "number") {
      disabledSum += r.totals.disabled;
      disabledCount++;
    }
  });
  averageMetrics.disabled = disabledCount > 0 ? disabledSum / disabledCount : null;

  // helper to average numeric fields for phases
  const accumulatePhase = (phase) => {
    // take keys from first report's totals if present
    const structure = {};
    const firstTotals = reports[0].totals && reports[0].totals[phase] ? reports[0].totals[phase] : {};
    for (const category of Object.keys(firstTotals)) {
      structure[category] = {};
      for (const key of Object.keys(firstTotals[category])) {
        // accumulate sum & count
        let sum = 0;
        let count = 0;
        reports.forEach((r) => {
          if (r.totals && r.totals[phase] && typeof r.totals[phase][category] !== "undefined") {
            const val = r.totals[phase][category][key];
            if (typeof val === "number") {
              sum += val;
              count++;
            }
          }
        });
        // store [avgAcrossAllReports, avgAcrossValidReports]
        structure[category][key] = count > 0 ? [sum / reports.length, sum / count] : null;
      }
    }
    return structure;
  };

  averageMetrics.auto = accumulatePhase("auto");
  averageMetrics.tele = accumulatePhase("tele");

  return averageMetrics;
};
