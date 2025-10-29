//update in server too
export const PRACTICE_EVENTS = []; //["2025week0", "2025onnew"];
export const ATTENDING_EVENTS = ["2024oncmp1"]; //, "2025ontor", "2025oncmp"];

export const FIELD_VIRTUAL_HEIGHT = 1610;
export const FIELD_VIRTUAL_WIDTH = 3510;
export const FIELD_ASPECT_RATIO = FIELD_VIRTUAL_WIDTH / FIELD_VIRTUAL_HEIGHT;

export const AUTO_MAX_TIME = 15 * 1000;
// export const AUTO_BELL_TIME = 3 * 1000;
export const TELE_MAX_TIME = 153 * 1000;

export const CYCLE_TYPES = {
  POWER_CELL: "POWER_CELL",
  CONTROL_PANEL: "CONTROL_PANEL",
  DEFENSE: "DEFENSE",
  CONTACT: "CONTACT",
  AUTO_MOVEMENT: "AUTO_MOVEMENT",
  HANG: "HANG",
};

export const DRIVER_STATIONS = {
  R1: "r1",
  R2: "r2",
  R3: "r3",
  B1: "b1",
  B2: "b2",
  B3: "b3",
};

export const PERSPECTIVE = {
  SCORING_TABLE_NEAR: "near",
  SCORING_TABLE_FAR: "far",
};

export const COLORS = {
  PENDING: "info",
  SUCCESS: "success",
  DISABLED: "disabled",
  ACTIVE: "primary",
  OPPONENT: "opponent",
  POWERCELL: "powerCell",
  WARNING: "warning",
  ERROR: "error",
  CANCEL: "cancel",
};

export const DEPOSIT_TYPE = {
  SCORE: "SCORE",
  DROP: "DROP",
};

export const ACTIONS = {
  ACQUIRE: "acquire",
  SHOOT: "shoot",
  FINISH: "finish",
  ACQUIRE_AND_FINISH: "acquire_and_finish",
  DROP: "drop",
  HANG: "hang",
  HANG_ENTER: "hang_enter",
  HANG_COMPLETE: "hang_complete",
  GO_TELE: "go_tele",
  GO_DEFENSE: "go_defense",
  GO_POST_MATCH: "go_post_match",
  ROBOT_LEFT_STARTING: "left_starting_zone",
  CONTROL_PANEL_ROTATION: "rotation",
  CONTROL_PANEL_PRECISION: "precision"
};
export const GAME_PIECES = { POWER_CELL: "power_cell"};
export const PHASES = {
  PRE_MATCH: "pre_match",
  AUTO: "auto",
  TELE: "tele",
  POST_MATCH: "post_match",
};

export const MATCH_BUTTONS = {
  TELE: "TELE",
  DEFENCE: "DEFENCE",
};

export const GAME_LOCATIONS = {
  PRELOAD: "PRELOAD",
  PREPLACED_POWER_CELL: {
    TRENCH_RUN: {
      FORWARD: "preplaced1",
      MIDDLE: "preplaced2",
      BACK: "preplaced3",
      BACK_OUTSIDE: "preplaced4",
      BACK_INSIDE: "preplaced5",
    },
    OPP_TRENCH_RUN: {
      FORWARD: "preplaced6",
      MIDDLE: "preplaced7",
      BACK: "preplaced8",
      BACK_OUTSIDE: "preplaced9",
      BACK_INSIDE: "preplaced10",
    },
    SHIELD_GENERATOR: {
      TRENCH_RUN_CLOSE: "preplaced11",
      TRENCH_RUN_CLOSE_MID: "preplaced12",
      TRENCH_RUN_MID: "preplaced13",
      TRENCH_RUN_MID_FAR: "preplaced14",
      TRENCH_RUN_FAR: "preplaced15"
    }
  },
  LOADING_BAY: "LOADING_BAY",
  POWER_PORT: {
    LOW: "POWER_PORT_LOW",
    HIGH: "POWER_PORT_HIGH",
  },
  CONTROL_PANEL: "CONTROL_PANEL",
  SHIELD_GENERATOR: "SHIELD_GENERATOR",
  FEED: "FEED",

  INITIATION_LINE: "INITIATION_LINE",
};

export const HANG_RESULTS = {
  NONE: "NONE",
  PARK: "PARK",
  FAIL: "FAIL_HANG",
  HANG: "HANG",
  BALANCED: "BALANCED",
};
