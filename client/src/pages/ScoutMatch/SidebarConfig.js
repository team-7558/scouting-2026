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
      match.clearUnfinished();
    },
    show: (match, key) => true,
    isDisabled: (match, key) => match.startingPosition < 0,
  },
  {
    phases: [PHASES.PRE_MATCH],
    id: GAME_LOCATIONS.PRELOAD,
    positions: [GAME_LOCATIONS.PRELOAD],
    flexWeight: 1,
    label: (match, key) => (match.hasCoral() ? "Has preload" : "No Preload"),
    onClick: (match, key) => {
      match.setCoral(
        match.hasCoral()
          ? {}
          : { attainedLocation: GAME_LOCATIONS.PRELOAD, startTime: 0 }
      );
    },
    color: (match, key) => (match.hasCoral() ? COLORS.SUCCESS : COLORS.PENDING),
    show: (match, key) => true,
  },

  // ---------- AUTO/TELE Buttons (when not defending and hang not started) ----------
  // Reef Scoring Buttons (multiple buttons using positions)
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "reefScoring",
    // Convert the keys of GAME_LOCATIONS.REEF_LEVEL into an array.
    positions: Object.keys(GAME_LOCATIONS.REEF_LEVEL).sort().reverse(),
    label: (match, key) => `L${key}`,
    onClick: (match, level) => {
      match.setCoral({
        ...match.coral,
        depositLocation: match.coral.depositLocation + `_L${level}`,
        endTime: match.getCurrentTime(),
      });
    },
    color: (match, key) => COLORS.CORALDROPOFF,
    show: (match, key) =>
      match.hasCoral() &&
      Object.values(GAME_LOCATIONS.REEF).includes(match.coral.depositLocation),
  },

  // PICKUP_CORAL Button
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "PICKUP_CORAL",
    positions: ["pickupCoral"],
    label: (match, key) => "PICKUP CORAL",
    tasks: [createTask(ACTIONS.FINISH, GAME_PIECES.CORAL)],
    color: (match, key) => COLORS.CORALPICKUP,
    sx: {},
    show: (match, key) =>
      match.isUnfinished(match.coral.attainedLocation, match.coral.startTime),
  },
  // DROP_CORAL Button
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "DROP_CORAL",
    positions: ["dropCoral"],
    label: (match, key) => "DROP CORAL",
    tasks: [createTask(ACTIONS.DROP, GAME_PIECES.CORAL)],
    color: (match, key) => COLORS.WARNING,
    sx: {},
    show: (match, key) =>
      match.isUnfinished(match.coral.depositLocation, match.coral.endTime),
  },

  // PICKUP_ALGAE Button
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "PICKUP_ALGAE",
    positions: ["pickupAlgae"],
    label: (match, key) => "PICKUP ALGAE",
    tasks: [createTask(ACTIONS.FINISH, GAME_PIECES.ALGAE)],
    color: (match, key) => COLORS.ALGAEPICKUP,
    sx: {},
    show: (match, key) =>
      match.isUnfinished(match.algae.attainedLocation, match.algae.startTime),
  },
  // Score Processor/Net Menu Button (conditionally shown)
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "scoreAlgae",
    positions: ["scoreAlgae"],
    label: (match, key) => `Score ${match.algae.depositLocation}`,
    tasks: [createTask(ACTIONS.FINISH, GAME_PIECES.ALGAE)],
    color: (match, key) => COLORS.ALGAEDROPOFF,
    sx: {},
    show: (match, key) =>
      match.algae.depositLocation === GAME_LOCATIONS.PROCESSOR ||
      match.algae.depositLocation === GAME_LOCATIONS.NET,
  },
  // DROP_ALGAE Button
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "DROP_ALGAE",
    positions: ["dropAlgae"],
    label: (match, key) => "DROP ALGAE",
    tasks: [createTask(ACTIONS.DROP, GAME_PIECES.ALGAE)],
    color: (match, key) => COLORS.WARNING,
    sx: {},
    show: (match, key) =>
      match.isUnfinished(match.algae.depositLocation, match.algae.endTime),
  },

  // ---------- DEFENSE Buttons (for AUTO/TELE when defending) ----------
  // Note: In your original code, the defense buttons were generated dynamically from scoutData.opponents.
  // Here we include a static "stopDefending" button.

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
        match.userToken
      );
    },
    isDisabled: (match, key) =>
      match.isUnfinished(match.hang.startTime, match.hang.result),
    show: (match, key) => true,
  },
  // Cancel Button
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "cancel",
    positions: ["cancel"],
    label: (match, key) => "cancel",
    onClick: (match, key) => {
      match.clearUnfinished();
    },
    color: (match, key) => COLORS.CANCEL,
    sx: {},
    show: (match, key) => match.hasUnfinished(),
  },
];
