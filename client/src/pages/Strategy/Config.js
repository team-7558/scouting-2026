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
        //average bypassing and shooting speed
        avgBypassSpeed: (submetric) => {
            console.trace("calculated metric: avg bypass speed. Given: ", submetric)
            const result = getValue(submetric.bypassRateSum) / getValue(submetric.numBypassCycles);

            return Number.isFinite(result) ? result.toFixed(1) : "-";
        },
        avgShotSpeed: (submetric) => {
            console.trace("calculated metric: avg shot speed. Given: ", submetric)
            const result = getValue(submetric.shotRateSum) / getValue(submetric.numShotCycles);

            return Number.isFinite(result) ? result.toFixed(1) : "-";
        },

        shotCount: (submetric) => {
            const avgBypassSpeed = calculatedMetrics.fuel.avgBypassSpeed(submetric);
            const avgShotSpeed = calculatedMetrics.fuel.avgShotSpeed(submetric);

            console.trace("calculated metric: shot count. Given: ", submetric);

            const result = ((getValue(submetric.shootingTime) / 1000) * avgShotSpeed) + 
                ((getValue(submetric.bypassingTime) / 1000) * avgBypassSpeed);
            console.log("shot count", submetric.numShotCycles, result);
            
            return Number.isFinite(result) ? result.toFixed(1) : "-"
        }
    }
};

//what metrics are shown in summaries
export const importantMetrics = {
    auto: {
        fuel: ["shootingTime", "bypassingTime", "avgShotSpeed", "avgBypassSpeed", "shotCount"],
        hang: ["attempts", "cycleTime", "lOneRate"],
        movement: ["bumps", "movements", "trenches"],
        contact: ["foulCount", "pinCount", "totalTime"],
        defense: ["totalTime"],
    },
    tele: {
        fuel: ["shootingTime", "bypassingTime", "avgShotSpeed", "avgBypassSpeed",  "shotCount"],
        hang: ["attempts", "cycleTime", "lOneRate", "lTwoRate", "lThreeRate"],
        movement: ["bumps", "trenches"],
        contact: ["foulCount", "pinCount", "totalTime"],
        defense: ["totalTime"],
    }
};

//what metrics are visible (for individual reports)
export const visibleMetrics = {
    auto: {
        fuel: ["shootingTime", "bypassingTime", "intakingTime", "avgShotSpeed", "avgBypassSpeed", "accuracy", "shotCount"],
        hang: ["attempts", "cycleTime", "avgHangPoints", "lOneRate"],
        movement: ["bumps", "trenches"],
    },
    tele: {
        fuel: ["shootingTime", "bypassingTime", "intakingTime", "avgShotSpeed", "avgBypassSpeed", "accuracy", "shotCount"],
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
