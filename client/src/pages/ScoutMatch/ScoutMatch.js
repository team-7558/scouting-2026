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
import { SCOUTING_CONFIG, ENDGAME_CONFIG } from "./ScoutingConfig.js";
import { getScoutMatch } from "../../requests/ApiRequests.js";
import { ImageIcon } from "./CustomFieldComponents.js";
import { SIDEBAR_CONFIG } from "./SidebarConfig.js";
import { getSignedInUser } from "../../TokenUtils.js";
import RequiredParamsDialog from "../Common/RequiredParamsDialog.js";
import { useNavigate } from "react-router-dom";

const { R1, R2, R3 } = DRIVER_STATIONS;
const { SCORING_TABLE_FAR } = PERSPECTIVE;

const sidebarVirtualWidth = 1100;
const virtualWidth = FIELD_VIRTUAL_WIDTH + sidebarVirtualWidth;
const virtualHeight = FIELD_VIRTUAL_HEIGHT;
const aspectRatio = 16 / 9;

const MatchContext = createContext();

const exists = (val) => {
  return val !== null && val !== undefined;
};

// Scout Match Component
const ScoutMatch = () => {
  const navigate = useNavigate();

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

  const isUndoingRef = useRef(false);

  // ===================================================================================
  // 1. Your Custom Hook for Managing State History (Undo/Redo) - UNCHANGED
  // ===================================================================================
  const useHistoryState = (initialState) => {
    const [historyState, setHistoryState1] = useState(() => ({
      history: [initialState],
      index: 0,
    }));

    const setHistoryState = (val) => {
      setHistoryState1(val);
      console.trace("Setting new state");
    }

    const state = historyState.history[historyState.index];

    // ========== SET STATE ==========
    const setState = useCallback((newStateOrFn) => {
      setHistoryState(prev => {
        const currentState = prev.history[prev.index];

        const newState =
          typeof newStateOrFn === "function"
            ? newStateOrFn(currentState)
            : newStateOrFn;

        // Bail if reference didn't change
        if (newState === currentState) {
          return prev;
        }

        const newHistory = prev.history.slice(0, prev.index + 1);

        console.log("newState:", newState);
        console.log("newHistory:", newHistory, prev.index);

        return {
          history: [...newHistory, newState],
          index: newHistory.length
        };
      });
    }, []);

    // ========== UNDO ==========
    const undo = () => {
      isUndoingRef.current = true;
      setHistoryState(prev => {
        console.log("UNDO PREV INDEX:", prev.index);
        if (prev.index === 0) return prev;
        const next = { ...prev, index: prev.index - 1 };
        console.log("UNDO NEXT INDEX:", next.index);
        return next;
      });
    }

    // ========== REDO ==========
    const redo = useCallback(() => {
      setHistoryState(prev => {
        if (prev.index >= prev.history.length - 1) return prev;
        return {
          ...prev,
          index: prev.index + 1
        };
      });
    }, []);

    // ========== RESET ==========
    const reset = useCallback(() => {
      setHistoryState({
        history: [initialState],
        index: 0
      });
    }, [initialState]);

    // ========== HELPERS ==========
    const canUndo = () => historyState.index > 0;
    const canRedo = () =>
      historyState.index < historyState.history.length - 1;

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
    activeCycle: {},      // Holds the currently running cycle (e.g., SCORING, CONTACT)
    defenseCycle: {}, //type, phase, startTime, endTime

    // endgame: { disabled: false, driverSkill: "N/A", defenseSkill: "N/A", role: "N/A", comments: "" },
    endgame: { disabled: "No", driverSkill: "N/A", defenseSkill: "N/A", roles: [], comments: "" },
  };

  const { state, setState, undo, redo, canUndo, canRedo, reset } = useHistoryState(initialMatchData);

  // ===================================================================================
  // 3. === CRITICAL CHANGE === "Smart" Setters for the new state structure
  // ===================================================================================

  const createSetter = (key) => (value) => {
    setState(prev => {
      const currentSlice = prev[key];

      let newValue;
      if (typeof value === "function") {
        newValue = value(currentSlice);
      } else if (
        typeof currentSlice === "object" &&
        currentSlice !== null &&
        !Array.isArray(currentSlice)
      ) {
        newValue = { ...currentSlice, ...value };
      } else {
        newValue = value;
      }

      // IMPORTANT: Return a NEW state object
      return {
        ...prev,
        [key]: newValue
      };
    });
  };

  // Create Individual Setters to Preserve Context API
  const setPhase = createSetter('phase');
  const setCycles = createSetter('cycles');
  const setStartingPosition = createSetter('startingPosition');
  const setActiveCycle = createSetter('activeCycle');
  const setDefenseCycle = createSetter('defenseCycle');
  const setEndgame = createSetter('endgame');

  // Destructure the state for use in the component
  const {
    phase, cycles, startingPosition,
    activeCycle, defenseCycle,
    endgame
  } = state;

  // This function is adapted to the new state model
  const isDefending = () => state.defenseCycle && exists(state.defenseCycle.startTime) && !exists(state.defenseCycle.endTime);

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
      console.log("Scout data:", response.data);
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
    defenseCycle, setDefenseCycle,
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
    scaleWidthToActual,
    navigate,
  };


  useEffect(() => {
    console.log("in useEffect");
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      return;
    }
    switch (activeCycle.type) {
      case CYCLE_TYPES.SHOOTING:
      case CYCLE_TYPES.INTAKE:
      case CYCLE_TYPES.SNOWBALL:
        if (exists(activeCycle.rate)) {
          setState(prevState => ({
            ...prevState,
            cycles: [...prevState.cycles, activeCycle],
            activeCycle: {}
          }));
        }
        break;
      case CYCLE_TYPES.AUTO_MOVEMENT:
        if (exists(activeCycle.startTime)) {
          setState(prevState => ({
            ...prevState,
            cycles: [...prevState.cycles, activeCycle],
            activeCycle: {}
          }));
        }
        break;
      case CYCLE_TYPES.CONTACT:
      case CYCLE_TYPES.HANG:
        if (exists(activeCycle.endTime)) {
          setState(prevState => ({
            ...prevState,
            cycles: [...prevState.cycles, activeCycle],
            activeCycle: {}
          }));
        }
        break;
    }
  }, [activeCycle]);

  useEffect(() => {
    if (exists(defenseCycle.endTime)) {
      if (isUndoingRef.current) {
        isUndoingRef.current = false;
        return;
      }
      setState(prevState => ({
        ...prevState,
        defenseCycle: {},
        cycles: [...prevState.cycles, defenseCycle]
      }));
    }
  }, [defenseCycle]);

  const getTheme = () => (isScoutingRed() ? RedTheme : BlueTheme);

  const createFieldLocalMatchComponent = (
    id, fieldX, fieldY, fieldWidth, fieldHeight, componentFunction, dontFlip = false, noPointerEvents = false
  ) => {
    return (
      <MatchContext.Consumer key={id}>
        {(match) => {
          if (componentFunction(match) == null) {
            return null;
          }
          return (
            <FieldLocalComponent
              fieldX={fieldX} fieldY={fieldY} fieldWidth={fieldWidth} fieldHeight={fieldHeight}
              perspective={scoutPerspective}
              isDefending={match.isDefending()}
              sx={{ pointerEvents: noPointerEvents ? "none" : "auto" }}
              flip={!dontFlip}
            >
              {componentFunction(match)}
            </FieldLocalComponent>
          )
        }}
      </MatchContext.Consumer>
    );
  };

  const FieldButton = ({ children, sx, drawBorder, fontSize, ...props }) => {
    return (
      <Button
        variant="contained"
        sx={{
          ...sx,
          width: "100%", height: "100%",
          minWidth: 0, minHeight: 0,
          padding: 0, margin: 0,
          fontSize: scaleWidthToActual(fontSize) + "px",
          border: drawBorder ? scaleWidthToActual(25) + "px solid black" : scaleWidthToActual(15) + "px solid black",
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
          const isNotShowing = (config.showFunction && !config.showFunction(match, key));
          const isDisabled = config.disabled && config.disabled(match, key);
          const isSelected = config.isSelected && config.isSelected(match, key);
          if (isNotShowing) {
            console.log("key2", key);
            return null;
          }
          console.log("key", key);
          return config.componentFunction != null ? (
            config.componentFunction(match, key)
          ) : (
            <FieldButton
              sx={{
                pointerEvents: "auto",
                borderRadius: config.isCircle ? "50%" : "2%",
                opacity: isSelected ? 1 : 0.68,
                border: isSelected ? "10px solid black" : "5px solid black",
                ...config.sx && config.sx(match)
              }}
              fontSize={config.fontSize || 60}
              drawBorder={isSelected}
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

  const ScoutingConfigChildren = Object.values(SCOUTING_CONFIG).map((config) => {
    if (!config.phases.includes(phase)) {
      return null;
    }
    return Object.keys(config.positions).map((position) => {
      return createScoutingConfigChild(config, position);
    })
  });

  // === NOTE ===
  // The `GROUND_PICKUPIcon` rendering logic that was here has been removed because
  // the `powerCellCycles` state it depended on no longer exists in the new model.

  // The entire POST_MATCHChildren array is preserved from your original file.
  const renderEndgame = () => {
    return ENDGAME_CONFIG.map((field) => {
      return createFieldLocalMatchComponent(
        field.id, field.fieldX, field.fieldY, field.width, field.height,
        (match) => {
          // Inner rendering logic based on type
          const label = (
            <Box sx={{
              position: "absolute", left: scaleWidthToActual(field.labelParams?.x || 0), top: scaleHeightToActual(field.labelParams?.y || 0),
              width: scaleWidthToActual(field.labelParams?.width || field.width), height: scaleHeightToActual(field.labelParams?.height || 50),
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: scaleWidthToActual(100) + "px",
            }}>
              <FieldButton color={COLORS.PRIMARY}>{field.label}</FieldButton>
            </Box>
          );

          if (field.type === "TOGGLE" || field.type === "SCALE") {
            const options = field.options || ["N/A", ...Array.from({ length: field.max - field.min + 1 }, (_, i) => i + field.min)];
            const row = (
              <Box sx={{
                position: "absolute", left: scaleWidthToActual(field.rowParams?.x || 0 + field.labelParams?.width), top: scaleHeightToActual(field.rowParams?.y + field.labelParams?.height || 50 + field.labelParams?.height),
                width: scaleWidthToActual(field.rowParams?.width || field.width), height: scaleHeightToActual(field.rowParams?.height || field.height - 50),
                display: "flex", gap: scaleWidthToActual(field.rowParams?.gap || 10)
              }}>
                {options.map((opt, idx) => (
                  <Box key={idx} sx={{ flex: 1 }}>
                    <FieldButton
                      color={COLORS.PENDING}
                      onClick={() => match.setEndgame({ [field.id]: opt })}
                      drawBorder={match.endgame[field.id] == opt}
                    >{opt}</FieldButton>
                  </Box>
                ))}
              </Box>
            );
            return <>{label} {row}</>;
          }

          if (field.type === "OPTIONS") {
            const label = (
              <Box sx={{
                position: "absolute", left: scaleWidthToActual(field.labelParams?.x || 0), top: scaleHeightToActual(field.labelParams?.y || 0),
                width: scaleWidthToActual(field.labelParams?.width || field.width), height: scaleHeightToActual(field.labelParams?.height || 50),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: scaleWidthToActual(100) + "px",
              }}>
                <FieldButton color={COLORS.PRIMARY}>{field.label}</FieldButton>
              </Box>
            );
            const options = field.options;

            // Ensure we always have an array
            const selected = Array.isArray(match.endgame[field.id])
              ? match.endgame[field.id]
              : [];

            const row = (
              <Box sx={{
                position: "absolute",
                left: scaleWidthToActual(
                  (field.rowParams?.x || 0) + (field.labelParams?.width || 0)
                ),
                top: scaleHeightToActual(
                  (field.rowParams?.y || 50) + (field.labelParams?.height || 0)
                ),
                width: scaleWidthToActual(field.rowParams?.width || field.width),
                height: scaleHeightToActual(field.rowParams?.height || field.height - 50),
                display: "flex",
                gap: scaleWidthToActual(field.rowParams?.gap || 10)
              }}>
                {options.map((opt, idx) => {
                  const isSelected = selected.includes(opt);

                  return (
                    <Box key={idx} sx={{ flex: 1 }}>
                      <FieldButton
                        color={isSelected ? COLORS.ACTIVE : COLORS.PENDING}
                        onClick={() => {
                          let newValues;

                          if (isSelected) {
                            // Remove
                            newValues = selected.filter(v => v !== opt);
                          } else {
                            // Add
                            newValues = [...selected, opt];
                          }

                          match.setEndgame({ [field.id]: newValues });
                        }}
                        drawBorder={isSelected}
                        sx={{
                          fontSize: scaleWidthToActual(20) + "px",
                        }}
                      >
                        {opt}
                      </FieldButton>
                    </Box>
                  );
                })}
              </Box>
            );

            return [label, row];
          }

          if (field.type === "TEXT_AREA") {
            return (
              <>
                {label}
                <Box sx={{
                  position: "absolute", left: scaleWidthToActual(field.textParams?.x || 0), top: scaleHeightToActual(field.textParams?.y || 100),
                  width: scaleWidthToActual(field.textParams?.width || field.width), height: scaleHeightToActual(field.textParams?.height || field.height - 100),
                  bgcolor: "white"
                }}>
                  <textarea
                    value={match.endgame.comments || ""}
                    onChange={(e) => match.setEndgame({ comments: e.target.value })}
                    style={{ width: "100%", height: "100%", fontSize: scaleWidthToActual(40) + "px", padding: "10px" }}
                  />
                </Box>
              </>
            );
          }
          return null;
        },
        // dontFlip
        true // Dont flip condition same as before
      );
    });
  };

  const getFieldCanvasOffset = () => {
    if (phase === PHASES.POST_MATCH && !isScoringTableFar()) { return 0; }
    const shift = FIELD_VIRTUAL_WIDTH * 0;
    const defenseShift = isDefending() && phase !== PHASES.POST_MATCH ? shift : 0;
    const offset = isScoutingRed() !== isScoringTableFar() ? -shift + defenseShift : -defenseShift;
    return offset;
  };

  const renderFieldCanvas = () => {
    const fieldChildren = [
      ...ScoutingConfigChildren,
      ...(phase === PHASES.POST_MATCH || phase === PHASES.ENDGAME ? renderEndgame() : []),
      // Note: GROUND_PICKUPIcon rendering is removed here
    ];
    return (
      <Box sx={{ transform: `translateX(${getFieldCanvasOffset()}px)` }}>
        {scaledBoxRect.width > 0 && (
          <FieldCanvas
            ref={fieldCanvasRef} theme={getTheme()} height={scaledBoxRect.height}
            perspective={scoutPerspective} children={fieldChildren} match={CONTEXT_WRAPPER}
          />
        )}
      </Box>
    );
  };

  const renderScoutDataLabel = () => {
    return (
      <Box sx={{ backgroundColor: getTheme().palette.primary.main, color: getTheme().palette.primary.contrastText, fontSize: scaleWidthToActual(50) + "px", display: "flex", justifyContent: "center" }}>
        {scoutData ? (<div>Scout: {userToken?.username} Team: {scoutData.teamNumber} Match: {getmatchKey()}</div>) : (<div>No scout data</div>)}
      </Box>
    );
  };

  const renderSideBarHeader = () => {
    const iconSize = scaleWidthToActual(150);
    const fontSize = scaleWidthToActual(60);

    return (
      <Box sx={{ display: "flex", flexDirection: "column", width: "100%", borderBottom: "1px solid #ccc" }}>
        <Box sx={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
          <Button onClick={() => setSidebarOpen(true)} sx={{ width: iconSize, height: iconSize, minWidth: 0, padding: 0 }}><MenuIcon sx={{ height: "100%", width: "100%", fontSize: fontSize }} /></Button>

          {/* Note: The power cell icons that were here have been removed as getNumPowerCellsInBot() is obsolete. */}
          <Box sx={{ flex: 1 }} />

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
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} scaleWidthToActual={scaleWidthToActual} scaleHeightToActual={scaleHeightToActual} />
        <Box sx={{ display: "flex", flexDirection: "column", overflowY: "auto", flex: 1, height: "99%", margin: "2% 0%" }}>
          {renderSideBarHeader()}
          <Box sx={{ height: "2%", bgcolor: "rgba(0,0,0,0)" }} />
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
                // background: phase === PHASES.AUTO ? getTheme().palette.autoBackground.main : "",
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