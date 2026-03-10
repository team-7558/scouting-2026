import LZString from "lz-string";
import { ATTENDING_EVENTS, CYCLE_TYPES, ENDGAME_ROLES, GAME_LOCATIONS, HANG_LEVELS, PHASES, PRACTICE_EVENTS } from "../pages/ScoutMatch/Constants";

export const DTO_MAPS = {
  eventKey: ["NONE", ...ATTENDING_EVENTS, ...PRACTICE_EVENTS],
  station: ["NONE", "r1", "r2", "r3", "b1", "b2", "b3"],
  // perspectives: ["NONE", "near", "far"],
  accuracy: ["NONE", "Low", "Med", "High", "Perfect"],
  hangLevels: ["NONE", ...Object.keys(HANG_LEVELS)], // ["NONE", "LEVEL_1", "LEVEL_2", "LEVEL_3"] <- remove later
  cycleTypes: ["NONE", ...Object.keys(CYCLE_TYPES)],
  locations: ["NONE", ...Object.keys(GAME_LOCATIONS), "CLOSE", "FAR", "BUMP", "TRENCH", ...Object.keys(HANG_LEVELS), 1, 2, 3, 4, 5, 6, 7],
  phases: ["NONE", ...Object.keys(PHASES)],
  roles: ["NONE", ...Object.keys(ENDGAME_ROLES)],
  rates: [0, 1, 3, 6, 9], // Mapping BPS_RANGES values to simple indices
  disabled: ["No", "Yes"],
  matchTypes: ["qm", "sf", "f", "p"]
};

export const MATCH_SCHEMA = [
  { key: "schemaVersion", type: "uint8" },
  { key: "isCompressed", type: "bool" },
  { key: "eventKey", type: "uint8", map: DTO_MAPS.eventKey },
  { key: "matchType", type: "uint8", map: DTO_MAPS.matchTypes },
  { key: "matchNumber", type: "uint16" },
  { key: "station", type: "uint8", map: DTO_MAPS.station },
  { key: "robot", type: "uint16" },
  //{ key: "perspective", type: "uint8", map: DTO_MAPS.perspectives },

  // Endgame
  { key: "disabled", type: "uint8", map: DTO_MAPS.disabled },
  { key: "driverSkill", type: "uint8" },
  { key: "defenseSkill", type: "uint8" },
  { key: "accuracy", type: "uint8", map: DTO_MAPS.accuracy },
  { key: "shotRate", type: "uint8", map: DTO_MAPS.rates },
  { key: "snowballRate", type: "uint8", map: DTO_MAPS.rates },
  { key: "roles", type: "string" },

  {
    key: "cycles",
    type: "array",
    itemSchema: [
      { key: "type", type: "uint8", map: DTO_MAPS.cycleTypes },
      { key: "phase", type: "uint8", map: DTO_MAPS.phases },
      { key: "startTime", type: "uint16" },
      { key: "duration", type: "uint16" },
      { key: "location", type: "uint8", map: DTO_MAPS.locations },
      { key: "pinCount", type: "uint8" },   // Separate for Contact
      { key: "foulCount", type: "uint8" },  // Separate for Contact
      { key: "success", type: "bool" }
    ]
  },
  { key: "comments", type: "string" }
];

export const prepareMatchForDTO = (matchState) => {
  const fullKey = matchState.searchParams.get("matchKey") || "qm0";
  const matchParts = fullKey.match(/([a-z]+)(\d+)/i) || ["qm0", "qm", "0"];

  // Note: matchState.state is where the "Spaghetti" lives
  const s = matchState.state;
  console.log("matchState", matchState);

  let isCompressed = false;
  const encoder = new TextEncoder();
  const raw = s.endgame?.comments || "";
  const rawBytes = encoder.encode(raw);
  let comments = rawBytes;
  const compressed = LZString.compressToUint8Array(raw);
  // is greater than 0, less than 255, and less than the original
  if (compressed.length > 0 && compressed.length < 255 && compressed.length < rawBytes.length) {
    comments = compressed;
    isCompressed = true;
  }
  if (comments.length > 255) {
    comments = comments.slice(0, 255);
    window.alert("Comment was too long and was sliced for export")
  }
  comments = String.fromCharCode(...comments);

  return {
    schemaVersion: 1,
    isCompressed: isCompressed,
    eventKey: matchState.searchParams.get("eventKey") || "NONE", // Pull from parent state
    matchType: matchParts[1].toLowerCase(),
    matchNumber: parseInt(matchParts[2]),
    station: matchState.searchParams.get("station") || "NONE",
    robot: matchState.scoutData?.teamNumber || 0,
    //perspective: s.perspective || "near",

    // Endgame fields (Matching your SCHEMA keys exactly)
    disabled: s.endgame?.disabled || "No",
    driverSkill: s.endgame?.driverSkill || 0,
    defenseSkill: s.endgame?.defenseSkill || 0,
    accuracy: s.endgame?.accuracy || "Low", // ADD THIS
    shotRate: s.endgame?.shotRate || 0,
    snowballRate: s.endgame?.snowballRate || 0,
    roles: (s.endgame?.roles || []).join(", "), // ADD THIS (Joins ["Steal", "Feed"] into "Steal, Feed")

    cycles: s.cycles.filter(c => c.type && c.startTime !== undefined).map(c => {
      // In prepareMatchForDTO
      const startDeci = Math.floor(c.startTime / 100);
      const endDeci = Math.floor((c.endTime || c.startTime) / 100);
      const duration = Math.max(0, endDeci - startDeci); // Now in 0.1s increments
      return {
        type: c.type || "NONE",
        phase: c.phase?.toUpperCase() || "tele",
        startTime: startDeci,
        duration: duration,
        location: c.location || "NONE",
        pinCount: c.pinCount || 0,
        foulCount: c.foulCount || 0,
        success: c.success !== undefined ? c.success : true
      };
    }),
    comments: comments
  };
};