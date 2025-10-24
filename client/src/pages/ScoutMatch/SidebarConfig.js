// SidebarConfig.js
import {
  PHASES,
  COLORS,
  ACTIONS,
  GAME_PIECES,
  GAME_LOCATIONS,
  HANG_RESULTS,
  CYCLE_TYPES,
} from "./Constants";
import { saveMatch } from "../../storage/MatchStorageManager";

const createTask = (action, gamepiece = null) => ({
  action: action,
  gamepiece: gamepiece,
});

const finishUnfinished = (match) => {
  match.setPowerCellCycles(prevCycles => prevCycles.map(cycle => {
    console.log("cycle", cycle);
    if (cycle.attainedLocation && !cycle.startTime){
      return {...cycle, startTime: match.getCurrentTime()};
    } else if (cycle.depositLocation && !cycle.endTime && !(cycle.success===null || cycle.success===undefined)){
      return {...cycle, endTime: match.getCurrentTime()}
    } else if (cycle.depositLocation && !cycle.endTime){
      return {...cycle, depositLocation: undefined, success: undefined}
    }
    return cycle
  }));
  match.saveEndedCycles();
}

export const SIDEBAR_CONFIG = [
  // ---------- PRE_MATCH Buttons ----------
  {
    phases: [PHASES.PRE_MATCH],
    id: "startMatch",
    positions: ["startMatch"],
    flexWeight: 2,
    label: (match, key) =>
      match.startingPosition < 0
        ? "Please select starting position"
        : "Start match",
    onClick: (match, key) => {
      match.setMatchStartTime(Date.now());
      match.setPhase(PHASES.AUTO);
      // match.clearUnfinished();
    },
    show: (match, key) => true,
    isDisabled: (match, key) => match.startingPosition < 0,
  },
  {
    phases: [PHASES.PRE_MATCH],
    id: GAME_LOCATIONS.PRELOAD,
    positions: [GAME_LOCATIONS.PRELOAD],
    flexWeight: 1,
    label: (match, key) => `${match.getNumPowerCellsInBot()} Preload${match.getNumPowerCellsInBot()!=1 ? "s" : ""}`,
    onClick: (match, key) => {
      let newPowerCellCycles = [...match.powerCellCycles];
      console.log(newPowerCellCycles);
      let slot = -1;
      for (let index in [1, 2, 3]) {
        if (!newPowerCellCycles[index].attainedLocation) {
          slot = index;
          break;
        }
      }
      console.log(slot);
      if (slot===-1) {
        match.setPowerCellCycles([{}, {}, {}, {}, {}]);
        return ;
      }
      newPowerCellCycles[slot] = { attainedLocation: GAME_LOCATIONS.PRELOAD, startTime: 0 };
      match.setPowerCellCycles(newPowerCellCycles);
      
    },
    color: (match, key) => COLORS.SUCCESS,
    show: (match, key) => true,
  },

  // ------------ AUTO Buttons -----------------
  {
    phases: [PHASES.AUTO],
    id: "goTele",
    positions: ["GO_TELE"],
    label: (match, key) => "TO TELE",
    onClick: (match, key) => {
      match.setPhase(PHASES.TELE);
    },
    color: COLORS.SUCCESS,
    show: (match, key) => !match.powerCellCycles.some(
      cycle => cycle.depositLocation != null && cycle.endTime == null
    ),
  },

  // ---------- AUTO/TELE Buttons (when not defending and hang not started) ----------
  // Power Cell Scoring Button
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    flexWeight: 2,
    id: "powerCellScoring",
    // positions: Object.keys(GAME_LOCATIONS.REEF_LEVEL).sort().reverse(),
    positions: ["SCORE", "FAIL"],
    label: (match, key) => {
      return `${key}: ${match.powerCellCycles.reduce((prevValue, cycle) => {
        if (!(cycle.startTime===null || cycle.startTime===undefined) && 
          cycle.success===(key==="SCORE") && 
          !cycle.endTime
        ){
          return prevValue + 1;
        }
        return prevValue;
      } 
      
      ,0)}`
    },
    onClick: (match, key) => {
      const newPowerCellCycles = [...match.powerCellCycles];
      let found = false;
      for (const i in match.powerCellCycles) {
        const cycle = match.powerCellCycles[i];
        if (cycle.depositLocation && (cycle.success===null || cycle.success===undefined) && !cycle.endTime){
          newPowerCellCycles[i] = {...newPowerCellCycles[i], success: key==="SCORE"};
          found = true;
          break;
        }
      }

      if (!found){
        for (const i in match.powerCellCycles) {
          if (match.powerCellCycles[i].success===(key==="SCORE")){
            newPowerCellCycles[i] = {...match.powerCellCycles[i], success: null}
          }
        }
      }

      console.log(newPowerCellCycles);

      match.setPowerCellCycles(newPowerCellCycles);
    },
    color: (match, key) => key==="SCORE" ? COLORS.SUCCESS : COLORS.ERROR,
    show: (match, key) => match.powerCellCycles.some(
      cycle => cycle.depositLocation != null && cycle.endTime == null
    ),
  },
  // Done Button
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "done",
    positions: ["DONE"],
    label: (match, key) => "Done",
    onClick: (match, key) => {
      finishUnfinished(match);
    },
    color: COLORS.CANCEL,
    show: (match, key) => match.powerCellCycles.some(
      cycle => cycle.depositLocation != null && cycle.endTime == null
    ),
  },

  //CONTROL PANEL Button
  {
    phases: [PHASES.TELE],
    id: "controlPanelActions",
    positions: [ACTIONS.CONTROL_PANEL_ROTATION, ACTIONS.CONTROL_PANEL_PRECISION],
    label: (match, key) => key === ACTIONS.CONTROL_PANEL_ROTATION ? "Rotation" : "Position",
    flexWeight: 2,
    onClick: (match, key) => {
        match.setControlPanel({ 
            ...match.controlPanel, 
            action: key, 
            endTime: match.getCurrentTime() 
        });
        match.saveEndedCycles();
    },
    color: COLORS.SUCCESS,
    show: (match, key) => match.controlPanel.startTime !== null && match.controlPanel.endTime === null
      && !match.cycles.some(cycle => cycle.type===CYCLE_TYPES.CONTROL_PANEL && cycle.action===key),
  },
  {
    phases: [PHASES.TELE],
    id: "cancelControlPanel",
    positions: ["Cancel"],
    label: (match, key) => "Cancel",
    onClick: (match, key) => {
        match.setControlPanel({ startTime: null, action: null, endTime: null });
    },
    color: COLORS.CANCEL,
    show: (match, key) => match.controlPanel.startTime !== null && match.controlPanel.endTime === null 
  },

  // ---------- HANG  ----------
  {
    phases: [PHASES.TELE],
    id: "hangOutcomes",
    positions: [HANG_RESULTS.BALANCED, HANG_RESULTS.HANG, HANG_RESULTS.FAIL],
    flexWeight: 1.5,
    label: (match, key) => key.replaceAll("_", " "),
    onClick: (match, key) => {
        match.setHang({ 
            ...match.hang,
            type: key.toLowerCase(),
            endTime: match.getCurrentTime()
        });
    },
    color: (match, key) => (key === "Fail" ? COLORS.ERROR : COLORS.SUCCESS),
    show: (match) => match.hang.startTime !== null && match.hang.endTime === null,
  },
  {
    phases: [PHASES.TELE],
    id: "cancelHang",
    positions: ["Cancel"],
    label: (match, key) => "Cancel Hang",
    onClick: (match, key) => {
        match.setHang({ startTime: null, endTime: null, type: null });
    },
    color: COLORS.CANCEL,
    show: (match) => match.hang.startTime !== null && match.hang.endTime === null,
  },

  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "defense",
    // Convert numeric keys to strings
    positions: ["1", "2", "3"],
    label: (match, key) => {
      const opponentKey = match.isScoutingRed ? `b${key}` : `r${key}`;
      // Read the opponent from match.scoutData.opponents by index
      return match.scoutData?.opponents &&
        match.scoutData?.opponents[opponentKey]
        ? `Contact ${match.scoutData?.opponents[opponentKey]}`
        : `Contact ${opponentKey}`;
    },
    onClick: (match, key) => {
      const opponentKey = match.isScoutingRed ? `b${key}` : `r${key}`;
      const oppenentRobot =
        (match.scoutData?.opponents &&
          match.scoutData?.opponents[opponentKey]) ||
        opponentKey;

      match.setContact({
        startTime: match.getCurrentTime(),
        contactRobot: oppenentRobot,
      });
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) =>
      match.isDefending() && match.contact.startTime == null,
  },
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "stopDefending",
    positions: ["stopDefending"],
    label: (match, key) => "Finish Contact",
    onClick: (match, key) => {
      match.setContact({ ...match.contact, endTime: match.getCurrentTime() });
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) => match.contact.startTime != null,
  },
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: ["countPin"],
    label: (match, key) => "Pin count: " + (match.contact.pinCount || 0),
    onClick: (match, key) => {
      match.setContact({
        ...match.contact,
        pinCount: (match.contact.pinCount || 0) + 1,
      });
    },
    color: (match, key) => COLORS.SUCCESS,
    sx: {},
    show: (match, key) => match.contact.startTime != null,
  },

  {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: ["countFoul"],
    label: (match, key) => "Foul count: " + (match.contact.foulCount || 0),
    onClick: (match, key) => {
      match.setContact({
        ...match.contact,
        foulCount: (match.contact.foulCount || 0) + 1,
      });
    },
    color: (match, key) => COLORS.WARNING,
    sx: {},
    show: (match, key) => match.contact.startTime != null,
  },

  // ---------- TELE Hang Buttons (when hang has started) ----------
  // When hang.height is null: show hang level buttons and a cancel button.
  {
    phases: [PHASES.TELE],
    id: "hangLevel",
    positions: [HANG_RESULTS.SHALLOW, HANG_RESULTS.DEEP],
    label: (match, key) => `${key}`, // or customize label as needed
    onClick: (match, key) => {
      match.setHang({ ...match.hang, cageType: key });
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) =>
      match.hang?.startTime != null &&
      match.hang?.cageType == null &&
      match.hang?.cageLocation != null,
  },

  // When hang.height is set: show hang state buttons and a cancel button.
  {
    phases: [PHASES.TELE],
    positions: ["Hang Complete"],
    label: (match, key) => `${key}`,
    onClick: (match, key) => {
      match.setHang({ ...match.hang, endTime: match.getCurrentTime() });
    },
    // color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) =>
      match.hang?.startTime != null && match.hang.cageType != null,
  },
  {
    phases: [PHASES.POST_MATCH],
    positions: ["post_match"],
    label: (match, key) => "Submit",
    onClick: (match, key) => {
      match.setSubmitting(true)
    },
    show: (match, key) => !match.submitting,
    isDisabled: (match, key) =>
      match.isUnfinished(match.hang.startTime, match.hang.result),
  },
  {
    phases: [PHASES.POST_MATCH],
    positions: ["post_match"],
    label: (match, key) => "Confirm",
    onClick: (match, key) => {
      const saveCycles =
        match.hang.result == null
          ? match.cycles
          : [...match.cycles, match.getWritableCycle(CYCLE_TYPES.HANG)];

      saveMatch(
        {
          reportId: match.scoutData.reportId,
          matchStartTime: match.matchStartTime,
          robot: match.scoutData.teamNumber,
          scoutId: match.userToken.id,
          scoutName: match.userToken.username,
          cycles: saveCycles,
          endgame: match.endgame,
        },
        {
          eventKey: match.searchParams.get("eventKey"),
          matchKey: match.searchParams.get("matchKey"),
          station: match.searchParams.get("station"),
        },
        match.userToken,
        /* submitAfter= */ true,
        (response) => {
          console.log("successfully saved:", response);
          match.setScoutData(null);
          match.setSearchParams({
            eventKey: match.searchParams.get("eventKey"),
            matchKey: match.scoutData.nextMatchKey,
            station: match.searchParams.get("station"),
          });
          window.location.href = window.location.href
        }
      );
    },
    isDisabled: (match, key) => false,
    show: (match, key) => match.submitting,
  },
  {
    phases: [PHASES.POST_MATCH],
    positions: ["post_match"],
    label: (match, key) => "Cancel",
    onClick: (match, key) => {
      match.setSubmitting(false)
    },
    show: (match, key) => match.submitting,
    isDisabled: (match, key) => false
  },
];
