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
        _calculateAvgSpeed: (rateSum, numCycles) => {
            const result = getValue(rateSum) / getValue(numCycles);
            return Number.isFinite(result) ? result : 0; // Return 0 on failure
        },

        // 2. Update existing functions to use the calculator and then format the output
        avgBypassSpeed: (submetric) => {
            const result = calculatedMetrics.fuel._calculateAvgSpeed(submetric.bypassRateSum, submetric.numBypassCycles);
            // If the raw result is 0 because of a failed calculation (e.g., 0/0), display "-"
            // You might want to check the inputs as well to be more robust
            if (result === 0 && getValue(submetric.numBypassCycles) === 0) return "-";
            return result.toFixed(1);
        },
        avgShotSpeed: (submetric) => {
            const result = calculatedMetrics.fuel._calculateAvgSpeed(submetric.shotRateSum, submetric.numShotCycles);
            if (result === 0 && getValue(submetric.numShotCycles) === 0) return "-";
            return result.toFixed(1);
        },

        // 3. Update shotCount to use the new calculator functions directly
        shotCount: (submetric) => {
            // These now return pure numbers (e.g., 0 or 12.3)
            const avgBypassSpeed = calculatedMetrics.fuel._calculateAvgSpeed(submetric.bypassRateSum, submetric.numBypassCycles);
            const avgShotSpeed = calculatedMetrics.fuel._calculateAvgSpeed(submetric.shotRateSum, submetric.numShotCycles);

            console.trace("calculated metric: shot count. Given: ", submetric);

            // The calculation is now safe and will not result in NaN
            const result = ((getValue(submetric.shootingTime) / 1000) * avgShotSpeed) + 
                           ((getValue(submetric.bypassingTime) / 1000) * avgBypassSpeed);
            
            console.log("shot count", submetric.numShotCycles, result);
            
            return Number.isFinite(result) && result!=0 ? result.toFixed(1) : "-"
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
