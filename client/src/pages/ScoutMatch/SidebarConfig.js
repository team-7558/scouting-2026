import {
  PHASES,
  COLORS,
  CYCLE_TYPES,
  BPS_RANGES,
  HANG_LEVELS,
} from "./Constants";
import { saveMatch } from "../../storage/MatchStorageManager";

// Helper to start a new cycle, ensuring no other cycle is active
const startCycle = (match, cycleType) => {
  if (match.activeCycle || match.cyclePendingRate) return; // Prevent starting a new cycle if one is active/pending
  match.setActiveCycle({
    type: cycleType,
    startTime: match.getCurrentTime(),
  });
};

// Helper to stop a scoring/shuttling cycle and move it to the pending state for rate selection
const stopScoringCycle = (match) => {
  const endTime = match.getCurrentTime();
  if (match.activeCycle) {
    match.setCyclePendingRate({ ...match.activeCycle, endTime });
    match.setActiveCycle(null);
  }
};

// Helper to stop a generic cycle (like Defense)
const stopGenericCycle = (match) => {
  const endTime = match.getCurrentTime();
  if (match.activeCycle) {
    match.setCycles(prev => [...prev, { ...match.activeCycle, endTime, phase: match.phase }]);
    match.setActiveCycle(null);
  }
};


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
    },
    show: () => true,
    isDisabled: (match) => match.startingPosition < 0,
  },

  // ---------- CYCLE START BUTTONS (Scoring, Shuttling) ----------
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "startCycles",
    positions: [CYCLE_TYPES.SCORING, CYCLE_TYPES.SHUTTLING],
    label: (match, key) => `Start ${key}`,
    onClick: (match, key) => startCycle(match, key),
    color: () => COLORS.ACTIVE,
    show: (match) => !match.activeCycle && !match.cyclePendingRate && !match.hang.startTime,
  },

  // ---------- CYCLE STOP BUTTONS ----------
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "stopCycle",
    positions: ["stop"],
    label: (match) => `Stop ${match.activeCycle?.type}`,
    onClick: (match) => {
      const type = match.activeCycle?.type;
      if (type === CYCLE_TYPES.SCORING || type === CYCLE_TYPES.SHUTTLING) {
        stopScoringCycle(match);
      } else if (type === CYCLE_TYPES.DEFENSE) {
        stopGenericCycle(match);
      }
    },
    color: () => COLORS.ERROR,
    show: (match) => !!match.activeCycle,
  },

  // ---------- BPS RATE SELECTION ----------
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    id: "rateSelection",
    positions: Object.keys(BPS_RANGES),
    flexWeight: 1.5,
    label: (match, key) => BPS_RANGES[key].label,
    onClick: (match, key) => {
      const range = BPS_RANGES[key];
      const cycle = match.cyclePendingRate;
      const duration = (cycle.endTime - cycle.startTime) / 1000; // in seconds
      
      match.setCycles(prev => [...prev, {
        ...cycle,
        phase: match.phase,
        bpsMin: range.min,
        bpsMax: range.max,
        ballCountMin: Math.round(duration * range.min),
        ballCountMax: Math.round(duration * range.max),
      }]);
      match.setCyclePendingRate(null); // Clear pending cycle
    },
    color: () => COLORS.SUCCESS,
    show: (match) => !!match.cyclePendingRate,
  },

  // ---------- HANG ----------
  {
    phases: [PHASES.TELE],
    id: "hangLevels",
    positions: Object.keys(HANG_LEVELS).filter(l => l !== 'NONE'),
    flexWeight: 1.5,
    label: (match, key) => key.replace("_", " "),
    onClick: (match, key) => {
        match.setHang({ ...match.hang, level: HANG_LEVELS[key], endTime: match.getCurrentTime() });
        match.saveEndedCycles();
    },
    color: (match, key) => (key === "FAIL" ? COLORS.ERROR : COLORS.SUCCESS),
    show: (match) => match.hang.startTime && !match.hang.endTime,
  },
  {
    phases: [PHASES.TELE],
    id: "cancelHang",
    positions: ["Cancel"],
    label: () => "Cancel Hang",
    onClick: (match) => match.setHang({ startTime: null, endTime: null, level: null }),
    color: () => COLORS.CANCEL,
    show: (match) => match.hang.startTime && !match.hang.endTime,
  },
  
  // ---------- DEFENSE & CONTACT (Contextual) ----------
  {
    phases: [PHASES.TELE],
    id: "contactToggle",
    positions: ["contact"],
    label: (match) => match.contact.startTime && !match.contact.endTime ? "Stop Contact" : "Start Contact",
    onClick: (match) => {
        if (match.contact.startTime && !match.contact.endTime) { // Stop contact
            match.setContact(prev => ({ ...prev, endTime: match.getCurrentTime() }));
            match.saveEndedCycles(); // Save it immediately
        } else { // Start contact
            match.setContact({ startTime: match.getCurrentTime(), pinCount: 0, foulCount: 0 });
        }
    },
    color: (match) => match.contact.startTime && !match.contact.endTime ? COLORS.WARNING : COLORS.PENDING,
    show: (match) => match.activeCycle?.type === CYCLE_TYPES.DEFENSE,
  },
  {
    phases: [PHASES.TELE],
    id: "contactCounters",
    positions: ["pin", "foul"],
    label: (match, key) => `${key.charAt(0).toUpperCase() + key.slice(1)}s: ${match.contact[`${key}Count`]}`,
    onClick: (match, key) => {
      match.setContact(prev => ({...prev, [`${key}Count`]: (prev[`${key}Count`] || 0) + 1 }));
    },
    color: (match, key) => key === 'pin' ? COLORS.SUCCESS : COLORS.WARNING,
    show: (match) => match.activeCycle?.type === CYCLE_TYPES.DEFENSE && match.contact.startTime && !match.contact.endTime,
  },

  // ---------- POST_MATCH ----------
  {
    phases: [PHASES.POST_MATCH],
    positions: ["submit"],
    label: () => "Submit",
    onClick: (match) => match.setSubmitting(true),
    show: (match) => !match.submitting,
  },
  {
    phases: [PHASES.POST_MATCH],
    positions: ["QR Code", "DATA"],
    label: (match, key) => key,
    onClick: (match, key) => {
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
        { 
          eventKey: match.searchParams.get("eventKey"),
          matchKey: match.searchParams.get("matchKey"),
          station: match.searchParams.get("station"),
        },
        match.userToken,
        key === "DATA", // submitAfter
        (response) => { 
          // success callback to go to next match
          match.setScoutData(null);
          match.setSearchParams({
            eventKey: match.searchParams.get("eventKey"),
            matchKey: match.scoutData.nextMatchKey,
            station: match.searchParams.get("station"),
          });
          window.location.reload();
         }
      );
    },
    show: (match) => match.submitting,
  },
  {
    phases: [PHASES.POST_MATCH],
    positions: ["cancelSubmit"],
    label: () => "Cancel",
    onClick: (match) => match.setSubmitting(false),
    show: (match) => match.submitting,
  }
];