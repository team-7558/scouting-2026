import { BinaryDTO } from "../../storage/BinaryDTO";
import { saveMatch } from "../../storage/MatchStorageManager";
import { MATCH_SCHEMA, prepareMatchForDTO } from "../../storage/ScoutingSchema";
import {
  COLORS,
  CYCLE_TYPES,
  HANG_LEVELS,
  PHASES,
  AUTO_MAX_TIME
} from "./Constants";

import {
  Button,
  Box,
  Typography
} from "@mui/material";

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
      match.setPhase(PHASES.AUTO, `Start Match`);
      match.setCycles([{
        type: CYCLE_TYPES.AUTO_MOVEMENT,
        startTime: 0,
        location: match.startingPosition,
        phase: PHASES.AUTO,
      }]);
    },
    show: () => true,
    isDisabled: (match) => match.startingPosition < 0,
  },

  // ---------- PHASE CHANGER ---------------------------
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: ["phaseChanger"],
    show: (match) => true,
    id: "phaseChanger",
    label: (match) => match.phase === PHASES.AUTO ? "To TeleOp" : "To Endgame",
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

  {
    phases: [PHASES.TELE],
    // Positioned same as PHASE_CHANGER
    positions: ["DEFENSE"],
    label: (match, key) => match.isDefending() ? "End Defend/Steal" : "Start Defense",
    color: (match) => match.isDefending() ? COLORS.INTAKE : COLORS.HANG_DEFENSE,
    show: (match) => true,
    onClick: (match, key, currentTime) => {
      if (match.isDefending()) {
        match.setDefenseCycle(
          prev => { return { ...prev.defenseCycle, endTime: currentTime } },
          `End Defense`); // End defense
      } else {
        match.setDefenseCycle({
          type: CYCLE_TYPES.DEFENSE,
          phase: match.phase,
          startTime: currentTime,
        }, `Start Defense`);
      }
    },
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
            match.showAlert("Match submitted successfully!");
          } else {
            match.showAlert("Submission failed." + response.data.message);
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
    label: () => "Submit Match (QR)",
    onClick: (match) => {
      // 1. Use the helper function to clean the spaghetti
      const matchToPack = prepareMatchForDTO(match);

      // 2. Pack it using the Master Schema
      const packer = new BinaryDTO(MATCH_SCHEMA);
      const qrPayload = packer.pack(matchToPack);

      // 3. Save it
      saveMatch(
        matchToPack,
        match.searchParams,
        match.userToken,
        false,
        null,
        qrPayload
      );
      console.log("Match: ", match);
      console.log("Packaged Match: ", matchToPack);
      console.log(`Binary Payload: ${qrPayload}`);
    },
    color: () => COLORS.INFO,
    show: () => true
  },
  {
    phases: [PHASES.POST_MATCH],
    id: "nextMatch",
    positions: ["nextMatch"],
    flexWeight: 1.5,

    label: () => "Next Match",

    onClick: (match) => {
      const currentMatch = match.searchParams.get("matchKey") || "qm1";
      const pattern = /\d+|\D+/g
      const matches = currentMatch.match(pattern);
      const nextMatch = matches[0] + ((Number(matches[1]) || 0) + 1);
      console.log(currentMatch, matches, nextMatch);
      match.setSearchParams(prev => {
        prev.set("matchKey", nextMatch);
        return prev;
      });

      match.reset();
      match.setScoutData({
        ...match.scoutData,
        teamNumber: null,
      })
    },

    color: () => COLORS.INFO,
    show: () => true
  }
];

export const OVERLAY_CONFIG = [
  //hang
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    showFunction: (match) => match.activeCycle.type===CYCLE_TYPES.HANG,
    title: "HANG",
    handleDone: (content, match, currentTime) => {
      console.log("abcdefg")
      match.setActiveCycle({
        ...match.activeCycle,
        location: content.level || HANG_LEVELS.LEVEL_1,
        success: content.success
      }, "Hang Cycle");
    },
    handleClose: (match) => {
      console.log("abcdefghij");
      match.setActiveCycle({
        startTime: null,
        phase: null,
        type: null,
        success: null,
        location: null,
      }, "Cancel Hang Cycle")
    },
    content: (match) => [
      match.phase===PHASES.TELE && {
        type: "buttonGroup",
        id: "level",
        label: "Level",
        options: Object.keys(HANG_LEVELS).map((level, i) => ({
          value: level,
          label: `Level ${i+1}`
        }))
      },
      {
        type: "buttonGroup",
        id: "success",
        label: "Success",
        options: [
          {
            label: "Success",
            value: true,
            isDefault: true,
            sx: {
              backgroundColor: "#00d68f",
              color: "black"
            }
          }, 
          {
            label: "Fail",
            value: false,
            sx: {
              backgroundColor: "#ff5757",
              color: "black"
            }
          }
        ]
      }
    ].filter(Boolean)
  },

  //feed
  // FEED
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    // Defensive check just in case!
    showFunction: (match) => !!match.activeCycle.type && match.activeCycle.type === CYCLE_TYPES.FEED,
    title: "FEEDING (FERRY)",
    handleDone: (content, match, currentTime) => {
      // If they didn't click anything, it defaults to 0
      const count = parseInt(content.feedCount) || 0;
      
      match.setActiveCycle({
        ...match.activeCycle,
        count: count,
        endTime: currentTime 
      }, `Feed Cycle (${count} balls)`);
    },
    handleClose: (match) => {
      // Cancel completely
      match.setActiveCycle({
        startTime: null,
        phase: null,
        type: null,
        count: null
      });
    },
    content: (match) => [
      {
        type: "counter", 
        id: "feedCount",
        label: "Balls Fed",
        defaultValue: 0
      }
    ]
  },

  //CONTACT
  {
    phases: [PHASES.AUTO, PHASES.TELE],
    showFunction: (match) => match.isDefending(),
    title: "DEFENSE",
    
    handleDone: (content, match, currentTime) => {
      if (match.activeCycle?.type === CYCLE_TYPES.CONTACT) {
        match.setCycles([...match.cycles, {
          ...match.activeCycle,
          endTime: currentTime,
          cycle_time: currentTime - match.activeCycle.startTime,
          pin_count: Number(content.pinCount) || 0,
          foul_count: Number(content.foulCount) || 0
        }], "End Contact & Defense");
        
        match.setActiveCycle(() => ({})); 
      }

      match.setDefenseCycle({
        ...match.defenseCycle,
        endTime: currentTime
      }, "End Defense");
    },
    
    handleClose: (match) => {
      match.setDefenseCycle(() => ({}));
      match.setActiveCycle(() => ({}));
    },
    
    content: (match) => [
      {
        id: "contactTracking",
        componentFunction: (match, currentTime, content, setContent) => {
          const pins = content.pinCount || 0;
          const fouls = content.foulCount || 0;
          const isContacting = match.activeCycle?.type === CYCLE_TYPES.CONTACT;

          const contactDuration = isContacting && match.activeCycle.startTime
            ? Math.floor((currentTime - match.activeCycle.startTime) / 1000)
            : 0;

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', width: '100%', py: 2 }}>
              
              {/* ACTION BUTTONS CONTAINER */}
              <Box sx={{ display: 'flex', width: '85%', gap: 2, justifyContent: 'center' }}>
                {!isContacting ? (
                  <Button 
                    variant="contained" 
                    color={COLORS.CONTACT} 
                    sx={{ fontSize: "2.5rem", flex: 1, height: 120, fontWeight: "bold", borderRadius: 4 }}
                    onClick={() => {
                      match.setActiveCycle({
                        type: CYCLE_TYPES.CONTACT,
                        phase: match.phase,
                        startTime: currentTime,
                      });
                    }}
                  >
                    START CONTACT
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="contained" 
                      color={COLORS.CONTACT} 
                      sx={{ fontSize: "2rem", flex: 2, height: 120, fontWeight: "bold", borderRadius: 4 }}
                      onClick={() => {
                        match.setCycles([...match.cycles, {
                          ...match.activeCycle,
                          endTime: currentTime,
                          cycle_time: currentTime - match.activeCycle.startTime,
                          pin_count: pins,
                          foul_count: fouls
                        }], "Contact Cycle");
                        
                        match.setActiveCycle(() => ({}));
                        setContent({ ...content, pinCount: 0, foulCount: 0 });
                      }}
                    >
                      END CONTACT CYCLE ({contactDuration}s)
                    </Button>

                    <Button 
                      variant="outlined" 
                      color={COLORS.CONTACT}
                      sx={{ fontSize: "2rem", flex: 1, height: 120, fontWeight: "bold", borderRadius: 4, borderWidth: 4 }}
                      onClick={() => {
                        match.setActiveCycle(() => ({}));
                        setContent({ ...content, pinCount: 0, foulCount: 0 });
                      }}
                    >
                      CANCEL
                    </Button>
                  </>
                )}
              </Box>

              {/* PIN COUNTER */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: "100%", justifyContent: "center", mt: 2 }}>
                <Typography variant="h4" sx={{ width: 150, textAlign: 'left', fontWeight: 'bold', opacity: isContacting ? 1 : 0.4 }}>
                  Pins: {pins}
                </Typography>
                <Button disabled={!isContacting} variant="contained" color="error" sx={{ fontSize: "2rem", width: 80, height: 70 }} onClick={() => setContent({ ...content, pinCount: Math.max(0, pins - 1) })}>-1</Button>
                <Button disabled={!isContacting} variant="contained" color="success" sx={{ fontSize: "2rem", width: 80, height: 70 }} onClick={() => setContent({ ...content, pinCount: pins + 1 })}>+1</Button>
              </Box>

              {/* FOUL COUNTER */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: "100%", justifyContent: "center" }}>
                <Typography variant="h4" sx={{ width: 150, textAlign: 'left', fontWeight: 'bold', opacity: isContacting ? 1 : 0.4 }}>
                  Fouls: {fouls}
                </Typography>
                <Button disabled={!isContacting} variant="contained" color="error" sx={{ fontSize: "2rem", width: 80, height: 70 }} onClick={() => setContent({ ...content, foulCount: Math.max(0, fouls - 1) })}>-1</Button>
                <Button disabled={!isContacting} variant="contained" color="success" sx={{ fontSize: "2rem", width: 80, height: 70 }} onClick={() => setContent({ ...content, foulCount: fouls + 1 })}>+1</Button>
              </Box>

              {/* HISTORY CONTROLS (UNDO / REDO) */}
              <Box sx={{ display: 'flex', width: '85%', gap: 2, justifyContent: 'center', mt: 2, pt: 3, borderTop: '1px solid #444' }}>
                <Button 
                  variant="contained" 
                  disabled={!match.canUndo()}
                  onClick={() => match.undo()}
                  sx={{ flex: 1, height: 60, fontSize: "1.2rem", bgcolor: "#555", "&:hover": { bgcolor: "#666" } }}
                >
                  UNDO {match.canUndo() ? `(${match.lastUndoMessage})` : ""}
                </Button>
                
                <Button 
                  variant="contained" 
                  disabled={!match.canRedo()}
                  onClick={() => match.redo()}
                  sx={{ flex: 1, height: 60, fontSize: "1.2rem", bgcolor: "#555", "&:hover": { bgcolor: "#666" } }}
                >
                  REDO {match.canRedo() ? `(${match.redoMessage})` : ""}
                </Button>
              </Box>

            </Box>
          );
        }
      }
    ]
  }
]