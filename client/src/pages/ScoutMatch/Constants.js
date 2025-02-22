export const FIELD_VIRTUAL_HEIGHT = 1610;
export const FIELD_VIRTUAL_WIDTH = 3510;
export const FIELD_ASPECT_RATIO = FIELD_VIRTUAL_WIDTH / FIELD_VIRTUAL_HEIGHT;

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
  CORALPICKUP: "coralPickup",
  ALGAEPICKUP: "algaePickup",
  CORALDROPOFF: "coralDropoff",
  ALGAEDROPOFF: "algaeDropoff",
  DROP: "warning",
  CANCEL: "error",
};

export const ACTIONS = {
  ACQUIRE: "acquire",
  DEPOSIT: "deposit",
  HANG: "hang",
  GO_TELE: "go_tele",
  GO_DEFENSE: "go_defense",
  GO_POST_MATCH: "go_post_match",
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
  HANG: {
    LEFT: "HANG_LEFT",
    MIDDLE: "HANG_MIDDLE",
    RIGHT: "HANG_RIGHT",
  },
  HANG_LEVEL: {
    PARK: "PARK",
    DEEP: "DEEP",
    SHALLOW: "SHALLOW",
  },
  HANG_STATE: {
    FAIL: "FAIL",
    SUCCEED: "SUCCEED",
  },
  STARTING_LINE: "STARTING_LINE",
};
