//update in server too
export const PRACTICE_EVENTS = [];
export const ATTENDING_EVENTS = ["2017oncmp"]; 

export const FIELD_VIRTUAL_HEIGHT = 1610;
export const FIELD_VIRTUAL_WIDTH = 3510;
export const FIELD_ASPECT_RATIO = FIELD_VIRTUAL_WIDTH / FIELD_VIRTUAL_HEIGHT;

export const AUTO_MAX_TIME = 20 * 1000;
export const TELE_MAX_TIME = 143 * 1000; 

export const CYCLE_TYPES = {
  SCORING: "SCORING",
  SHUTTLING: "SHUTTLING",
  DEFENSE: "DEFENSE",
  CONTACT: "CONTACT",
  HANG: "HANG",
  AUTO_MOVEMENT: "AUTO_MOVEMENT",
};

// New: Rate ranges for scoring and shuttling
export const BPS_RANGES = {
  SLOW: { label: "Slow (1-2/s)", min: 1, max: 2 },
  STEADY: { label: "Steady (3-4/s)", min: 3, max: 4 },
  FAST: { label: "Fast (5-6/s)", min: 5, max: 6 },
  MAX: { label: "Max (7+/s)", min: 7, max: 8 }, // Capped at 8 for realistic data
};


export const DRIVER_STATIONS = {
  R1: "r1", R2: "r2", R3: "r3",
  B1: "b1", B2: "b2", B3: "b3",
};

export const PERSPECTIVE = {
  SCORING_TABLE_NEAR: "near",
  SCORING_TABLE_FAR: "far",
};

export const COLORS = {
  INTAKE: "intake",
  SHOOT: "shoot",
  HANG_DEFENSE: "hangDefense",
  UNDO: "undo",
  SUCCESS: "success",
  FAIL: "fail",
  ACTIVE: "primary",
  PENDING: "secondary",
  WARNING: "warning",
  ERROR: "error",
  CANCEL: "info",
};

export const PHASES = {
  PRE_MATCH: "pre_match",
  AUTO: "auto",
  TELE: "tele",
  POST_MATCH: "post_match",
};

// Updated locations for the REBUILT field
export const GAME_LOCATIONS = {
  PRELOAD: "PRELOAD",
  HUB: "HUB",
  TOWER: "TOWER",
  INITIATION_LINE: "INITIATION_LINE",
};

// Updated hang levels for REBUILT
export const HANG_LEVELS = {
  LEVEL_1: "LEVEL_1",
  LEVEL_2: "LEVEL_2",
  LEVEL_3: "LEVEL_3",
  FAIL: "FAIL",
  NONE: "NONE",
};