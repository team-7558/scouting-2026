import { Experimental_CssVarsProvider } from "@mui/material";
import {
  GAME_LOCATIONS,
  PHASES,
  ACTIONS,
  GAME_PIECES,
  COLORS,
  CYCLE_TYPES,
} from "./Constants";

import { StartingPositionSlider } from "./CustomFieldComponents";
import { defer } from "react-router-dom";
import zIndex from "@mui/material/styles/zIndex";

// const createTask = (action, gamepiece = null) => ({
//   action: action,
//   gamepiece: gamepiece,
// });

function exists(val){
  return !(val===null || val===undefined)
}

const finishUnfinished = (match) => {
  const newVal = match.powerCellCycles.map(cycle => {
    if (cycle.depositLocation && !cycle.endTime && !(cycle.success===null || cycle.success===undefined)){
      return {...cycle, endTime: match.getCurrentTime()}
    }
    else if (cycle.depositLocation && !cycle.endTime){
      return {...cycle, depositLocation: undefined, success: undefined, endTime: undefined}
    } else if (cycle.attainedLocation && cycle.startTime){
      return {...cycle, startTime: match.getCurrentTime()};
    }
    return cycle
  });
  match.setPowerCellCycles(newVal);
  match.saveEndedCycles();

  if (match.controlPanel.endTime === null) {
    match.setControlPanel({ startTime: null, action: null, endTime: null });
  }

  if (match.hang.endTime === null) {
    match.setHang({ startTime: null, endTime: null, type: null });
  }
}

export const SCOUTING_CONFIG = {
  STARTING_LINE: {
    phases: [PHASES.PRE_MATCH],
    positions: {
      PRELOAD: [420, 665],
    },
    dimensions: {
      width: 0,
      height: 1010,
    },
    // tasks: [createTask(ACTIONS.GO_TELE)],
    componentFunction: (match, key) => StartingPositionSlider(match),
  },

  POWER_PORT: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: {
      HIGH: [100, 490],
      LOW: [100, 690]
    },
    dimensions: {
      width: 200,
      height: 200
    },
    disabled: (match, key) => match.getNumPowerCellsInBot()==0,
    drawBorder: (match, key) => match.powerCellCycles.some(cycle => cycle.depositLocation===`POWER_PORT_${key}` && !cycle.endTime),
    onClick: (match, key) => {
      finishUnfinished(match);
      match.saveEndedCycles();

      match.setPowerCellCycles(prevCycles => {
        const newPowerCellCycles = [...prevCycles];
        for (const i in prevCycles) {
          const cycle = prevCycles[i];
          if (cycle.attainedLocation && !cycle.depositLocation){
            newPowerCellCycles[i] = {...newPowerCellCycles[i], depositLocation: GAME_LOCATIONS.POWER_PORT[key]}
          }
        }

        return newPowerCellCycles;
      });
    },
    textFunction: (match, key) => key 
  },
  LOADING_BAY: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: {
      LOADING_BAY: [2050, 620]
    },
    dimensions: {
      width: 200,
      height: 200
    },
    disabled: (match, key) => match.getNumPowerCellsInBot()===5,
    drawBorder: false,
    onClick: (match, key) => {
      finishUnfinished(match);
      match.setPowerCellCycles(prevCycles => {
        let newCycles = [...prevCycles];
        let slot = -1;
        for (let i = 0; i<prevCycles.length; i++) {
          if (!prevCycles[i].attainedLocation){
            slot = i;
            break;
          }
        }
        if (slot>=0){
          newCycles[slot] = {attainedLocation: GAME_LOCATIONS.LOADING_BAY, startTime: match.getCurrentTime()}
        }else{
          console.log("ERROR")
        }
        return newCycles;
      });
      match.saveEndedCycles();
    },
    textFunction: (match, key) => "LOADING"
  },

  CONTROL_PANEL: {
    phases: [PHASES.TELE],
    positions: {
      CONTROL_PANEL: [1225, 400],
    },
    dimensions: {
      width: 300,
      height: 200,
    },
    disabled: (match) => false,
    showFunction: (match) => {
      console.log(match.cycles);
      return [ACTIONS.CONTROL_PANEL_ROTATION, ACTIONS.CONTROL_PANEL_PRECISION].some(
      action => !match.cycles.some(cycle =>
        cycle.type===CYCLE_TYPES.CONTROL_PANEL && cycle.action===action
      )
    )},
    drawBorder: (match) => match.controlPanel.startTime !== null && match.controlPanel.endTime === null,
    onClick: (match) => {
      finishUnfinished(match);
      if (match.controlPanel.startTime == null) {
          match.setControlPanel(prevControlPanel => {return { startTime: match.getCurrentTime(), action: null, endTime: null} });
      }
      match.saveEndedCycles();
    },
    textFunction: (match, key) => "CONTROL PANEL",
  },

  FEED: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: {a: [1200, 1450]},
    dimensions: {width: 400, height: 200},
    showFunction: (match, key) => {console.log("abcde", match.getNumPowerCellsInBot()); return match.getNumPowerCellsInBot()!=0},
    textFunction: (match, key) => `FEED`,
    onClick: (match, key) => {
      finishUnfinished(match);
      match.setPowerCellCycles(prevCycles => {
        let newCycles = [...prevCycles];
        let slot = -1;
        for (let i = 0; i<prevCycles.length; i++) {
          if (exists(prevCycles[i].startTime) && !exists(prevCycles[i].depositLocation)){
            slot = i;
            break;
          }
        }
        if (slot>=0){
          newCycles[slot] = {...newCycles[slot], depositLocation: GAME_LOCATIONS.FEED, endTime: match.getCurrentTime()}
        }else{
          console.log("ERROR")
        }
        return newCycles;
      });
      match.saveEndedCycles();
    },
    dontFlip: true
  },

  LEFT_STARTING_AREA: {
    phases: [PHASES.AUTO],
    positions: {a: [1100, 800]},
    dimensions: {width: 400, height: 200},
    showFunction: (match) => {
      console.log(match.cycles.some(cycle => cycle.type===CYCLE_TYPES.AUTO_MOVEMENT));
      return !match.cycles.some(cycle => cycle.type===CYCLE_TYPES.AUTO_MOVEMENT) && !match.autoMovement.endTime
    },
    onClick: (match) => {
      match.setAutoMovement({...match.autoMovement, endTime: match.getCurrentTime()});
      match.saveEndedCycles();
    },
    textFunction: (match) => "MOVED OFF LINE"
  },

  // --- Climb ---
  GENERATOR_SWITCH: {
    phases: [PHASES.TELE],
    positions: {
        CLIMB: [1075, 800] // Estimated position for the generator switch
    },
    dimensions: {
        width: 300,
        height: 300
    },
    isCircle: true,
    showFunction: (match) => !match.hang.endTime,
    drawBorder: (match) => match.hang.startTime !== null && match.hang.endTime === null,
    onClick: (match) => {
        finishUnfinished(match);
        // This button initiates the hang sequence from the field map.
        if (!match.hang.startTime) {
            match.setHang(prevHang => {return { startTime: match.getCurrentTime(), endTime: null, type: null }});
        }
        match.saveEndedCycles();
    },
    textFunction: (match) => "CLIMB"
  },

  // ------- Defense ----------
  DEFENSE: {
    phases: [PHASES.TELE],
    positions: {START: [1800, 100], STOP: [1800, 100]},
    dimensions: {width: 400, height: 200},
    showFunction: (match, key) => {
      console.log("match.isDefending", match.isDefending());
      return match.isDefending()===(key==="STOP")
    },
    drawBorder: (match) => match.isDefending(),
    textFunction: (match, key) => `${key} DEFENDING`,
    onClick: (match, key) => {
      console.log("defense", match.defense);
      finishUnfinished(match);
      if (key==="START"){
        match.setDefense(prevDefense => {return {startTime: match.getCurrentTime()}});
      }else{
        match.setDefense(prevDefense => {return {...match.defense, endTime: match.getCurrentTime}});
        match.saveEndedCycles();
      }
    },
    dontFlip: true
  },

  // ------- next phase ------------
  GO_POST: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: {AUTO: [1800, 1450], TELE: [1800, 1450]},
    dimensions: {width: 400, height: 200},
    showFunction: (match, key) => match.phase===PHASES[key],
    textFunction: (match, key) => `TO ${key==="AUTO" ? "TELE" : "POST-MATCH"}`,
    onClick: (match, key) => {
      match.setPhase(key==="AUTO" ? PHASES.TELE : PHASES.POST_MATCH)
      match.saveEndedCycles();
    },
    dontFlip: true
  },
};