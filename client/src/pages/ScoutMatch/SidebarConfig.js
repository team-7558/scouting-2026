import {
  PHASES,
  COLORS,
  CYCLE_TYPES,
  BPS_RANGES,
  HANG_LEVELS,
} from "./Constants";
import { saveMatch } from "../../storage/MatchStorageManager";

const exists = (val) => {
  return val !== null && val !== undefined
}


export const SIDEBAR_CONFIG = [
  // ---------- PRE_MATCH ----------
  {
    phases: [PHASES.PRE_MATCH],
    id: "startMatch",
    positions: ["startMatch"],
    flexWeight: 2,
    label: (match) => match.startingPosition < 0 ? "Select Starting Position" : "Start Match",
    onClick: (match) => {
      match.setMatchStartTime(Date.now());
      match.setPhase(PHASES.AUTO);
      match.setCycles([{
        type: CYCLE_TYPES.AUTO_MOVEMENT,
        startTime: 0,
        location: match.startingPosition,
        phase: PHASES.AUTO,
      }])
    },
    show: () => true,
    isDisabled: (match) => match.startingPosition < 0,
  },

  // ------------ CYCLE/INTAKE/SNOWBALLING Stop --------------
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "stopCycleIntakeSnowball",
    positions: ["stop"],
    flexWeight: 2,
    label: (match) => `Stop ${match.activeCycle.type.toLowerCase()}ing`,
    show: (match, key) => exists(match.activeCycle.startTime) && !exists(match.activeCycle.endTime) &&
      ([CYCLE_TYPES.INTAKE, CYCLE_TYPES.SHOOTING, CYCLE_TYPES.SNOWBALL].includes(match.activeCycle.type)),
    onClick: (match, key) => {
      match.setActiveCycle({
        ...match.activeCycle,
        endTime: match.getCurrentTime(),
      })
    }
  },

  // ------------ CYCLE/INTAKE/SNOWBALLING Rate --------------
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "stopCycleIntakeSnowball",
    positions: Object.keys(BPS_RANGES),
    flexWeight: 2,
    label: (match, key) => BPS_RANGES[key].label,
    show: (match, key) => exists(match.activeCycle.endTime) && !exists(match.activeCycle.rate) &&
      ([CYCLE_TYPES.INTAKE, CYCLE_TYPES.SHOOTING, CYCLE_TYPES.SNOWBALL].includes(match.activeCycle.type)),
    onClick: (match, key) => {
      match.setActiveCycle({
        ...match.activeCycle,
        rate: BPS_RANGES[key].value,
      })
    }
  },

  // ------------- HANG LEVEL --------------------------
  {
    phases: [PHASES.AUTO, PHASES.TELE], // Hanging is a TeleOp action
    id: "hangLevelSelection",
    // Use the HANG_LEVELS constants you just added
    positions: Object.keys(HANG_LEVELS),
    flexWeight: 1.5,
    label: (match, key) => key.replace("_", " "), // "LEVEL_1" becomes "Level 1"

    // When a level is clicked, we update the activeCycle with the selected level.
    onClick: (match, key) => {
      match.setActiveCycle(prev => ({ ...prev, location: key }));
    },
    color: () => COLORS.PRIMARY, // Use a neutral color for a multi-step process

    // This is the magic: Show only if the cycle is HANG and no level is set yet.
    show: (match) =>
      match.state.activeCycle?.type === CYCLE_TYPES.HANG && !match.state.activeCycle.level,
  },

  // --------------- HANG SUCCESS ------------------------
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "hangOutcomeSelection",
    positions: ["SUCCESS", "FAIL"],
    flexWeight: 2,
    label: (match, key) => key,

    // This is the final step. We finalize the cycle and save it.
    onClick: (match, key) => {
      // Clear the activeCycle to return the sidebar to its normal state.
      match.setActiveCycle({
        ...match.activeCycle,
        success: key === "SUCCESS",
        endTime: match.getCurrentTime(),
      });
    },

    // Use green for success and red for failure.
    color: (match, key) => key === "SUCCESS" ? COLORS.SUCCESS : COLORS.FAIL,

    // This is the magic: Show only if the cycle is HANG and a level IS set.
    show: (match) =>
      match.activeCycle?.type === CYCLE_TYPES.HANG && !!match.activeCycle.location && !exists(match.activeCycle.endTime)
  },

  // ---------- DEFENSE & CONTACT (Contextual) ----------
  {
    phases: [PHASES.TELE],
    id: "contactCounters",
    positions: ["pin", "foul"],
    flexWeight: 1,
    label: (match, key) => `${key.charAt(0).toUpperCase() + key.slice(1)}s: ${match.activeCycle[`${key}Count`] || 0}`,
    onClick: (match, key) => {
      match.setActiveCycle(prev => ({ ...prev, [`${key}Count`]: (prev[`${key}Count`] || 0) + 1 }));
    },
    color: (match, key) => key === 'pin' ? COLORS.SUCCESS : COLORS.FAIL,
    show: (match) => match.activeCycle?.type === CYCLE_TYPES.CONTACT && exists(match.activeCycle.startTime) && !exists(match.activeCycle.endTime),
  },

  {
    phases: [PHASES.TELE],
    id: "contactEnd",
    positions: ["endContact"],
    flexWeight: 2,
    label: () => "End Contact Cycle",
    onClick: (match) => {
      match.setActiveCycle(prev => ({ ...prev, endTime: match.getCurrentTime() }));
    },
    color: () => COLORS.ACTIVE,
    show: (match) => match.activeCycle?.type === CYCLE_TYPES.CONTACT && exists(match.activeCycle.startTime) && !exists(match.activeCycle.endTime),
  },

  // Generic CANCEL button for ANY active cycle (except Auto movement which is instant)
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "cancelActiveCycle",
    positions: ["Cancel"],
    flexWeight: 0.5,
    label: () => "Cancel",
    onClick: (match) => match.setActiveCycle({}),
    color: () => COLORS.UNDO,
    show: (match) => exists(match.activeCycle.startTime) && !exists(match.activeCycle.endTime),
  },

  {
    phases: [PHASES.POST_MATCH],
    id: "submitMatchNetwork",
    positions: ["submitNet"],
    flexWeight: 2,

    label: () => "Submit Match (Network)",

    onClick: (match) => {
      saveMatch(
        {
          reportId: match.scoutData.reportId,
          matchStartTime: match.matchStartTime,
          robot: match.scoutData.teamNumber,
          scoutId: match.userToken.id,
          scoutName: match.userToken.username,
          cycles: match.cycles,
          endgame: match.endgame,
        },
        match.searchParams,
        match.userToken,
        true, // submitAfter = true → NETWORK
        (response) => {
          if (response?.status === 200) {
            alert("Match submitted successfully!");
            match.setScoutData(null);
            match.setSearchParams({
              eventKey: match.searchParams.get("eventKey"),
              matchKey: match.scoutData.nextMatchKey,
              station: match.searchParams.get("station"),
            });
            window.location.href = window.location.href;
          } else {
            alert("Submission failed — saved locally for resync.");
          }
        }
      );
    },

    color: () => COLORS.SUCCESS,
    show: () => true
  },
  {
    phases: [PHASES.POST_MATCH],
    id: "submitMatchQR",
    positions: ["submitQR"],
    flexWeight: 1.5,

    label: () => "Submit Match (QR)",

    onClick: (match) => {

      const matchData = {
        reportId: match.scoutData.reportId,
        matchStartTime: match.matchStartTime,
        robot: match.scoutData.teamNumber,
        scoutId: match.userToken.id,
        scoutName: match.userToken.username,
        cycles: match.cycles,
        endgame: match.endgame,
      };
      const params = Object.fromEntries(match.searchParams);

      console.log(matchData);
      console.log(params);

      saveMatch(
        { ...matchData, ...params },
        match.searchParams,
        match.userToken,
        false // submitAfter = false → QR MODE
      );
    },

    color: () => COLORS.INFO,
    show: () => true
  }
];