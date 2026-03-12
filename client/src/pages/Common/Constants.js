export const COMPRESS_DATA_MAP = {
    //very common
    type: "t",
    startTime: "s",
    location: "l",
    phase: "p",
    tele: "te",
    auto: "a",
    endTime: "e",
    rate: "r",

    //common
    success: "s",
    TRENCH: "tr",
    BUMP: "bu",
    BYPASS: "sb",
    ALLIANCE_ZONE: "az",
    INTAKE: "in",
    HANG: "ha",
    LEVEL_1: "L1",
    LEVEL_2: "L2",
    LEVEL_3: "L3",
    SHOOT: "sh",
    CLOSE: "cl",
    FAR: "fa",
    NEUTRAL_ZONE: "nz",
    OPPONENT_ALLIANCE_ZONE: "oaz",
    CONTACT: "con",
    AUTO_MOVEMENT: "am",
    reportId: "rid",

    //one-time
    eventKey: "ek",
    matchKey: "mk",
    station: "s",
    matchData: "md",
    matchStartTime: "mst",
    robot: "rob",
    cycles: "c",
    reportId: "rid",
    endgame: "eg",
    disabled: "d",
    driverSkill: "ds",
    defenseSkill: "des",
    roles: "rol",
    Defense: "de",
    Steal: "st",
    Feed: "fe",
    Cycle: "cy",
    comments: "com",
    shotRate: "sr",
    bypassRate: "sbr",
    accuracy: "ac",

};

export const DECOMPRESS_DATA_MAP = {};
for (const key in COMPRESS_DATA_MAP) {
    const value = COMPRESS_DATA_MAP[key];
    DECOMPRESS_DATA_MAP[value] = key;
}

export const compressData = (data) => {
    if (Array.isArray(data)) {
        data.forEach(compressData); 
        return;
    }

    if (typeof data !== 'object' || data === null) {
        return ;
    }

    Object.keys(data).forEach(key => {
        const val = data[key];

        if (typeof val === 'object') {
            compressData(val);
        }

        if (COMPRESS_DATA_MAP[val]) {
            data[key] = COMPRESS_DATA_MAP[val];
        }

        if (COMPRESS_DATA_MAP[key]) {
            data[COMPRESS_DATA_MAP[key]] = data[key];
            delete data[key];
        }
    });
};

export const decompressData = (data) => {
    if (Array.isArray(data)) {
        data.forEach(decompressData);
        return;
    }

    if (typeof data !== 'object' || data === null) {
        return; 
    }

    Object.keys(data).forEach(key => {
        const val = data[key];
        if (typeof val === 'object') {
            decompressData(val);
        }

        if (DECOMPRESS_DATA_MAP[val]) {
            data[key] = DECOMPRESS_DATA_MAP[val];
        }
      
        if (DECOMPRESS_DATA_MAP[key]) {
            data[DECOMPRESS_DATA_MAP[key]] = data[key];
            delete data[key];
        }
    });
};