//update in server too
export const PRACTICE_EVENTS = ["2025week0", "2025onnew"];
export const ATTENDING_EVENTS = ["2025onsca", "2025ontor", "2025oncmp"];

export const FIELD_VIRTUAL_HEIGHT = 1610;
export const FIELD_VIRTUAL_WIDTH = 3510;
export const FIELD_ASPECT_RATIO = FIELD_VIRTUAL_WIDTH / FIELD_VIRTUAL_HEIGHT;

export const AUTO_MAX_TIME = 15 * 1000;
export const TELE_MAX_TIME = 150 * 1000;

export const CYCLE_TYPES = {
  CORAL: "CORAL",
  ALGAE: "ALGAE",
  HANG: "HANG",
  DEFENSE: "DEFENSE",
  CONTACT: "CONTACT",
  AUTO_MOVEMENT: "AUTO_MOVEMENT",
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
  CORALPICKUP: "coralPickup",
  ALGAEPICKUP: "algaePickup",
  CORALDROPOFF: "coralDropoff",
  ALGAEDROPOFF: "algaeDropoff",
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
  DEPOSIT: "deposit",
  FINISH: "finish",
  DROP: "drop",
  HANG: "hang",
  HANG_ENTER: "hang_enter",
  HANG_CAGE_TOUCH: "hang_cage_touch",
  HANG_COMPLETE: "hang_complete",
  GO_TELE: "go_tele",
  GO_DEFENSE: "go_defense",
  GO_POST_MATCH: "go_post_match",
  ROBOT_LEFT_STARTING: "left_starting_zone",
};
export const GAME_PIECES = { CORAL: "coral", ALGAE: "algae" };
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
  CORAL_MARK: {
    LEFT: "CORAL_MARK_LEFT",
    MIDDLE: "CORAL_MARK_MIDDLE",
    RIGHT: "CORAL_MARK_RIGHT",
  },
  CORAL_STATION: {
    LEFT: "CORAL_STATION_LEFT",
    RIGHT: "CORAL_STATION_RIGHT",
  },
  REEF: {
    AB: "REEF_AB",
    CD: "REEF_CD",
    EF: "REEF_EF",
    GH: "REEF_GH",
    IJ: "REEF_IJ",
    KL: "REEF_KL",
  },
  REEF_LEVEL: {
    1: "1",
    2: "2",
    3: "3",
    4: "4",
  },
  NET: "NET",
  PROCESSOR: "PROCESSOR",
  OPPONENT_PROCESSOR: "OPPONENT_PROCESSOR",
  HANG: {
    LEFT: "HANG_LEFT",
    MIDDLE: "HANG_MIDDLE",
    RIGHT: "HANG_RIGHT",
  },

  STARTING_LINE: "STARTING_LINE",
};

export const HANG_RESULTS = {
  NONE: "NONE",
  PARK: "PARK",
  DEEP: "DEEP",
  SHALLOW: "SHALLOW",
};
