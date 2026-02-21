import { bgcolor } from "@mui/system";
import {
  PHASES,
  CYCLE_TYPES,
  COLORS,
  GAME_LOCATIONS,
  ENDGAME_ROLES,
  DISABLED_STATUS
} from "./Constants";
import { StartingPositionSlider } from "./CustomFieldComponents";

const exists = (val) => {
  return val !== null && val !== undefined
}

// Helper to ensure no two timed cycles (scoring, defense, etc.) run at once.
const startNewCycle = (match, cycleType) => {
  // End any currently unfinished cycle before starting a new one.
  finishUnfinished(match);

  // Start the new cycle.
  match.setActiveCycle({
    type: cycleType,
    startTime: match.getCurrentTime(),
    phase: match.phase,
  });
};

const finishUnfinished = (match) => {
  // This function is now simplified. If there's an active cycle,
  // we effectively cancel it by resetting the state.
  // The sidebar logic will handle proper cycle completion.
  if (exists(match.activeCycle.startTime)) {
    match.setActiveCycle({});
  }
};

export const SCOUTING_CONFIG = {
  STARTING_LINE: {
    phases: [PHASES.PRE_MATCH],
    positions: { PRELOAD: [880, 950] },
    dimensions: { width: 0, height: 1410 },
    componentFunction: (match, key) => StartingPositionSlider(match),
  },


  MOVEMENT: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: { TRENCH: [1030, 210], BUMP: [1030, 500] },
    dimensions: { width: 250, height: 250 },
    onClick: (match, key) => match.setCycles([...match.cycles, {
      location: key,
      type: CYCLE_TYPES.AUTO_MOVEMENT,
      phase: PHASES.AUTO,
      startTime: match.getCurrentTime(),
    }]),
    textFunction: (match, key) => {
      const spot = {
        TRE: "TRENCH",
        BUM: "BUMP"
      }[key.substring(0, 3)];

      return `${spot}: ${match.cycles.filter(c =>
        c.type === CYCLE_TYPES.AUTO_MOVEMENT &&
        c.location === spot
      ).length}`
    },
    color: COLORS.UNDO
  },

  HUB: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: { CLOSE: [755, 800], FAR: [455, 1250] },
    dimensions: { width: 800, height: 300 },
    textFunction: (match, key) => key,
    color: COLORS.SHOOT,
    fontSize: 90,
    sx: (match) => {
      return {
        fontWeight: 400,
      }
    },
    onClick: (match, key) => {
      match.setActiveCycle({
        type: CYCLE_TYPES.SHOOTING,
        phase: match.phase,
        location: key,
        startTime: match.getCurrentTime(),
        endTime: null,
        rate: null,
      });
    }
  },

  TOWER: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: { TOWER: [180, 800] },
    dimensions: { width: 300, height: 300 },
    textFunction: (match, key) => "",
    color: COLORS.HANG_DEFENSE,
    onClick: (match, key) => {
      match.setActiveCycle({
        type: CYCLE_TYPES.HANG,
        phase: match.phase,
        startTime: match.getCurrentTime(),
      })
    }
  },

  // Add these THREE objects to your SCOUTING_CONFIG in ScoutingConfig.js

  // Configuration for the Depot Intake button
  DEPOT_INTAKE: {
    phases: [PHASES.AUTO, PHASES.TELE],
    // Replace with your desired coordinates
    positions: { DEPOT: [500, 525] },
    dimensions: { width: 600, height: 200 },
    textFunction: (match, key) => match.phase === PHASES.AUTO ? "Depot Intake" : "Alliance Zone",
    showFunction: (match, key) => !match.isDefending(), // Hide when defending
    color: COLORS.INTAKE, // Using the color from Constants.js
    fontSize: 71,
    // When clicked, it starts an INTAKE cycle with the specific location
    onClick: (match, key) => {
      console.log("here")
      match.setActiveCycle({
        type: CYCLE_TYPES.INTAKE,
        phase: match.phase,
        location: match.phase === PHASES.AUTO ? key : "ALLIANCE_ZONE", // Will be "DEPOT"
        startTime: match.getCurrentTime(),
      });
    }
  },

  NEUTRAL_ZONE_INTAKE: {
    phases: [PHASES.AUTO, PHASES.TELE],
    // Replace with your desired coordinates
    positions: { ZONE: [1650, 800] },
    dimensions: { width: 950, height: 300 },
    textFunction: (match, key) => "Neutral Zone Intake",
    showFunction: (match, key) => !match.isDefending(), // Hide when defending
    color: COLORS.INTAKE, // Using the color from Constants.js
    fontSize: 70,
    // When clicked, it starts an INTAKE cycle with the specific location
    onClick: (match, key) => {
      console.log("here")
      match.setActiveCycle({
        type: CYCLE_TYPES.INTAKE,
        phase: match.phase,
        location: "NEUTRAL_ZONE", // Will be "DEPOT"
        startTime: match.getCurrentTime(),
      });
    }
  },

  // Configuration for the Snowball (Burst) button
  SNOWBALL: {
    phases: [PHASES.AUTO, PHASES.TELE],
    // Replace with your desired coordinates
    positions: { DEPOT: [500, 235], NEUTRAL_ZONE: [1650, 800] },
    dimensions: { width: 800, height: 300 },
    textFunction: (match, key) => "SNOWBALL",
    color: COLORS.SHOOT, // Using a primary/active color
    showFunction: (match, key) => key === "DEPOT" ? !match.isDefending() : match.isDefending(),
    fontSize: 90,
    onClick: (match, key) => {
      match.setActiveCycle({
        type: CYCLE_TYPES.SNOWBALL,
        phase: match.phase,
        location: key,
        startTime: match.getCurrentTime(),
      });
    }
  },

  HISTORY_CONTROLS: {
    // These buttons are available during both Auto and TeleOp
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: {
      UNDO: [1400, 1250],
      REDO: [1900, 1250],
    },
    dimensions: { width: 450, height: 450 },
    textFunction: (match, key) => key,

    onClick: (match, key) => {
      if (key === "UNDO") {
        match.undo();
      } else {
        match.redo();
      }
    },
    color: COLORS.UNDO,
    isDisabled: (match, key) => {
      return key === "UNDO" ? !match.canUndo() : !match.canRedo();
    },
  },

  PHASE_CHANGER: {
    // CRITICAL: This button will ONLY ever exist during the AUTO phase.
    phases: [PHASES.AUTO, PHASES.TELE],

    positions: {
      TO_TELE: [1650, 200],
    },
    dimensions: { width: 950, height: 200 },

    // The text is static, so no logic is needed.
    textFunction: (match, key) => match.phase === PHASES.AUTO ? "To TeleOp" : "To Endgame",

    // The onClick is now extremely simple.
    onClick: (match) => {
      match.setPhase(match.phase === PHASES.AUTO ? PHASES.TELE : PHASES.POST_MATCH);
    },
    color: COLORS.SUCCESS,
  },

  DEFENSE_TOGGLE: {
    phases: [PHASES.TELE],
    // Positioned same as PHASE_CHANGER
    positions: { DEFENSE: [1650, 475] },
    dimensions: { width: 950, height: 250 },
    textFunction: (match, key) => match.isDefending() ? "End Defend/Steal" : "Start Defense",
    color: COLORS.HANG_DEFENSE,
    onClick: (match, key) => {
      if (match.isDefending()) {
        match.setDefenseCycle(prev => { return { ...prev.defenseCycle, endTime: match.getCurrentTime() } }); // End defense
      } else {
        match.setDefenseCycle({
          type: CYCLE_TYPES.DEFENSE,
          phase: match.phase,
          startTime: match.getCurrentTime(),
        });
      }
    },
  },

  DEFENSE_STEAL: {
    phases: [PHASES.TELE],
    // New interaction
    positions: { STEAL: [2800, 500] },
    dimensions: { width: 800, height: 400 },
    showFunction: (match, key) => match.isDefending(),
    textFunction: (match, key) => "STEAL",
    color: COLORS.INTAKE,
    fontSize: 70,
    onClick: (match, key) => {
      match.setActiveCycle({
        type: CYCLE_TYPES.INTAKE,
        phase: match.phase,
        location: GAME_LOCATIONS.OPPONENT_ALLIANCE_ZONE,
        startTime: match.getCurrentTime(),
      });
    }
  },

  DEFENSE_CONTACT: {
    phases: [PHASES.TELE],
    positions: { CONTACT: [2800, 1200] }, // Replaces SNOWBALL position
    dimensions: { width: 800, height: 400 },
    showFunction: (match, key) => match.isDefending() && match.activeCycle.type !== CYCLE_TYPES.CONTACT,
    textFunction: (match, key) => "CONTACT",
    color: COLORS.HANG_DEFENSE,
    fontSize: 90,
    onClick: (match, key) => {
      startNewCycle(match, CYCLE_TYPES.CONTACT);
    }
  },
};

export const ENDGAME_CONFIG = [
  // --------------------
  // DRIVER SKILL
  // --------------------
  {
    id: "driverSkill",
    type: "SCALE",
    label: "Driver Skill",

    fieldX: 700,
    fieldY: 200,
    width: 1200,
    height: 200,

    min: 0,
    max: 5,

    labelParams: {
      height: 150
    },

    rowParams: {
      gap: 2
    }
  },

  // --------------------
  // DEFENSE SKILL
  // --------------------
  {
    id: "defenseSkill",
    type: "SCALE",
    label: "Defense Skill",

    fieldX: 700,
    fieldY: 700,
    width: 1200,
    height: 200,

    min: 0,
    max: 5,

    labelParams: {
      height: 150
    },

    rowParams: {
      gap: 5
    }
  },

  // // --------------------
  // // DISABLED STATUS
  // // --------------------
  {
    id: "disabled",
    type: "TOGGLE",
    label: "Disabled?",

    fieldX: 1600,
    fieldY: 200,
    width: 1300,
    height: 200,

    options: ["No", "Partially", "Yes"],

    labelParams: {
      height: 150
    },

    rowParams: {
      gap: 5
    }
  },

  // --------------------
  // ROLES WITH RATINGS
  // --------------------

  {
    id: "roles",
    type: "OPTIONS",
    label: "Robot Roles",

    fieldX: 800,
    fieldY: 1200,
    width: 1400,
    height: 200,

    options: ["Cycle", "Defense", "Feed", "Steal"],

    labelParams: {
      height: 150
    },

    rowParams: {
      gap: 5
    }
  },

  // --------------------
  // COMMENTS
  // --------------------
  {
    id: "comments",
    type: "TEXT_AREA",
    label: "Comments",

    fieldX: 1800,
    fieldY: 1000,
    width: 1250,
    height: 750,

    labelParams: {
      height: 150
    },

    textParams: {
      y: 170
    }
  }
]