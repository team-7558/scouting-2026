export const calculateReportTotals = (report) => {
  const DEFAULT_PHASE_STRUCTURE = {
    coral: {
      attainedCount: 0,
      scoredCount: 0,
      droppedCount: 0,
      avgScoringCycleTime: null,
      scoringRate: null,
    },
    algae: {
      attainedCount: 0,
      scoredCount: 0,
      droppedCount: 0,
      avgScoringCycleTime: null,
      scoringRate: null,
    },
  };
  // Initialize result structure
  const results = {
    auto: {
      movement: {
        movementTime: 0,
        movementRate: 0,
      },
      ...DEFAULT_PHASE_STRUCTURE,
    },
    tele: {
      ...DEFAULT_PHASE_STRUCTURE,
      hang: {
        startTime: null,
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

  // Arrays to store cycle times for scoring (for averaging)
  const coralScoringTimes = [];
  const algaeScoringTimes = [];

  // Process each cycle using a switch statement
  report.cycles.forEach((cycle) => {
    const cycleType = cycle.type;
    const phase = cycle.phase;
    const startTime =
      cycle.attained_location == "PRELOAD" ? 0 : cycle.start_time;
    const endTime = cycle.end_time;
    const cycleTime = cycle.cycle_time;
    const depositType = cycle.deposit_type;
    const attainedLocation = cycle.attained_location;

    const phaseResults = results[phase];
    switch (cycleType) {
      case "AUTO_MOVEMENT":
        if (phase == "auto") {
          phaseResults.movement.movementTime = cycleTime;
          phaseResults.movement.movementRate = 1;
        }
        break;
      case "CORAL":
        if (attainedLocation !== null && startTime !== null) {
          phaseResults.coral.attainedCount++;
        }
        if (depositType === "SCORE" && endTime !== null) {
          phaseResults.coral.scoredCount++;
          coralScoringTimes.push(cycleTime);
        }
        break;

      case "ALGAE":
        if (attainedLocation !== null && startTime !== null) {
          phaseResults.algae.attainedCount++;
        }
        if (depositType === "SCORE" && endTime !== null) {
          phaseResults.algae.scoredCount++;
          algaeScoringTimes.push(cycleTime);
        }
        break;

      case "HANG":
        phaseResults.hang.startTime = cycle.start_time;
        phaseResults.hang.cycleTime = cycleTime;
        break;

      case "DEFENSE":
        if (cycleTime !== null) {
          phaseResults.defense.totalTime += cycleTime;
        }
        break;

      case "CONTACT":
        if (cycleTime !== null) {
          phaseResults.contact.totalTime += cycleTime;
        }

        phaseResults.contact.pinCount +=
          cycle.pin_count !== null ? cycle.pin_count : 0;
        phaseResults.contact.foulCount +=
          cycle.foul_count !== null ? cycle.foul_count : 0;
        break;

      default:
        // Do nothing for unknown cycle types.
        break;
      // }
    }
  });

  for (let phase of ["auto", "tele"]) {
    const phaseResults = results[phase];
    // Compute derived metrics for Coral
    phaseResults.coral.droppedCount =
      phaseResults.coral.attainedCount - phaseResults.coral.scoredCount;
    if (coralScoringTimes.length > 0) {
      const totalCoralTime = coralScoringTimes.reduce(
        (acc, cur) => acc + cur,
        0
      );
      phaseResults.coral.avgScoringCycleTime =
        totalCoralTime / coralScoringTimes.length;
    }
    if (phaseResults.coral.scoredCount > 0) {
      phaseResults.coral.scoringRate =
        phaseResults.coral.attainedCount / phaseResults.coral.scoredCount;
    }

    // Compute derived metrics for Algae
    phaseResults.algae.droppedCount =
      phaseResults.algae.attainedCount - phaseResults.algae.scoredCount;
    if (algaeScoringTimes.length > 0) {
      const totalAlgaeTime = algaeScoringTimes.reduce(
        (acc, cur) => acc + cur,
        0
      );
      phaseResults.algae.avgScoringCycleTime =
        totalAlgaeTime / algaeScoringTimes.length;
    }
    if (phaseResults.algae.scoredCount > 0) {
      phaseResults.algae.scoringRate =
        phaseResults.algae.attainedCount / phaseResults.algae.scoredCount;
    }
  }

  return results;
};

export const calculateAverageMetrics = (reports) => {
  //   console.log(reports[0]);
  // Return an empty object if no report metrics provided
  if (!reports.length) return {};

  const averageMetrics = { auto: {}, tele: {} };
  for (let phase of ["auto", "tele"]) {
    // Build the averageMetrics object dynamically based on keys from the first report
    // Loop over each category (e.g., coral, algae, hang, defense, contact)
    Object.keys(reports[0].totals[phase]).forEach((category) => {
      averageMetrics[phase][category] = {};

      // Get all keys for this category from the first report
      Object.keys(reports[0].totals[phase][category]).forEach((key) => {
        let sum = 0;
        let count = 0;

        // Loop over each report and accumulate the value if it is a number
        reports.forEach((report) => {
          const value =
            report.totals[phase][category] &&
            report.totals[phase][category][key];
          if (typeof value === "number") {
            sum += value;
            count++;
          }
        });

        // Store both calculations in an array:
        // [0]: Sum divided by the total number of reports
        // [1]: Sum divided by the number of valid values (count)
        averageMetrics[phase][category][key] =
          count > 0 ? [sum / reports.length, sum / count] : null;
      });
    });
  }
  return averageMetrics;
};
