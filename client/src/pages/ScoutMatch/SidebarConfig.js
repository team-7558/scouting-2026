// SidebarConfig.js
import { PHASES, COLORS, GAME_LOCATIONS } from "./Constants";

export const SIDEBAR_CONFIG = [
  // ---------- PRE_MATCH Buttons ----------
  {
    phases: [PHASES.PRE_MATCH],
    id: "startMatch",
    positions: { startMatch: true },
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
    id: "preload",
    positions: { preload: true },
    flexWeight: 1,
    label: (match, key) => (match.hasCoral() ? "Has preload" : "No Preload"),
    onClick: (match, key) => {
      match.setCoral(
        match.hasCoral() ? {} : { attainedLocation: "preload", attainedTime: 0 }
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
    // Expect GAME_LOCATIONS.REEF_LEVEL to be an object whose keys (e.g., "1", "2", "3") are unique.
    positions: GAME_LOCATIONS.REEF_LEVEL,
    label: (match, level) => `L${level}`,
    onClick: (match, level) => {
      match.updateCoral({
        ...match.coral,
        depositLocation: match.coral.depositLocation + `_L${level}`,
        depositTime: match.currentTime,
      });
      if (!match.hasAlgae()) {
        match.updateAlgae({});
      }
    },
    color: (match, level) => COLORS.CORALDROPOFF,
    sx: {},
    show: (match, level) =>
      match.hasCoral() &&
      Object.values(GAME_LOCATIONS.REEF).includes(match.coral.depositLocation),
  },
  // DROP_CORAL Button
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "DROP_CORAL",
    positions: { dropCoral: true },
    label: (match, key) => "DROP CORAL",
    onClick: (match, key) => {
      match.updateCoral({ ...match.coral, depositTime: match.currentTime });
    },
    color: (match, key) => COLORS.DROP,
    sx: {},
    show: (match, key) =>
      match.isUnfinished(match.coral.depositLocation, match.coral.depositTime),
  },
  // PICKUP_ALGAE Button
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "PICKUP_ALGAE",
    positions: { pickupAlgae: true },
    label: (match, key) => "PICKUP ALGAE",
    onClick: (match, key) => {
      match.updateAlgae({ ...match.algae, attainedTime: match.currentTime });
    },
    color: (match, key) => COLORS.ALGAEPICKUP,
    sx: {},
    show: (match, key) =>
      match.isUnfinished(
        match.algae.attainedLocation,
        match.algae.attainedTime
      ),
  },
  // PICKUP_CORAL Button
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "PICKUP_CORAL",
    positions: { pickupCoral: true },
    label: (match, key) => "PICKUP CORAL",
    onClick: (match, key) => {
      match.updateCoral({ ...match.coral, attainedTime: match.currentTime });
    },
    color: (match, key) => COLORS.CORALPICKUP,
    sx: {},
    show: (match, key) =>
      match.isUnfinished(
        match.coral.attainedLocation,
        match.coral.attainedTime
      ),
  },
  // Score Processor/Net Menu Button (conditionally shown)
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "scoreProcessor",
    positions: { scoreProcessor: true },
    label: (match, key) => `Score ${match.algae.depositLocation}`,
    onClick: (match, key) => {
      match.updateAlgae({ ...match.algae, depositTime: match.currentTime });
    },
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
    positions: { dropAlgae: true },
    label: (match, key) => "DROP ALGAE",
    onClick: (match, key) => {
      match.updateAlgae({ ...match.algae, depositTime: match.currentTime });
    },
    color: (match, key) => COLORS.DROP,
    sx: {},
    show: (match, key) =>
      match.isUnfinished(match.algae.depositLocation, match.algae.depositTime),
  },
  // Cancel Button
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "cancel",
    positions: { cancel: true },
    label: (match, key) => "cancel",
    onClick: (match, key) => {
      match.clearUnfinished();
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) => match.hasUnfinished(),
  },

  // ---------- DEFENSE Buttons (for AUTO/TELE when defending) ----------
  // Note: In your original code, the defense buttons were generated dynamically from scoutData.opponents.
  // Here we include a static "stopDefending" button.

  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "defense",
    positions: { 1: true, 2: true, 3: true },
    label: (match, key) => {
      const opponentKey = match.isScoutingRed ? `b${key}` : `r${key}`;
      // Read the opponent from match.scoutData.opponents by index
      return match.scoutData?.opponents &&
        match.scoutData?.opponents[opponentKey]
        ? `${match.scoutData?.opponents[opponentKey]}`
        : "Opponent";
    },
    onClick: (match, key) => {
      const opponentKey = match.isScoutingRed ? `b${key}` : `r${key}`;
      if (
        match.scoutData?.opponents &&
        match.scoutData?.opponents[opponentKey]
      ) {
        const opponent = match.scoutData?.opponents[opponentKey];
        match.setDefense({
          startTime: match.currentTime,
          defendingTeam: opponent,
          endTime: null,
        });
      }
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) =>
      match.isDefending && match.defense.defendingTeam == null,
  },
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "stopDefending",
    positions: { stopDefending: true },
    label: (match, key) => "STOP DEFENDING",
    onClick: (match, key) => {
      match.setDefense({ ...match.defense, endTime: match.currentTime });
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) => match.defense.defendingTeam != null,
  },

  // ---------- TELE Hang Buttons (when hang has started) ----------
  // When hang.height is null: show hang level buttons and a cancel button.
  {
    phases: [PHASES.TELE],
    id: "hangLevel",
    positions: GAME_LOCATIONS.HANG_LEVEL, // keys represent available levels
    label: (match, key) => `${key}`, // or customize label as needed
    onClick: (match, key) => {
      match.setHang({ ...match.hang, height: key });
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) =>
      match.hang && match.hang.startTime != null && match.hang.height == null,
  },
  {
    phases: [PHASES.TELE],
    id: "cancelHang",
    positions: { cancelHang: true },
    label: (match, key) => "CANCEL",
    onClick: (match, key) => {
      match.setHang({
        startTime: null,
        endTime: null,
        position: null,
        depth: null,
        succeeded: false,
      });
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) =>
      match.hang && match.hang.startTime != null && match.hang.height == null,
  },
  // When hang.height is set: show hang state buttons and a cancel button.
  {
    phases: [PHASES.TELE],
    id: "hangState",
    positions: GAME_LOCATIONS.HANG_STATE, // keys represent hang states
    label: (match, key) => `${key}`,
    onClick: (match, key) => {
      match.setHang({
        ...match.hang,
        succeeded: key === GAME_LOCATIONS.HANG_STATE.SUCCEED,
        endTime: match.currentTime,
      });
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) =>
      match.hang && match.hang.startTime != null && match.hang.height != null,
  },
  {
    phases: [PHASES.TELE],
    id: "cancelHangState",
    positions: { cancelHangState: true },
    label: (match, key) => "CANCEL",
    onClick: (match, key) => {
      match.setHang({
        startTime: null,
        endTime: null,
        position: null,
        depth: null,
        succeeded: false,
      });
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) =>
      match.hang && match.hang.startTime != null && match.hang.height != null,
  },

  // ---------- POST_MATCH Buttons ----------
  {
    phases: [PHASES.POST_MATCH],
    id: "disabled",
    positions: { disabled: true },
    label: (match, key) => "DISABLED?",
    onClick: (match, key) => {},
    color: (match, key) => COLORS.PRIMARY,
    sx: {},
    show: (match, key) => true,
  },
  // Disabled Menu: two buttons ("no" and "yes")
  {
    phases: [PHASES.POST_MATCH],
    id: "disabledMenu",
    positions: { noDisabledMenu: true, yesDisabledMenu: true },
    label: (match, key) => (key === "noDisabledMenu" ? "no" : "yes"),
    onClick: (match, key) => {
      const value = key === "noDisabledMenu" ? "no" : "yes";
      match.setEndgame({ ...match.endgame, disabled: value === "yes" });
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) => true,
  },
  // Driver Skill Label
  {
    phases: [PHASES.POST_MATCH],
    id: "driverSkillLabel",
    positions: { driverSkillLabel: true },
    label: (match, key) => "Driver Skill",
    onClick: (match, key) => {},
    color: (match, key) => COLORS.PRIMARY,
    sx: {},
    show: (match, key) => true,
  },
  // Driver Skill Buttons
  {
    phases: [PHASES.POST_MATCH],
    id: "driverSkill",
    positions: {
      driverSkill0: true,
      driverSkill1: true,
      driverSkill2: true,
      driverSkill3: true,
      driverSkill4: true,
      driverSkill5: true,
      driverSkillNA: true,
    },
    label: (match, key) => {
      const mapping = {
        driverSkill0: 0,
        driverSkill1: 1,
        driverSkill2: 2,
        driverSkill3: 3,
        driverSkill4: 4,
        driverSkill5: 5,
        driverSkillNA: "N/A",
      };
      return mapping[key];
    },
    onClick: (match, key) => {
      const mapping = {
        driverSkill0: 0,
        driverSkill1: 1,
        driverSkill2: 2,
        driverSkill3: 3,
        driverSkill4: 4,
        driverSkill5: 5,
        driverSkillNA: "N/A",
      };
      match.setEndgame({ ...match.endgame, driverSkill: mapping[key] });
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) => true,
  },
  // Defense Skill Label
  {
    phases: [PHASES.POST_MATCH],
    id: "defenseSkillLabel",
    positions: { defenseSkillLabel: true },
    label: (match, key) => "Defense Skill",
    onClick: (match, key) => {},
    color: (match, key) => COLORS.PRIMARY,
    sx: {},
    show: (match, key) => true,
  },
  // Defense Skill Buttons
  {
    phases: [PHASES.POST_MATCH],
    id: "defenseSkill",
    positions: {
      defenseSkill0: true,
      defenseSkill1: true,
      defenseSkill2: true,
      defenseSkill3: true,
      defenseSkill4: true,
      defenseSkill5: true,
      defenseSkillNA: true,
    },
    label: (match, key) => {
      const mapping = {
        defenseSkill0: 0,
        defenseSkill1: 1,
        defenseSkill2: 2,
        defenseSkill3: 3,
        defenseSkill4: 4,
        defenseSkill5: 5,
        defenseSkillNA: "N/A",
      };
      return mapping[key];
    },
    onClick: (match, key) => {
      const mapping = {
        defenseSkill0: 0,
        defenseSkill1: 1,
        defenseSkill2: 2,
        defenseSkill3: 3,
        defenseSkill4: 4,
        defenseSkill5: 5,
        defenseSkillNA: "N/A",
      };
      match.setEndgame({ ...match.endgame, defenseSkill: mapping[key] });
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) => true,
  },
  // Role Label
  {
    phases: [PHASES.POST_MATCH],
    id: "roleLabel",
    positions: { roleLabel: true },
    label: (match, key) => "Role",
    onClick: (match, key) => {},
    color: (match, key) => COLORS.PRIMARY,
    sx: {},
    show: (match, key) => true,
  },
  // Role Buttons
  {
    phases: [PHASES.POST_MATCH],
    id: "role",
    positions: {
      roleNA: true,
      roleDefense: true,
      roleCoralCycle: true,
      roleAlgaeCycle: true,
    },
    label: (match, key) => {
      const mapping = {
        roleNA: "N/A",
        roleDefense: "Defense",
        roleCoralCycle: "Coral Cycle",
        roleAlgaeCycle: "Algae Cycle",
      };
      return mapping[key];
    },
    onClick: (match, key) => {
      const mapping = {
        roleNA: "N/A",
        roleDefense: "Defense",
        roleCoralCycle: "Coral Cycle",
        roleAlgaeCycle: "Algae Cycle",
      };
      match.setEndgame({ ...match.endgame, role: mapping[key] });
    },
    color: (match, key) => COLORS.PENDING,
    sx: {},
    show: (match, key) => true,
  },
  // Comments Button
  {
    phases: [PHASES.POST_MATCH],
    id: "comments",
    positions: { comments: true },
    label: (match, key) => "COMMENTS:",
    onClick: (match, key) => {},
    color: (match, key) => COLORS.PRIMARY,
    sx: {},
    show: (match, key) => true,
  },
];
