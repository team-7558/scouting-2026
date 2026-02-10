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
    fuel: {
      attainedCount: 0,
      shotCount: 0,
    },
  };

  // Initialize results
  const results = {
    disabled: 0,
    // keep same post-match fields (if present on report object)
    driverSkill: report.driverSkill ?? "N/A",
    defenseSkill: report.defenseSkill ?? "N/A",
    auto: {
      ...structuredClone(DEFAULT_PHASE_STRUCTURE),
      movement: {
        bumps: 0,
        trenches: 0,
        movements: 0,
      },
      hang: {
        attempts: 0,
        lOneRate: 0,
        cycleTime: null,
      },
    },
    tele: {
      ...structuredClone(DEFAULT_PHASE_STRUCTURE),
      hang: {
        attempts: 0,
        lOneRate: 0,
        lTwoRate: 0,
        lThreeRate: 0,
        avgHangPoints: 0,
        cycleTime: null,
      },
      defense: {
        totalTime: 0,
      },
      contact: {
        totalTime: 0,
        foulCount: 0,
        pinCount: 0,
      },
    },
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
    const location = cycle.location !== undefined ? cycle.location : null;
    const cycleTime = endTime - startTime;;
    const attainedLocationRaw = cycle.attained_location !== undefined ? cycle.attained_location : null;
    const attainedLocation = parseAttainedLocation(attainedLocationRaw);

    switch (cycleType) {
      case "AUTO_MOVEMENT": {
        if (location === "BUMP") {
          phaseResults.movement.bumps += 1;
        } else if (location === "TRENCH") {
          phaseResults.movement.trenches += 1;
        } else {
          phaseResults.movement.movementTime = endTime;
        }
        break;
      }

      case "SHOOT":
      case "SNOWBALL":
      case "INTAKE": {
        // Calculate count using rate * duration if available
        let count = 1;
        const rate = cycle.rate || 0;

        // If rate is provided (items/sec) and we have a duration, calculate total items
        if (rate > 0 && startTime !== null && endTime !== null) {
          const duration = endTime - startTime;
          count = Math.max(1, Math.round((rate * duration) / 1000));
        }

        // Intake -> Attained
        if (cycleType === "INTAKE") {
          phaseResults.fuel.attainedCount += count;
        }
        // Shoot -> Shot (Score)
        else if (cycleType === "SHOOT") {
          phaseResults.fuel.shotCount += count;
        }
        // Snowball -> Feed
        else if (cycleType === "SNOWBALL") {
          phaseResults.fuel.attainedCount += count;
          phaseResults.fuel.shotCount += count;
        }

        break;
      }

      case "HANG": {
        phaseResults.hang.attempts += 1;
        if (cycleTime !== null) {
          phaseResults.hang.cycleTime = cycleTime;
        }

        // Normalize location
        const loc = (cycle.location ? String(cycle.location) : "").toUpperCase();

        // Check levels
        if (loc.includes("LEVEL_1")) {
          phaseResults.hang.lOneRate += 1;
        } else if (loc.includes("LEVEL_2")) {
          phaseResults.hang.lTwoRate += 1;
        } else if (loc.includes("LEVEL_3")) {
          phaseResults.hang.lThreeRate += 1;
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

  // disabled: average over numeric values, excluding zeros
  let disabledSum = 0;
  reports.forEach((r) => {
    // MODIFIED: Added '&& r.totals.disabled !== 0' to ignore zero values
    if (r.totals && typeof r.totals.disabled === "number" && r.totals.disabled !== 0) {
      console.log("disabled", r.totals.disabled);
      disabledSum += { No: 0, Yes: 1, Partially: 0.5 }[r.totals.disabled];
    }
    console.log("report", r);
  });
  averageMetrics.disabled = disabledSum / reports.length;

  // helper to average numeric fields for phases
  const accumulatePhase = (phase) => {
    // take keys from first report's totals if present
    const structure = {};
    const firstTotals = reports[0].totals && reports[0].totals[phase] ? reports[0].totals[phase] : {};
    console.log("firstTotals", firstTotals);
    for (const category of Object.keys(firstTotals)) {
      structure[category] = {};
      for (const key of Object.keys(firstTotals[category])) {
        // accumulate sum & count
        let sum = 0;
        let count = 0;
        reports.forEach((r) => {
          if (r.totals && r.totals[phase] && typeof r.totals[phase][category] !== "undefined") {
            const val = r.totals[phase][category][key];
            // MODIFIED: Added '&& val !== 0' to ignore zero values
            if (typeof val === "number" && val !== 0) {
              sum += val;
              count++;
            }
          }
        });
        // store [avgAcrossAllReports, avgAcrossValidReports]
        structure[category][key] = count > 0 ? [sum / reports.length, sum / count] : null;
      }
    }
    console.log("structure", structure);
    return structure;
  };

  averageMetrics.auto = accumulatePhase("auto");
  averageMetrics.tele = accumulatePhase("tele");

  return averageMetrics;
};