export const accentColor = "#ff0000";

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
        //average snowballing and shooting speed
        avgSnowballSpeed: (submetric) => {
            console.trace("calculated metric: avg snowball speed. Given: ", submetric)
            const result = getValue(submetric.snowballRateSum) / getValue(submetric.numSnowballCycles);

            return Number.isFinite(result) ? result.toFixed(1) : "-";
        },
        avgShotSpeed: (submetric) => {
            console.trace("calculated metric: avg shot speed. Given: ", submetric)
            const result = getValue(submetric.shotRateSum) / getValue(submetric.numShotCycles);

            return Number.isFinite(result) ? result.toFixed(1) : "-";
        }
    }
};

//what metrics are shown in summaries
export const importantMetrics = {
    auto: {
        fuel: ["shootingTime", "snowballingTime", "avgShotSpeed", "avgSnowballSpeed", "attainedCount", "shotCount",],
        hang: ["attempts", "cycleTime", "lOneRate"],
        movement: ["bumps", "movements", "trenches"],
        contact: ["foulCount", "pinCount", "totalTime"],
        defense: ["totalTime"],
    },
    tele: {
        fuel: ["shootingTime", "snowballingTime", "avgShotSpeed", "avgSnowballSpeed", "shotCount",],
        hang: ["attempts", "cycleTime", "lOneRate", "lTwoRate", "lThreeRate"],
        movement: ["bumps", "trenches"],
        contact: ["foulCount", "pinCount", "totalTime"],
        defense: ["totalTime"],
    }
};

//what metrics are visible (for individual reports)
export const visibleMetrics = {
    auto: {
        fuel: ["shootingTime", "snowballingTime", "intakingTime", "avgShotSpeed", "avgSnowballSpeed", "shotCount", "numShotCycles", "numSnowballCycles"],
        hang: ["attempts", "cycleTime", "avgHangPoints", "lOneRate"],
        movement: ["bumps", "movements", "trenches"],
    },
    tele: {
        fuel: ["shootingTime", "snowballingTime", "intakingTime", "avgShotSpeed", "avgSnowballSpeed", "shotCount", "numShotCycles", "numSnowballCycles"],
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
