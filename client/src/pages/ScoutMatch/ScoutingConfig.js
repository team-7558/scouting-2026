import {
  PHASES,
  CYCLE_TYPES,
} from "./Constants";
import { StartingPositionSlider } from "./CustomFieldComponents";

// Helper to ensure no two timed cycles (scoring, defense, etc.) run at once.
const startNewCycle = (match, cycleType) => {
  // End any currently unfinished cycle before starting a new one.
  finishUnfinished(match);
  
  // Start the new cycle.
  match.setActiveCycle({
    type: cycleType,
    startTime: match.getCurrentTime(),
  });
};

const finishUnfinished = (match) => {
  // This function is now simplified. If there's an active cycle,
  // we effectively cancel it by resetting the state.
  // The sidebar logic will handle proper cycle completion.
  if (match.activeCycle) {
    match.setActiveCycle(null);
  }
  if (match.contact.startTime && !match.contact.endTime) {
    match.setContact(prev => ({ ...prev, endTime: match.getCurrentTime() }));
    match.saveEndedCycles();
  }
};

export const SCOUTING_CONFIG = {
  // STARTING_LINE: {
  //   phases: [PHASES.PRE_MATCH],
  //   positions: { PRELOAD: [1400, 650] },
  //   dimensions: { width: 0, height: 1410 },
  //   componentFunction: (match, key) => StartingPositionSlider(match),
  // },

  TEST: {
    phases: [PHASES.PRE_MATCH],
    positions: { HUB: [160, 465] }, 
    dimensions: { width: 150, height: 200 },
    disabled: (match, key) => match.activeCycle !== null,
    textFunction: (match, key) => "TEST",
    sx: {opacity: 0.5}
  },


  HUB: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: { HUB: [100, 590] }, // Example position for the main scoring hub
    dimensions: { width: 250, height: 400 },
    disabled: (match, key) => match.activeCycle !== null, // Disable if another cycle is active
    drawBorder: (match, key) => match.activeCycle?.type === CYCLE_TYPES.SCORING || match.activeCycle?.type === CYCLE_TYPES.SHUTTLING,
    onClick: (match, key) => startNewCycle(match, CYCLE_TYPES.SCORING),
    textFunction: (match, key) => "SCORE",
  },
  
  TOWER: {
    phases: [PHASES.TELE],
    positions: { TOWER: [1075, 800] }, // Example position for the hang tower
    dimensions: { width: 300, height: 300 },
    isCircle: true,
    showFunction: (match) => match.getCurrentTime() >= (135000-30000) && !match.hang.startTime, // Show in endgame
    drawBorder: (match) => match.hang.startTime && !match.hang.endTime,
    onClick: (match) => {
      finishUnfinished(match);
      if (!match.hang.startTime) {
        match.setHang({ startTime: match.getCurrentTime(), endTime: null, level: null });
      }
    },
    textFunction: (match) => "HANG",
  },

  DEFENSE_TOGGLE: {
    phases: [PHASES.TELE],
    positions: { DEFENSE: [1800, 100] },
    dimensions: { width: 400, height: 200 },
    drawBorder: (match) => match.activeCycle?.type === CYCLE_TYPES.DEFENSE,
    onClick: (match, key) => {
      if (match.activeCycle?.type === CYCLE_TYPES.DEFENSE) {
        // If defense is active, this button stops it.
        match.setActiveCycle(prev => ({ ...prev, endTime: match.getCurrentTime() }));
        match.saveEndedCycles();
      } else if (!match.activeCycle) {
        // If no cycle is active, this button starts defense.
        startNewCycle(match, CYCLE_TYPES.DEFENSE);
      }
    },
    textFunction: (match, key) => match.activeCycle?.type === CYCLE_TYPES.DEFENSE ? "STOP DEFENSE" : "START DEFENSE",
    dontFlip: true,
  },

  AUTO_MOVEMENT: {
    phases: [PHASES.AUTO],
    positions: {a: [1100, 800]},
    dimensions: {width: 400, height: 200},
    showFunction: (match) => !match.cycles.some(cycle => cycle.type===CYCLE_TYPES.AUTO_MOVEMENT),
    onClick: (match) => {
      // Create and immediately save the auto movement cycle
      match.setCycles(prev => [...prev, {
        type: CYCLE_TYPES.AUTO_MOVEMENT,
        phase: PHASES.AUTO,
        startTime: 0,
        endTime: match.getCurrentTime(),
        attainedLocation: match.startingPosition
      }]);
    },
    textFunction: (match) => "LEFT LINE"
  },

  GO_POST: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: {AUTO: [1800, 1450], TELE: [1800, 1450]},
    dimensions: {width: 400, height: 200},
    showFunction: (match, key) => match.phase===PHASES[key],
    textFunction: (match, key) => `TO ${key==="AUTO" ? "TELE" : "POST-MATCH"}`,
    onClick: (match, key) => {
      finishUnfinished(match);
      match.setPhase(key==="AUTO" ? PHASES.TELE : PHASES.POST_MATCH);
      match.saveEndedCycles();
    },
    dontFlip: true
  },
};