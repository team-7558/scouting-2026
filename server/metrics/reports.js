// calculateReportTotals.js

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
      shootingTime: 0,
      feedingTime: 0,
      feedCount: 0,
    },
    movement: {
      bumps: 0,
      trenches: 0,
      movements: 0,
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
    const cycleTime = endTime - startTime; 
    const attainedLocationRaw = cycle.attained_location !== undefined ? cycle.attained_location : null;
    const attainedLocation = parseAttainedLocation(attainedLocationRaw);

    // Extract the raw count from the frontend
    let count = cycle.count !== undefined && cycle.count !== null ? Number(cycle.count) : 0;

    switch (cycleType) {
      case "AUTO_MOVEMENT": {
        const normalizedLocation = String(location).trim().toUpperCase();

        // Use .includes to catch ALL_BUMP, OPP_BUMP, ALL_TRENCH, etc.
        if (normalizedLocation.includes("BUMP")) {
          phaseResults.movement.bumps += 1;
        } else if (normalizedLocation.includes("TRENCH")) {
          phaseResults.movement.trenches += 1;
        } else {
          phaseResults.movement.movements += 1;
        }
        break;
      }

      case "SHOOT":
      case "SHOOTING": 
      case "BYPASS":
      case "FEED": {
        const rate = cycle.rate || 0;

        // Fallback -> If count isn't provided but rate (items/sec) and duration exist, estimate total items
        if (count === 0 && rate > 0 && cycleTime > 0) {
          count = Math.round(rate * (cycleTime / 1000));
        }

        // Shoot -> Shot (Score)
        if (cycleType === "SHOOT" || cycleType === "SHOOTING") {
          phaseResults.fuel.shootingTime += cycleTime;
        }
        // Bypass -> Feed
        else if (cycleType === "BYPASS" || cycleType === "FEED") {
          phaseResults.fuel.feedingTime += cycleTime;
          phaseResults.fuel.feedCount += count;
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
        // Fallback to locally calculated cycleTime if DB field is missing
        const duration = cycle.cycle_time !== undefined && cycle.cycle_time !== null 
          ? Number(cycle.cycle_time) 
          : cycleTime;

        if (duration > 0) {
          phaseResults.defense.totalTime += duration;
        }
        break;
      }

      case "CONTACT": {
        // Fallback to locally calculated cycleTime if DB field is missing
        const duration = cycle.cycle_time !== undefined && cycle.cycle_time !== null 
          ? Number(cycle.cycle_time) 
          : cycleTime;

        if (duration > 0) {
          phaseResults.contact.totalTime += duration;
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

// ---------- Average metrics helper ----------
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
    if (r.totals && typeof r.totals.disabled === "number" && r.totals.disabled !== 0) {
      disabledSum += { No: 0, Yes: 1, Partially: 0.5 }[r.totals.disabled];
    }
  });
  averageMetrics.disabled = disabledSum / reports.length;

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
    return structure;
  };

  averageMetrics.auto = accumulatePhase("auto");
  averageMetrics.tele = accumulatePhase("tele");

  return averageMetrics;
};