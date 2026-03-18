import {
  COLORS,
  CYCLE_TYPES,
  GAME_LOCATIONS,
  PHASES,
  AUTO_MAX_TIME
} from "./Constants";
import { StartingPositionSlider } from "./CustomFieldComponents";

const exists = (val) => {
  return val !== null && val !== undefined
}

// Helper to ensure no two timed cycles (scoring, defense, etc.) run at once.
const startNewCycle = (match, cycleType, currentTime) => {
  // End any currently unfinished cycle before starting a new one.
  finishUnfinished(match);

  // Start the new cycle.
  match.setActiveCycle({
    type: cycleType,
    startTime: currentTime,
    phase: match.phase,
  }, `Start ${cycleType} cycle`);
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
    positions: { PRELOAD: [880, 650] },
    dimensions: { width: 0, height: 1410 },
    componentFunction: (match, key) => {
      return <StartingPositionSlider match={match} />
    },
  },

  MOVEMENT: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: { TRENCH: [1030, 210], BUMP: [1030, 500] },
    dimensions: { width: 250, height: 250 },
    onClick: (match, key, currentTime) => match.setCycles([...match.cycles, {
      location: key,
      type: CYCLE_TYPES.AUTO_MOVEMENT,
      phase: match.phase,
      startTime: match.currentTime,
    }], `Move through ${key}`),
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
    positions: { SHOOT: [855, 800]},
    dimensions: { width: 600, height: 300 },
    textFunction: (match, key) => key,
    color: COLORS.SHOOT,
    fontSize: 90,
    sx: (match) => {
      return {
        fontWeight: 400,
      }
    },
    showFunction: (match, key) => match.cycles.filter(c => c.type === CYCLE_TYPES.AUTO_MOVEMENT).length % 2 === 1,
    onClick: (match, key, currentTime) => {
      match.setActiveCycle({
        type: CYCLE_TYPES.SHOOTING,
        phase: match.phase,
        startTime: currentTime,
        endTime: null,
      });
    },
    onClickEnd: (match, key, currentTime) => {
      match.setActiveCycle({
        ...match.activeCycle,
        endTime: currentTime,
      })
    },
    isSelected: (match, key) =>
      match.activeCycle?.type === CYCLE_TYPES.SHOOTING && exists(match.activeCycle?.startTime),
  },

  TOWER: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: { TOWER: [300, 800] },
    dimensions: { width: 500, height: 300 },
    showFunction: (match, key) => match.cycles.filter(c => c.type === CYCLE_TYPES.AUTO_MOVEMENT).length % 2 === 1,
    textFunction: (match, key) => "HANG",
    color: COLORS.HANG_DEFENSE,
    onClick: (match, key, currentTime) => {
      match.setActiveCycle({
        type: CYCLE_TYPES.HANG,
        phase: match.phase,
        startTime: currentTime,
      }, `Start Climb Cycle`);
    },
    isSelected: (match, key) =>
      match.activeCycle?.type === CYCLE_TYPES.HANG,
  },

  HISTORY_CONTROLS: {
    // These buttons are available during both Auto and TeleOp
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: {
      UNDO: [1400, 1250],
      REDO: [1900, 1250],
    },
    dimensions: { width: 450, height: 450 },
    textFunction: (match, key) => {
      if (key === 'UNDO' && match.canUndo()) {
        return `Undo: ${match.lastUndoMessage}`; // <-- Displays the message
      }
      else if (key === 'REDO' && match.canRedo()) {
        return (`Redo: ${match.redoMessage}`)
      }
      return key;
    },

    onClick: (match, key) => {
      if (key === "UNDO") {
        match.undo();
      } else {
        match.redo();
      }
    },
    color: COLORS.UNDO,
    showFunction: (match, key) => {
      return key === "UNDO" ? match.canUndo() : match.canRedo();
      // return false;
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
      match.setPhase(
        match.phase === PHASES.AUTO ? PHASES.TELE : PHASES.POST_MATCH,
        match.phase === PHASES.AUTO ? "To TeleOp" : "To Endgame"
      );
    },
    sx: (match, currentTime) => {return {
      //if teleop, make it a dull blue. If auto and not done, make dull red. If auto is done, make it bright green
      backgroundColor: match.phase === PHASES.TELE ? 
        "#8888dd" : 
        (currentTime===AUTO_MAX_TIME 
          ? ("#00ff00")
          : "#aa0000"
        ),
      
      //if teleop, make it white. If auto and not done, make it white. If auto is done, make it black
      color: match.phase === PHASES.TELE ? 
        "#ffffff" : 
        (currentTime===AUTO_MAX_TIME 
          ? ("#000000")
          : "#ffffff"
        ),
    }}
  },

  DEFENSE_TOGGLE: {
    phases: [PHASES.TELE],
    // Positioned same as PHASE_CHANGER
    positions: { DEFENSE: [1650, 475] },
    dimensions: { width: 950, height: 250 },
    textFunction: (match, key) => match.isDefending() ? "End Defend/Steal" : "Start Defense/Steal",
    color: COLORS.HANG_DEFENSE,
    showFunction: (match, key) => match.cycles.filter(c => c.type === CYCLE_TYPES.AUTO_MOVEMENT).length % 2 === 0,
    onClick: (match, key, currentTime) => {
      if (match.isDefending()) {
        match.setDefenseCycle(
          prev => { return { ...prev.defenseCycle, endTime: currentTime } },
          `End Defense/Steal`); // End defense
      } else {
        match.setDefenseCycle({
          type: CYCLE_TYPES.DEFENSE,
          phase: match.phase,
          startTime: currentTime,
        }, `Start Defense/Steal`);
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
    onClick: (match, key, currentTime) => {
      match.setActiveCycle({
        type: CYCLE_TYPES.INTAKE,
        phase: match.phase,
        location: GAME_LOCATIONS.OPPONENT_ALLIANCE_ZONE,
        startTime: currentTime
      }, `Start Intake (Steal) Cycle`);
    },
    isSelected: (match, key) =>
      match.activeCycle?.type === CYCLE_TYPES.INTAKE && match.activeCycle?.location === GAME_LOCATIONS.OPPONENT_ALLIANCE_ZONE,
  },

  DEFENSE_CONTACT: {
    phases: [PHASES.TELE],
    positions: { CONTACT: [2800, 1200] }, // Replaces BYPASS position
    dimensions: { width: 800, height: 400 },
    showFunction: (match, key) => match.isDefending(),
    textFunction: (match, key) => "CONTACT",
    color: COLORS.HANG_DEFENSE,
    fontSize: 90,
    onClick: (match, key, currentTime) => {
      startNewCycle(match, CYCLE_TYPES.CONTACT, currentTime);
    },
    isSelected: (match, key) =>
      match.activeCycle?.type === CYCLE_TYPES.CONTACT,
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

    fieldX: 650,
    fieldY: 150,
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

    fieldX: 650,
    fieldY: 550,
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

  // --------------------
  // ACCURACY
  // --------------------
  // {
  //   id: "accuracy",
  //   type: "TOGGLE",
  //   label: "Accuracy",

  //   fieldX: 650,
  //   fieldY: 950,
  //   width: 1200,
  //   height: 200,

  //   options: ["Low", "Med", "High", ],
  //   values: ["Low", "Med", "High", ],

  //   labelParams: {
  //     height: 150
  //   },

  //   rowParams: {
  //     gap: 5
  //   }
  // },

  // // ---------------------
  // // DISABLED STATUS
  // // ---------------------
  {
    id: "disabled",
    type: "TOGGLE",
    label: "Disabled?",

    fieldX: 1500,
    fieldY: 150,
    width: 1200,
    height: 200,

    options: ["No", "Yes"],
    values: ["No", "Yes"],

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

    fieldX: 1500,
    fieldY: 550,
    width: 1200,
    height: 200,

    options: ["Cycle", "Defense", "Feed", "Steal"],

    labelParams: {
      height: 150
    },

    rowParams: {
      gap: 2
    }
  },

  // --------------------
  // COMMENTS
  // --------------------
  {
    id: "comments",
    type: "TEXT_AREA",
    label: "Comments",

    fieldX: 2050,
    fieldY: 775,
    width: 700,
    height: 1450,

    labelParams: {
      height: 150
    },

    textParams: {
      y: 170
    }
  },
]