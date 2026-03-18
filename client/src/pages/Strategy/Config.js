export const accentColor = "#ffffff";

export const blueTeamColor = "#3ad5fc";
export const redTeamColor = "#fa1919";

// ================================
// CONFIG: group colors, calculated metrics, important metrics
// ================================
//what color each group is (fuel, hang, etc)
export const GROUP_COLORS = {
    fuel: "#fcec4e",
    hang: "#e06bfa",
    defense: "#FCA311",
    contact: "#FCA311",
    movement: "#00B4D8"
};

//metrics that are specially calculated
export const calculatedMetrics = {
    fuel: {
        // 1. Create new "private" calculation functions
        shotCount: (averages, phase) => {
            const fuelMetrics = averages[phase].fuel;

            const result = (getValue(fuelMetrics.shootingTime) / 1000) * averages.avgShotRate;
            console.log("resabcd", result);
            return Number.isFinite(result) ? result.toFixed(0) : "-"; // Return 0 on failure
        },
    }
};

//what metrics are shown in summaries
export const importantMetrics = {
    auto: {
        fuel: ["shotCount", "shootingTime", "bypassingTime"],
        hang: ["attempts", "cycleTime", "lOneRate"],
        movement: ["bumps", "movements", "trenches"],
        contact: ["foulCount", "pinCount", "totalTime"],
        defense: ["totalTime"],
    },
    tele: {
        fuel: ["shotCount", "shootingTime", "bypassingTime"],
        hang: ["attempts", "cycleTime", "lOneRate", "lTwoRate", "lThreeRate"],
        movement: ["bumps", "trenches"],
        contact: ["foulCount", "pinCount", "totalTime"],
        defense: ["totalTime"],
    }
};

//what metrics are visible (for individual reports)
export const visibleMetrics = {
    auto: {
        fuel: ["shotCount", "shootingTime", "bypassingTime", "intakingTime", ],
        hang: ["attempts", "cycleTime", "avgHangPoints", "lOneRate"],
        movement: ["bumps", "trenches"],
    },
    tele: {
        fuel: ["shotCount", "shootingTime", "bypassingTime", "intakingTime"],
        hang: ["attempts", "cycleTime", "lOneRate", "lTwoRate", "lThreeRate"],
        contact: ["foulCount", "pinCount", "totalTime"],
        movement: ["bumps", "trenches"],
        defense: ["totalTime"],
    }
};


// ================================
// UTILS
// ================================

const getValue = (value) => {
    if (value === null || value === undefined) return null;
    const v = Array.isArray(value) ? value[0] : value;
    return v;
}
