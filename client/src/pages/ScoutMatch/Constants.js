//update in server too
export const PRACTICE_EVENTS = [];
export const ATTENDING_EVENTS = ["2024oncmp1"];

export const FIELD_VIRTUAL_HEIGHT = 1610;
export const FIELD_VIRTUAL_WIDTH = 3510;
export const FIELD_ASPECT_RATIO = FIELD_VIRTUAL_WIDTH / FIELD_VIRTUAL_HEIGHT;

export const AUTO_MAX_TIME = 20 * 1000;
export const TELE_MAX_TIME = 143 * 1000;

export const CYCLE_TYPES = {
  SHOOTING: "SHOOT",
  SNOWBALL: "SNOWBALL",
  INTAKE: "INTAKE",
  DEFENSE: "DEFENSE",
  CONTACT: "CONTACT",
  HANG: "HANG",
  AUTO_MOVEMENT: "AUTO_MOVEMENT",
};

// New: Rate ranges for scoring and shuttling
export const BPS_RANGES = {
  SLOW: { label: "Slow (1-3/s)", value: 2 },
  STEADY: { label: "Steady (3-5/s)", value: 4 },
  FAST: { label: "Fast (5-7/s)", value: 6 },
  MAX: { label: "Max (7+/s)", value: 8 },
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
  INFO: "info",
};

export const PHASES = {
  PRE_MATCH: "pre_match",
  AUTO: "auto",
  TELE: "tele",
  POST_MATCH: "post_match",
};

export const ENDGAME_ROLES = {
  CYCLE: "Cycle",
  DEFENSE: "Defense",
  FEED: "Feed",
  STEAL: "Steal",
};

export const DISABLED_STATUS = {
  NO: "No",
  PARTIALLY: "Partially",
  YES: "Yes",
};

// Updated hang levels for REBUILT
export const HANG_LEVELS = {
  LEVEL_1: "LEVEL_1",
  LEVEL_2: "LEVEL_2",
  LEVEL_3: "LEVEL_3",
};

export const GAME_LOCATIONS = {
  DEPOT: "DEPOT",
  ALLIANCE_ZONE: "ALLIANCE_ZONE",
  NEUTRAL_ZONE: "NEUTRAL_ZONE",
  OPPONENT_ALLIANCE_ZONE: "OPPONENT_ALLIANCE_ZONE",
  PRELOAD: "PRELOAD",
  HUB: "HUB",
  TOWER: "TOWER",
  INITIATION_LINE: "INITIATION_LINE",
};