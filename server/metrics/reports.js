export const calculateReportTotals = (report) => {
  // Initialize result structure
  const results = {
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
  };

  // Arrays to store cycle times for scoring (for averaging)
  const coralScoringTimes = [];
  const algaeScoringTimes = [];

  // Process each cycle using a switch statement
  report.cycles.forEach((cycle) => {
    const cycleType = cycle.type;
    const startTime =
      cycle.attained_location == "PRELOAD" ? 0 : cycle.start_time;
    const endTime = cycle.end_time;
    const cycleTime = cycle.cycle_time;
    const depositType = cycle.deposit_type;
    const attainedLocation = cycle.attained_location;

    switch (cycleType) {
      case "CORAL":
        if (attainedLocation !== null && startTime !== null) {
          results.coral.attainedCount++;
        }
        if (depositType === "SCORE" && endTime !== null) {
          results.coral.scoredCount++;
          coralScoringTimes.push(cycleTime);
        }
        break;

      case "ALGAE":
        if (attainedLocation !== null && startTime !== null) {
          results.algae.attainedCount++;
        }
        if (depositType === "SCORE" && endTime !== null) {
          results.algae.scoredCount++;
          algaeScoringTimes.push(cycleTime);
        }
        break;

      case "HANG":
        results.hang.startTime = cycle.start_time;
        results.hang.cycleTime = cycleTime;
        break;

      case "DEFENSE":
        if (cycleTime !== null) {
          results.defense.totalTime += cycleTime;
        }
        break;

      case "CONTACT":
        if (cycleTime !== null) {
          results.contact.totalTime += cycleTime;
        }

        results.contact.pinCount +=
          cycle.pin_count !== null ? cycle.pin_count : 0;
        results.contact.foulCount +=
          cycle.foul_count !== null ? cycle.foul_count : 0;
        break;

      default:
        // Do nothing for unknown cycle types.
        break;
    }
  });

  // Compute derived metrics for Coral
  results.coral.droppedCount =
    results.coral.attainedCount - results.coral.scoredCount;
  if (coralScoringTimes.length > 0) {
    const totalCoralTime = coralScoringTimes.reduce((acc, cur) => acc + cur, 0);
    results.coral.avgScoringCycleTime =
      totalCoralTime / coralScoringTimes.length;
  }
  if (results.coral.scoredCount > 0) {
    results.coral.scoringRate =
      results.coral.attainedCount / results.coral.scoredCount;
  }

  // Compute derived metrics for Algae
  results.algae.droppedCount =
    results.algae.attainedCount - results.algae.scoredCount;
  if (algaeScoringTimes.length > 0) {
    const totalAlgaeTime = algaeScoringTimes.reduce((acc, cur) => acc + cur, 0);
    results.algae.avgScoringCycleTime =
      totalAlgaeTime / algaeScoringTimes.length;
  }
  if (results.algae.scoredCount > 0) {
    results.algae.scoringRate =
      results.algae.attainedCount / results.algae.scoredCount;
  }

  return results;
};

export const calculateAverageMetrics = (reports) => {
  //   console.log(reports[0]);
  // Return an empty object if no report metrics provided
  if (!reports.length) return {};

  // Build the averageMetrics object dynamically based on keys from the first report
  const averageMetrics = {};
  // Loop over each category (e.g., coral, algae, hang, defense, contact)
  Object.keys(reports[0].totals).forEach((category) => {
    averageMetrics[category] = {};

    // Get all keys for this category from the first report
    Object.keys(reports[0].totals[category]).forEach((key) => {
      let sum = 0;
      let count = 0;

      // Loop over each report and accumulate the value if it is a number
      reports.forEach((report) => {
        const value = report.totals[category] && report.totals[category][key];
        if (typeof value === "number") {
          sum += value;
          count++;
        }
      });

      // Store both calculations in an array:
      // [0]: Sum divided by the total number of reports
      // [1]: Sum divided by the number of valid values (count)
      averageMetrics[category][key] =
        count > 0 ? [sum / reports.length, sum / count] : null;
    });
  });

  return averageMetrics;
};
