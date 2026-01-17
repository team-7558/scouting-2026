import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  createContext,
  useLayoutEffect,
  useCallback,
} from "react";
import { ThemeProvider } from "@mui/material/styles";
import { BlueTheme } from "./themes/BlueTheme.js";
import { RedTheme } from "./themes/RedTheme.js";
import { useSearchParams } from "react-router-dom";

import { Box, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { FieldCanvas, FieldLocalComponent } from "../FieldCanvas.js";
import FullscreenDialog from "./FullScreenDialog.js";

import Sidebar from "../Sidebar.js";

import {
  PHASES,
  COLORS,
  DRIVER_STATIONS,
  FIELD_VIRTUAL_WIDTH,
  FIELD_VIRTUAL_HEIGHT,
  PERSPECTIVE,
  CYCLE_TYPES,
  AUTO_MAX_TIME,
  TELE_MAX_TIME,
} from "./Constants.js";
import { SCOUTING_CONFIG } from "./ScoutingConfig.js";
import { getScoutMatch } from "../../requests/ApiRequests.js";
import { ImageIcon } from "./CustomFieldComponents.js";
import { SIDEBAR_CONFIG } from "./SidebarConfig.js";
import { getSignedInUser } from "../../TokenUtils.js";
import RequiredParamsDialog from "../Common/RequiredParamsDialog.js";

const { R1, R2, R3 } = DRIVER_STATIONS;
const { SCORING_TABLE_FAR } = PERSPECTIVE;

const sidebarVirtualWidth = 1100;
const virtualWidth = FIELD_VIRTUAL_WIDTH + sidebarVirtualWidth;
const virtualHeight = FIELD_VIRTUAL_HEIGHT;
const aspectRatio = 16 / 9;

const MatchContext = createContext();

// Scout Match Component
const ScoutMatch = () => {
  const [userToken, setUserToken] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchParamsError, setSearchParamsError] = useState(null);
  useEffect(() => {
    if (!userToken) {
      setUserToken(getSignedInUser());
    }
  }, []);
  
  useEffect(() => {
    if (
      !searchParams.get("eventKey") ||
      !searchParams.get("matchKey") ||
      !searchParams.get("station")
    ) {
      setSearchParamsError("Missing search params");
    } else if (
      !scoutData ||
      scoutData.matchKey !== searchParams.get("matchKey") ||
      scoutData.station !== searchParams.get("station")
    ) {
      fetchScoutMatchData();
    }
  }, [searchParams]);

  const handleMissingParamsSubmit = ({ eventKey, matchKey, station }) => {
    setSearchParams({
      eventKey: eventKey.toLowerCase(),
      matchKey: matchKey.toLowerCase(),
      station,
    });
    setSearchParamsError(null);
  };

  const eventKey = searchParams.get("eventKey");
  const matchKey = searchParams.get("matchKey");
  const driverStation = searchParams.get("station");
  const scoutPerspective = searchParams.get("perspective") || SCORING_TABLE_FAR;

  const [scoutData, setScoutData] = useState(null);
  const [matchStartTime, setMatchStartTime] = useState(null);
  
  const getCurrentTime = () => {
    if (state.phase === PHASES.POST_MATCH) {
      return TELE_MAX_TIME;
    }
    return Math.min(
      state.phase === PHASES.AUTO ? AUTO_MAX_TIME : TELE_MAX_TIME,
      matchStartTime == null ? 0 : Date.now() - matchStartTime
    );
  };
  
  const [displayTime, setDisplayTime] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ===================================================================================
  // 1. Your Custom Hook for Managing State History (Undo/Redo) - UNCHANGED
  // ===================================================================================
  const useHistoryState = (initialState) => {
    const [history, setHistory] = useState([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const state = history[currentIndex];

    function deepEqual(obj1, obj2) {
      if (obj1 === obj2) return true;
      if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) return false;
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      if (keys1.length !== keys2.length) return false;
      for (const key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
      }
      return true;
    }

    const setState = (newStateOrFn) => {
      const newState =
        saveEndedCycles(typeof newStateOrFn === "function" ? newStateOrFn(state) : newStateOrFn);
      if (deepEqual(newState, state)){
        return ;
      }
      const newHistory = history.slice(0, currentIndex + 1);
      setHistory([...newHistory, newState]);
      setCurrentIndex(newHistory.length);
    }

    const undo = useCallback(() => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); }, [currentIndex]);
    const redo = useCallback(() => { if (currentIndex < history.length - 1) setCurrentIndex(currentIndex + 1); }, [currentIndex, history.length]);
    const reset = useCallback(() => { setHistory([initialState]); setCurrentIndex(0); }, [initialState]);
    const canUndo = () => currentIndex > 0;
    const canRedo = () => currentIndex < history.length - 1;

    return { state, setState, undo, redo, canUndo, canRedo, reset };
  };

  // ===================================================================================
  // 2. === CRITICAL CHANGE === Updated Centralized State for REBUILT 2026
  // ===================================================================================
  const initialMatchData = {
    phase: PHASES.PRE_MATCH,
    cycles: [],
    startingPosition: -1,
    
    // NEW state for toggle-based scouting
    activeCycle: null,      // Holds the currently running cycle (e.g., SCORING, DEFENSE)
    cyclePendingRate: null, // Holds a completed cycle waiting for a BPS rate

    // Standard states, preserved from your original structure
    contact: { startTime: null, endTime: null, pinCount: 0, foulCount: 0 },
    hang: { startTime: null, endTime: null, level: null },
    endgame: { disabled: false, driverSkill: "N/A", defenseSkill: "N/A", role: "N/A", comments: "" },
  };

  const { state, setState, undo, redo, canUndo, canRedo, reset } = useHistoryState(initialMatchData);

  // ===================================================================================
  // 3. === CRITICAL CHANGE === "Smart" Setters for the new state structure
  // ===================================================================================
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const createSetter = (key) => (value) => {
    const currentState = stateRef.current;
    const currentSlice = currentState[key];
    let newValue;
    if (typeof value === 'function') {
      newValue = value(currentSlice);
    } else if (typeof currentSlice === 'object' && currentSlice !== null && !Array.isArray(currentSlice)) {
      newValue = { ...currentSlice, ...value };
    } else {
      newValue = value;
    }
    setState({ ...currentState, [key]: newValue });
  };

  // Create Individual Setters to Preserve Context API
  const setPhase = createSetter('phase');
  const setCycles = createSetter('cycles');
  const setStartingPosition = createSetter('startingPosition');
  const setActiveCycle = createSetter('activeCycle');
  const setCyclePendingRate = createSetter('cyclePendingRate');
  const setContact = createSetter('contact');
  const setHang = createSetter('hang');
  const setEndgame = createSetter('endgame');
  
  // Destructure the state for use in the component
  const {
    phase, cycles, startingPosition, 
    activeCycle, cyclePendingRate,
    contact, hang, endgame
  } = state;

  // This function is adapted to the new state model
  const isDefending = () => state.activeCycle?.type === CYCLE_TYPES.DEFENSE;

  const [submitting, setSubmitting] = useState(false);

  const fieldCanvasRef = useRef(null);
  const scaledBoxRef = useRef(null);

  const resetMatchState = reset;
  
  const getScaledBoxDimensions = () => {
    const { innerWidth, innerHeight } = window;
    let width = innerWidth;
    let height = width / aspectRatio;
    if (height > innerHeight) {
      height = innerHeight;
      width = height * aspectRatio;
    }
    return { width, height };
  };
  const [scaledBoxRect, setScaledBoxRect] = useState(getScaledBoxDimensions());

  const scaleWidthToActual = (virtualValue, matchContext = null) =>
    (virtualValue / virtualWidth) *
    (matchContext?.scaledBoxRect || scaledBoxRect).width;

  const scaleHeightToActual = (virtualValue, matchContext = null) =>
    (virtualValue / virtualHeight) *
    (matchContext?.scaledBoxRect || scaledBoxRect).height;

  let fetching = false;
  const fetchScoutMatchData = async () => {
    if (fetching || !eventKey || !driverStation || !matchKey) { return; }
    try {
      fetching = true;
      const response = await getScoutMatch({ eventKey, station: driverStation, matchKey });
      fetching = false;
      setScoutData(response.data);
      setSearchParamsError(null);
      resetMatchState();
    } catch (err) {
      fetching = false;
      setSearchParamsError(err.response?.data?.message);
    }
  };

  const format = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(1, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const getDisplayTime = () => {
    let time = null;
    if (phase === PHASES.AUTO) {
      time = AUTO_MAX_TIME - getCurrentTime();
    } else if (phase === PHASES.TELE) {
      time = TELE_MAX_TIME - getCurrentTime();
    }
    return time != null ? format(time) : "- - -";
  };

  useEffect(() => {
    setDisplayTime(getDisplayTime());
    const interval = setInterval(() => { setDisplayTime(getDisplayTime); }, 500);
    return () => clearInterval(interval);
  }, [matchStartTime, phase]);

  const isScoutingRed = () => [R1, R2, R3].includes(driverStation);
  const isScoringTableFar = () => scoutPerspective === SCORING_TABLE_FAR;
  const flipX = () => isScoutingRed();
  const flipY = () => isScoutingRed();

  // ===================================================================================
  // 4. === CRITICAL CHANGE === ADAPTED `saveEndedCycles` for the new state
  // ===================================================================================
  const saveEndedCycles = (currentState) => {
    const cyclesToAdd = [];
    const stateChanges = {};

    // Process Hang Cycle
    if (currentState.hang.endTime) {
      cyclesToAdd.push({ ...currentState.hang, type: CYCLE_TYPES.HANG, phase: currentState.phase });
      stateChanges.hang = { startTime: null, endTime: null, level: null };
    }

    // Process Contact Cycle
    if (currentState.contact.endTime) {
      cyclesToAdd.push({ ...currentState.contact, type: CYCLE_TYPES.CONTACT, phase: currentState.phase });
      stateChanges.contact = { startTime: null, endTime: null, pinCount: 0, foulCount: 0 };
    }
    
    // Process Auto Movement at the end of the auto phase if not already recorded
    const hasAutoMoveCycle = currentState.cycles.some(c => c.type === CYCLE_TYPES.AUTO_MOVEMENT);
    if (currentState.phase !== PHASES.AUTO && !hasAutoMoveCycle && currentState.startingPosition > -1) {
       cyclesToAdd.push({
         type: CYCLE_TYPES.AUTO_MOVEMENT,
         phase: PHASES.AUTO,
         startTime: 0,
         // If a move-off-line cycle exists, use its end time. Otherwise, assume it happened at the end of auto.
         endTime: currentState.cycles.find(c => c.type === CYCLE_TYPES.AUTO_MOVEMENT)?.endTime || AUTO_MAX_TIME,
         attainedLocation: currentState.startingPosition
       });
    }

    if (cyclesToAdd.length > 0) {
      stateChanges.cycles = [...currentState.cycles, ...cyclesToAdd];
    }
    
    if (Object.keys(stateChanges).length === 0) {
      return currentState;
    }

    return { ...currentState, ...stateChanges };
  };

  // ===================================================================================
  // 5. === CRITICAL CHANGE === UPDATED Context Wrapper with new state and setters
  // ===================================================================================
  const CONTEXT_WRAPPER = {
    // History Hook State and Functions
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    
    // State Slices and Setters for child components
    phase, setPhase,
    cycles, setCycles,
    startingPosition, setStartingPosition,
    activeCycle, setActiveCycle,
    cyclePendingRate, setCyclePendingRate,
    contact, setContact,
    hang, setHang,
    endgame, setEndgame,

    // Other necessary context
    fieldCanvasRef,
    matchStartTime,
    setMatchStartTime,
    isDefending,
    searchParams,
    setSearchParams,
    getCurrentTime,
    isScoutingRed: isScoutingRed(),
    isScoringTableFar: isScoringTableFar(),
    scoutData,
    setScoutData,
    userToken,
    submitting,
    setSubmitting,
  };

  const getTheme = () => (isScoutingRed() ? RedTheme : BlueTheme);
  
  const createFieldLocalMatchComponent = (
    id, fieldX, fieldY, fieldWidth, fieldHeight, componentFunction, dontFlip = false, noPointerEvents = false
  ) => {
    return (
      <MatchContext.Consumer key={id}>
        {(match) => (
          <FieldLocalComponent
            fieldX={fieldX} fieldY={fieldY} fieldWidth={fieldWidth} fieldHeight={fieldHeight}
            perspective={scoutPerspective}
            sx={{ pointerEvents: noPointerEvents ? "none" : "auto" }}
          >
            {componentFunction(match)}
          </FieldLocalComponent>
        )}
      </MatchContext.Consumer>
    );
  };

  const FieldButton = ({ children, sx, drawBorder, ...props }) => {
    return (
      <Button
        variant="contained"
        sx={{
          ...sx,
          width: "100%", height: "100%",
          minWidth: 0, minHeight: 0,
          padding: 0, margin: 0,
          fontSize: scaleWidthToActual(60) + "px",
          border: drawBorder ? scaleWidthToActual(25) + "px solid black" : scaleWidthToActual(1) + "px solid black",
          transition: 'transform 0.15s ease-in-out, box-shadow 1s ease-in-out',
          transform: drawBorder ? 'scale(1.2)' : 'scale(1)',
          boxShadow: drawBorder ? '0px 4px 20px rgba(0,0,0,0.4)' : '0px rgba(0,0,0,0)',
        }}
        {...props}
      >{children}</Button>
    );
  };

  const createScoutingConfigChild = (config, key) => {
    const [x, y] = config.positions[key];
    return config.phases.includes(phase)
      ? createFieldLocalMatchComponent(
          key, x, y,
          config.dimensions.width, config.dimensions.height,
          (match) => {
            const isNotShowing = config.showFunction && !config.showFunction(match, key);
            const isDisabled = config.disabled && config.disabled(match, key);
            if (isNotShowing) { return; }
            return config.componentFunction != null ? (
              config.componentFunction(match, key)
            ) : (
              <FieldButton
                sx={{
                  pointerEvents: isDisabled || isNotShowing ? "none" : "auto",
                  borderRadius: config.isCircle ? "50%" : "2%",
                  ...config.sx
                }}
                drawBorder={config.drawBorder && config.drawBorder(match, key)}
                disabled={isDisabled}
                color={config.color || COLORS.ACTIVE}
                onClick={config.onClick ? () => config.onClick(CONTEXT_WRAPPER, key) : () => null}
              >
                {config.textFunction && config.textFunction(match, key)}
              </FieldButton>
            );
          },
          config.dontFlip || false
        )
      : null;
  };

  const SidebarButton = ({
    id, flexWeight = 1, label, onClick, color, disabled = false, sx = {}, show = true,
  }) => {
    const [animating, setAnimating] = useState(false);
    const onClickKeyframes = { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.2)' }, '100%': { transform: 'scale(1)' }, };
    if (!show) return null;
    return (
        <Button
          variant="contained" color={color} disabled={disabled}
          onClick={() => {
            setAnimating(true);
            setTimeout(() => { setAnimating(false); onClick(); }, 100);
          }}
          sx={{
            width: "90%", height: "95%",
            fontSize: scaleWidthToActual(100) + "px",
            borderRadius: scaleWidthToActual(150) + "px",
            left: "5%",
            '@keyframes onClick': onClickKeyframes,
            animation: animating ? 'onClick 0.1s ease' : 'none',
            ...sx,
          }}
        >{label}</Button>
      );
  }

  const ScoutingConfigChildren = Object.values(SCOUTING_CONFIG).map((config) =>
    Object.keys(config.positions).map((position) => {
      return createScoutingConfigChild(config, position);
    })
  );

  // === NOTE ===
  // The `GROUND_PICKUPIcon` rendering logic that was here has been removed because
  // the `powerCellCycles` state it depended on no longer exists in the new model.

  // The entire POST_MATCHChildren array is preserved from your original file.
  const POST_MATCHChildren = [
    createFieldLocalMatchComponent("disabled", 250, 100, 500, 150, (match) => <FieldButton color={COLORS.PRIMARY}>DISABLED?</FieldButton>, !(isScoringTableFar() && isScoutingRed())),
    ...[150, 500].map((x, index) => {
      const value = ["no", "yes"][index];
      return createFieldLocalMatchComponent(`${index}DisabledMenu`, x, 250, 300, 100, (match) => (
        <FieldButton color={COLORS.PENDING} onClick={() => { match.setEndgame({ disabled: value === "yes" }); }} drawBorder={match.endgame.disabled === (value === "yes")}>{value}</FieldButton>
      ), isScoringTableFar() !== isScoutingRed());
    }),
    createFieldLocalMatchComponent("driverSkill", 250, 500, 500, 150, (match) => <FieldButton color={COLORS.PRIMARY}>Driver Skill</FieldButton>, isScoringTableFar() !== isScoutingRed()),
    ...[75, 250, 425, 600, 775, 950, 1125].map((x, index) => {
      const value = ["N/A", 0, 1, 2, 3, 4, 5][index];
      return createFieldLocalMatchComponent(`${index}DriverSkill`, x, 650, 150, 100, (match) => (
        <FieldButton color={COLORS.PENDING} onClick={() => { match.setEndgame({ driverSkill: value }); }} drawBorder={match.endgame.driverSkill === value}>{value}</FieldButton>
      ), isScoringTableFar() !== isScoutingRed());
    }),
    createFieldLocalMatchComponent("defenseSkill", 250, 900, 500, 150, (match) => (<FieldButton color={COLORS.PRIMARY}>Defense Skill</FieldButton>), isScoringTableFar() !== isScoutingRed()),
    ...[75, 250, 425, 600, 775, 950, 1125].map((x, index) => {
      const value = ["N/A", 0, 1, 2, 3, 4, 5][index];
      return createFieldLocalMatchComponent(`${index}DefenseSkill`, x, 1050, 150, 100, (match) => (
        <FieldButton color={COLORS.PENDING} onClick={() => { match.setEndgame({ defenseSkill: value }); }} drawBorder={match.endgame.defenseSkill === value}>{value}</FieldButton>
      ), isScoringTableFar() !== isScoutingRed());
    }),
    createFieldLocalMatchComponent("role", 250, 1300, 500, 150, (match) => <FieldButton color={COLORS.PRIMARY}>Role</FieldButton>, isScoringTableFar() !== isScoutingRed()),
    ...[200, 575, 950, 1325].map((x, index) => {
      const value = ["N/A", "Defense", "Cycle", "Feed"][index];
      return createFieldLocalMatchComponent(`${index}Role`, x, 1450, 350, 100, (match) => (
        <FieldButton color={COLORS.PENDING} onClick={() => { match.setEndgame({ role: value }); }} sx={{zIndex: match.endgame.role===value ? 2 : 1}} drawBorder={match.endgame.role === value}>{value}</FieldButton>
      ), isScoringTableFar() !== isScoutingRed());
    }),
    createFieldLocalMatchComponent("comments", 1850, 750, 600, 1400, (match) => (
      <><label htmlFor="comments" style={{ color: "black", }}>COMMENTS:</label>
      <textarea id="comments" onChange={(event) => match.setEndgame({ comments: event.target.value, })} style={{ width: "100%", height: "100%", }}></textarea></>
    ), isScoringTableFar() !== isScoutingRed()),
  ];

  const getFieldCanvasOffset = () => {
    if (phase === PHASES.POST_MATCH && !isScoringTableFar()) { return 0; }
    const shift = 0;
    const defenseShift = isDefending() && phase !== PHASES.POST_MATCH ? shift : 0;
    const offset = isScoutingRed() !== isScoringTableFar() ? -shift + defenseShift : -defenseShift;
    return offset;
  };
  
  const renderFieldCanvas = () => {
    const fieldChildren = [
      ...ScoutingConfigChildren,
      ...(phase === PHASES.POST_MATCH ? POST_MATCHChildren : []),
      // Note: GROUND_PICKUPIcon rendering is removed here
    ];
    return (
      <Box sx={{ transform: `translateX(${getFieldCanvasOffset()}px)` }}>
        {scaledBoxRect.width > 0 && (
          <FieldCanvas
            ref={fieldCanvasRef} theme={getTheme()} height={scaledBoxRect.height}
            perspective={scoutPerspective} children={fieldChildren}
            // Note: Generic onClick for acquiring pieces is removed
            phase={phase}
          />
        )}
      </Box>
    );
  };

  const renderScoutDataLabel = () => {
    return (
      <Box sx={{ backgroundColor: getTheme().palette.primary.main, color: getTheme().palette.primary.contrastText, fontSize: scaleWidthToActual(50) + "px", display: "flex", justifyContent: "center"}}>
        {scoutData ? ( <div>Scout: {userToken?.username} Team: {scoutData.teamNumber} Match: {getmatchKey()}</div> ) : ( <div>No scout data</div> )}
      </Box>
    );
  };
  
  const renderSideBarHeader = () => {
    const iconSize = scaleWidthToActual(150);
    const fontSize = scaleWidthToActual(60);

    return (
      <Box sx={{ display: "flex", flexDirection: "column", width: "100%", borderBottom: "1px solid #ccc" }}>
        <Box sx={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
          <Button onClick={() => setSidebarOpen(true)} sx={{ width: iconSize, height: iconSize, minWidth: 0, padding: 0 }}><MenuIcon sx={{ height: "100%", width: "100%", fontSize: fontSize }}/></Button>
          
          {/* Note: The power cell icons that were here have been removed as getNumPowerCellsInBot() is obsolete. */}
          <Box sx={{flex: 1}} /> 

          <Box sx={{ width: iconSize, height: iconSize, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "white", fontSize: fontSize }}>{displayTime}</span></Box>
        </Box>
        {renderScoutDataLabel()}
      </Box>
    );
  };

  const renderSideBar = () => {
    let match = CONTEXT_WRAPPER;
    const configItems = SIDEBAR_CONFIG.filter((item) => item.phases.includes(match.phase));

    const buttonsList = configItems.flatMap((item) =>
      item.positions.map((key) => {
        if (!item.show(match, key)) return null;
        return (
          <Box key={`${item.id}-${key}`} sx={{ flex: item.flexWeight || 1 }}>
            <SidebarButton
              id={key}
              label={typeof item.label === "function" ? item.label(match, key) : item.label}
              onClick={() => item.onClick && item.onClick(match, key)}
              color={typeof item.color === "function" ? item.color(match, key) : item.color}
              sx={item.sx}
              flexWeight={item.flexWeight || 1}
              disabled={item.isDisabled && item.isDisabled(match, key)}
            />
          </Box>
        );
      })
    );

    return (
      <>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} scaleWidthToActual={scaleWidthToActual} scaleHeightToActual={scaleHeightToActual}/>
        <Box sx={{ display: "flex", flexDirection: "column", overflowY: "auto", flex: 1, height: "99%", margin: "2% 0%" }}>
          {renderSideBarHeader()}
          <Box sx={{height: "2%", bgcolor: "rgba(0,0,0,0)"}}/>
          {buttonsList.filter(Boolean)}
        </Box>
      </>
    );
  };

  const resizeScaledBox = () => {
    const { width, height } = getScaledBoxDimensions();
    const rect = scaledBoxRef.current?.getBoundingClientRect() || { x: 0, y: 0, width: width, height: height };
    setScaledBoxRect({ x: rect.left, y: rect.top, width, height });
  };

  const lockOrientation = async () => {
    try { await window.screen.orientation.lock("landscape"); } catch (error) { console.error("Failed to lock orientation:", error); }
  };

  useLayoutEffect(() => {
    lockOrientation();
    window.screen.orientation.addEventListener("change", () => resizeScaledBox());
    resizeScaledBox();
    window.addEventListener("resize", resizeScaledBox);
    return () => window.removeEventListener("resize", resizeScaledBox);
  }, []);

  const getmatchKey = () => { return searchParams.get("matchKey"); };

  return (
    <MatchContext.Provider value={CONTEXT_WRAPPER}>
      <ThemeProvider theme={getTheme()}>
        <Box sx={{ position: "relative", width: "100vw", height: "100vh", bgcolor: "black" }}>
          {/* <FullscreenDialog /> */}
          <RequiredParamsDialog
            open={searchParamsError != null}
            searchParams={searchParams}
            searchParamsError={searchParamsError}
            onSubmit={handleMissingParamsSubmit}
            requiredParamKeys={["eventKey", "matchKey", "station"]}
          />
          <Box
            ref={scaledBoxRef}
            sx={{
              position: "absolute", top: "50%", left: "50%",
              width: scaledBoxRect.width, height: scaledBoxRect.height,
              transform: "translate(-50%, -50%)",
              background: getTheme().palette.background.default,
            }}
          >
            <Box
              sx={{
                background: phase === PHASES.AUTO ? getTheme().palette.autoBackground.main : "",
                position: "absolute", left: scaleWidthToActual(sidebarVirtualWidth),
                width: scaledBoxRect.width - scaleWidthToActual(sidebarVirtualWidth),
                height: scaledBoxRect.height, overflow: "hidden",
              }}
            >
              {renderFieldCanvas()}
            </Box>
            <Box
              sx={{
                position: "absolute", left: 0,
                width: scaleWidthToActual(sidebarVirtualWidth),
                height: scaledBoxRect.height, overflow: "hidden",
                background: "background.paper"
              }}
            >
              {renderSideBar()}
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </MatchContext.Provider>
  );
};

export default ScoutMatch;