import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  createContext,
  useLayoutEffect,
} from "react";
import { ThemeProvider } from "@mui/material/styles";
import { BlueTheme } from "./themes/BlueTheme.js";
import { RedTheme } from "./themes/RedTheme.js";
import { useSearchParams } from "react-router-dom";

import { Box, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { FieldCanvas, FieldLocalComponent } from "../FieldCanvas.js";
import FullscreenDialog from "./FullScreenDialog.js";

import CoralIcon from "../../assets/scouting-2025/coralIcon.png";
import Sidebar from "../Sidebar.js";

import {
  GAME_LOCATIONS,
  ACTIONS,
  GAME_PIECES,
  PHASES,
  COLORS,
  DRIVER_STATIONS,
  FIELD_VIRTUAL_WIDTH,
  FIELD_VIRTUAL_HEIGHT,
  FIELD_ASPECT_RATIO,
  PERSPECTIVE,
  CYCLE_TYPES,
  AUTO_MAX_TIME,
  TELE_MAX_TIME,
  HANG_RESULTS,
  DEPOSIT_TYPE,
} from "./Constants.js";
import { SCOUTING_CONFIG } from "./ScoutingConfig.js";
import { getScoutMatch } from "../../requests/ApiRequests.js";
import { ImageIcon } from "./CustomFieldComponents.js";
import { SIDEBAR_CONFIG } from "./SidebarConfig.js";
import { getSignedInUser } from "../../TokenUtils.js";
import RequiredParamsDialog from "../Common/RequiredParamsDialog.js";

const { B1, R1, R2, R3 } = DRIVER_STATIONS;
const { SCORING_TABLE_NEAR, SCORING_TABLE_FAR } = PERSPECTIVE;

const {
  ACQUIRE,
  SHOOT,
  FINISH,
  ACQUIRE_AND_FINISH,
  DROP,
  HANG,
  HANG_ENTER,
  HANG_COMPLETE,
  GO_TELE,
  GO_DEFENSE,
  GO_POST_MATCH,
  ROBOT_LEFT_STARTING,
} = ACTIONS;
const { CORAL, ALGAE } = GAME_PIECES;

// Canvas Helpers
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
  // Open the dialog if any of the required params are missing
  useEffect(() => {
    if (
      !searchParams.get("eventKey") ||
      !searchParams.get("matchKey") ||
      !searchParams.get("station")
    ) {
      setSearchParamsError("Missing search params");
    } else if (
      !scoutData ||
      scoutData.matchKey != searchParams.get("matchKey") ||
      scoutData.station != searchParams.get("station")
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
  const driverStation = searchParams.get("station") || B1;

  const scoutPerspective =
    searchParams.get("perspective") || PERSPECTIVE.SCORING_TABLE_FAR;

  const [scoutData, setScoutData] = useState(null);

  const [matchStartTime, setMatchStartTime] = useState(null);
  const getCurrentTime = () => {
    if (phase == PHASES.POST_MATCH) {
      return TELE_MAX_TIME;
    }
    return Math.min(
      phase == PHASES.AUTO ? AUTO_MAX_TIME : TELE_MAX_TIME,
      matchStartTime == null ? 0 : Date.now() - matchStartTime
    );
  };
  const [displayTime, setDisplayTime] = useState(0);

  const [phase, setPhase] = useState(PHASES.PRE_MATCH);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [cycles, setCycles] = useState([]);

  const [startingPosition, setStartingPosition] = useState(-1);

  const [autoMovement, setAutoMovement] = useState({
    startTime: 0,
    attainedLocation: null, //where the robot starts
    endTime: null,
  });

  const [powerCellCycles, setPowerCellCycles] = useState([{
    attainedLocation: GAME_LOCATIONS.PRELOAD,
    startTime: 0,
    depositLocation: null,
    depositType: null, // score or drop
    depositSuccess: null,
    endTime: null,
  },
  { attainedLocation: GAME_LOCATIONS.PRELOAD, startTime: 0 },
  { attainedLocation: GAME_LOCATIONS.PRELOAD, startTime: 0 },
  {}, {}]);

  const [controlPanel, setControlPanel] = useState({
    startTime: null, // if not null, holding gamepiece
    action: null, //spin or color
    endTime: null,
  });

  const [defense, setDefense] = useState({
    startTime: null,
    endTime: null,
  });
  const isDefending = () => defense.startTime!=null && defense.endTime==null;

  const [contact, setContact] = useState({
    startTime: null,
    endTime: null,
    contactRobot: null,
    pinCount: null,
    foulCount: null,
  });

  const [hang, setHang] = useState({
    startTime: null, // when robot enters under barge
    endTime: null, // when robot off the floor
    type: null //fail, succeed, balanced
  });

  const [endgame, setEndgame] = useState({
    disabled: false,
    driverSkill: "N/A",
    defenseSkill: "N/A",
    role: "N/A",
    comments: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const resetMatchState = () => {
    setPhase(PHASES.PRE_MATCH);
    setStartingPosition(-1);
    setMatchStartTime(null);
    setDisplayTime(null);
    setCycles([]);
    setAutoMovement({ startTime: 0 });
    setPowerCellCycles([
      { attainedLocation: GAME_LOCATIONS.PRELOAD, startTime: 0 }, 
      { attainedLocation: GAME_LOCATIONS.PRELOAD, startTime: 0 }, 
      { attainedLocation: GAME_LOCATIONS.PRELOAD, startTime: 0 }, 
    {}, {}]);
    setControlPanel({});
    setDefense({});
    setContact({});
    setHang({});
    setEndgame({});
  };
  const fieldCanvasRef = useRef(null);
  const scaledBoxRef = useRef(null);
  // Initialize scaledBoxRect with nonzero default values based on current window dimensions
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

  //TODO: replace with real teams.
  let fetching = false;
  const fetchScoutMatchData = async () => {
    if (!fetching && (!eventKey || !driverStation || !matchKey)) {
      console.error("Missing eventKey, station, or matchKey in URL.");
      return;
    }
    try {
      fetching = true;
      const response = await getScoutMatch({
        eventKey,
        station: driverStation,
        matchKey,
      });
      fetching = false;
      setScoutData(response.data);
      setSearchParamsError(null);
      console.log("Fetched scout match data:", response.data);
      resetMatchState();
    } catch (err) {
      fetching = false;
      setSearchParamsError(err.response?.data?.message);
      console.error("Error fetching scout match data:", err);
    }
  };

  const format = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(1, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const getDisplayTime = () => {
    let displayTime = null;
    if (phase == PHASES.AUTO) {
      displayTime = AUTO_MAX_TIME - getCurrentTime();
    } else if (phase == PHASES.TELE) {
      displayTime = TELE_MAX_TIME - getCurrentTime();
    }
    return displayTime != null ? format(displayTime) : "- - -";
  };
  useEffect(() => {
    setDisplayTime(getDisplayTime()); //first time
    const interval = setInterval(() => {
      setDisplayTime(getDisplayTime);
    }, 500); // 500 ms to make sure we don't skip a number

    return () => clearInterval(interval);
  }, [matchStartTime, phase]);

  const getNumPowerCellsInBot = () => {
    let count = 0;
    powerCellCycles.forEach((cycle) => {
      if (cycle.startTime != null && cycle.endTime == null){
        count++;
      }
    });
    return count;
  }

  console.log("powerCellCycles", powerCellCycles);
  console.log("cycles", cycles);

  useEffect(() => {
    if (hang.endTime != null) {
      console.log("END THE MATCH");
    }
  }, [hang.endTime]);

  const isScoutingRed = () => [R1, R2, R3].includes(driverStation);
  const isScoringTableFar = () => scoutPerspective == SCORING_TABLE_FAR;
  const flipX = () => isScoutingRed();
  const flipY = () => isScoutingRed();

  console.log("autoMovement", autoMovement);

  const saveEndedCycles = () => {
    let cyclesToAdd = [];
    setAutoMovement(prevAutoMovement => {
      console.log("autoMovement", prevAutoMovement);
      if (!cycles.some(cycle => cycle.type===CYCLE_TYPES.AUTO_MOVEMENT) && startingPosition>=0 && (prevAutoMovement?.endTime || phase==PHASES.TELE)){
        cyclesToAdd.push({type: CYCLE_TYPES.AUTO_MOVEMENT, phase, ...prevAutoMovement, attainedLocation: startingPosition});
        return {};
      }
    })
    setPowerCellCycles(prevCycles => prevCycles.map(cycle => {
      if (cycle.endTime){
        cyclesToAdd.push({type: CYCLE_TYPES.POWER_CELL, phase, ...cycle});
        return {};
      }
      return cycle;
    }));
    setHang(prevHang => {
      if (prevHang.endTime!=null){
        cyclesToAdd.push({type: CYCLE_TYPES.HANG, phase, ...prevHang});
        return {};
      }
      return prevHang;
    });
    setControlPanel(prevPanel => {
      if (prevPanel.endTime!=null){
        cyclesToAdd.push({type: CYCLE_TYPES.CONTROL_PANEL, phase, ...prevPanel});
        return {};
      }
      return prevPanel
    });
    setDefense(prevDefense => {
      if (prevDefense.endTime!=null){
        cyclesToAdd.push({type: CYCLE_TYPES.DEFENSE, phase, ...prevDefense});
        return {};
      }
      return prevDefense
    });
    setContact(prevContact => {
      if (prevContact.endTime!=null){
        cyclesToAdd.push({type: CYCLE_TYPES.CONTACT, phase, ...prevContact});
        return {};
      }
      return prevContact
    });
    setCycles(prevCycles => [...prevCycles, ...cyclesToAdd]);
    console.log(cyclesToAdd);
  }

  // const clearUnfinished = (matchContext = CONTEXT_WRAPPER) => {
  //   console.log("Clearing unfinished");
  //   clearUnfinishedGamepiece(matchContext.coral, matchContext.setCoral);
  //   clearUnfinishedGamepiece(matchContext.algae, matchContext.setAlgae);
  //   matchContext.setHang({});
  //   matchContext.setContact({});
  // };

  // const isUnfinished = (location, time) => location != null && time == null;
  
  // const shouldWriteCycle = (cycleType) => {
  //   switch (cycleType) {
  //     case CYCLE_TYPES.ALGAE:
  //       return isUnfinished(algae.startTime, algae.endTime);
  //     case CYCLE_TYPES.CORAL:
  //       return isUnfinished(coral.startTime, coral.endTime);
  //     case CYCLE_TYPES.CONTACT:
  //       return isUnfinished(contact.startTime, algae.endTime);
  //     case CYCLE_TYPES.DEFENSE:
  //       return isUnfinished(defense.startTime, defense.endTime);
  //     case CYCLE_TYPES.HANG: // this should never happen probably
  //       return isUnfinished(hang.startTime, hang.result);
  //   }
  // };

  const CONTEXT_WRAPPER = {
    fieldCanvasRef,
    matchStartTime,
    setMatchStartTime,
    phase,
    setPhase,
    isDefending,
    searchParams,
    setSearchParams,
    startingPosition,
    cycles,
    setStartingPosition,
    autoMovement,
    setAutoMovement,
    powerCellCycles,
    setPowerCellCycles,
    controlPanel,
    setControlPanel,
    hang,
    setHang,
    endgame,
    setEndgame,
    defense,
    setDefense,
    getCurrentTime,
    isScoutingRed: isScoutingRed(),
    isScoringTableFar: isScoringTableFar(),
    scoutData,
    setScoutData,
    contact,
    setContact,
    userToken,
    submitting,
    setSubmitting,
    getNumPowerCellsInBot,
    saveEndedCycles
  };

  const createTask = (action, gamepiece = null) => ({
    action: action,
    gamepiece: gamepiece,
  });

  //TODO: END MATCH
  // const endMatch = () => {
  //   console.log(cycles);
  //   setCycles(
  //     [
  //       ...cycles,
  //       shouldWriteCycle(CYCLE_TYPES.ALGAE) &&
  //         getWritableCycle(CYCLE_TYPES.ALGAE),
  //       shouldWriteCycle(CYCLE_TYPES.CORAL) &&
  //         getWritableCycle(CYCLE_TYPES.CORAL),
  //       shouldWriteCycle(CYCLE_TYPES.DEFENSE) && {
  //         ...getWritableCycle(CYCLE_TYPES.DEFENSE),
  //         endTime: getCurrentTime(),
  //       },
  //       shouldWriteCycle(CYCLE_TYPES.CONTACT) && {
  //         ...getWritableCycle(CYCLE_TYPES.CONTACT),
  //         endTime: getCurrentTime(),
  //       },
  //       // shouldWriteCycle(CYCLE_TYPES.HANG) &&
  //       //   getWritableCycle(CYCLE_TYPES.HANG),
  //     ].filter((x) => x)
  //   );
  //   setPhase(PHASES.POST_MATCH);
  // };

  // const DONT_CLEAR_LOCATIONS = [
  //   ...Object.keys(SCOUTING_CONFIG.HANG.positions),
  //   ...Object.keys(SCOUTING_CONFIG.GO_POST_MATCH.positions),
  // ];
  // actions is a map of gamepiece transformations to be executed
  // const startPendingTasks = (
  //   location,
  //   tasks,
  //   matchContext = CONTEXT_WRAPPER
  // ) => {
  //   if (![PHASES.PRE_MATCH, PHASES.AUTO, PHASES.TELE].includes(phase)) {
  //     return;
  //   }
  //   // don't clear unfinished if going to post match.
  //   if (!DONT_CLEAR_LOCATIONS.includes(location)) {
  //     clearUnfinished();
  //   }
  //   for (let i in tasks) {
  //     // console.log(tasks[i]);
  //     let task = tasks[i];
  //     switch (task.action) {
  //       case ROBOT_LEFT_STARTING:
  //         setAutoMovement({ ...autoMovement, endTime: getCurrentTime() });
  //         break;
  //       case ACQUIRE:
  //         startAcquireGamepiece(location, task.gamepiece, matchContext);
  //         break;
  //       case DEPOSIT:
  //         startDepositGamepiece(location, task.gamepiece, matchContext);
  //         break;
  //       case FINISH:
  //         finishGamepiece(location, task.gamepiece, matchContext);
  //         break;
  //       case DROP:
  //         dropGamePiece(location, task.gamepiece, matchContext);
  //       case ACQUIRE_AND_FINISH:
  //         AcquireAndFinishGamepiece(location, task.gamepiece, matchContext);
  //         break;
  //       case HANG_ENTER:
  //         matchContext.setHang({
  //           startTime: getCurrentTime(),
  //         });
  //         break;
  //       case HANG_CAGE_TOUCH:
  //         matchContext.setHang({
  //           ...matchContext.hang,
  //           cageLocation: location,
  //           cageTouchTime: getCurrentTime(),
  //         });
  //         break;
  //       case HANG_COMPLETE:
  //         matchContext.setHang({
  //           ...matchContext.hang,
  //           endTime: getCurrentTime(),
  //         });
  //         break;
  //       case GO_TELE:
  //         matchContext.setPhase(PHASES.TELE);
  //         break;
  //       case GO_DEFENSE:
  //         matchContext.setDefense(
  //           matchContext.isDefending()
  //             ? { ...matchContext.defense, endTime: getCurrentTime() }
  //             : { startTime: getCurrentTime() }
  //         );
  //         break;
  //       case GO_POST_MATCH:
  //         endMatch();
  //         break;
  //     }
  //   }
  // };

  const getTheme = () => (isScoutingRed() ? RedTheme : BlueTheme);
  const createFieldLocalMatchComponent = (
    id,
    fieldX,
    fieldY,
    fieldWidth,
    fieldHeight,
    componentFunction,
    dontFlip = false,
    noPointerEvents = false
  ) => {
    if (!dontFlip) {
      fieldX = flipX() ? (FIELD_VIRTUAL_WIDTH*0.62) - fieldX : fieldX;
      fieldY = flipY() ? FIELD_VIRTUAL_HEIGHT - fieldY : fieldY;
    }
    return (
      <MatchContext.Consumer key={id}>
        {(match) => (
          <FieldLocalComponent
            fieldX={fieldX}
            fieldY={fieldY}
            fieldWidth={fieldWidth}
            fieldHeight={fieldHeight}
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
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
          padding: 0,
          margin: 0,
          fontSize: scaleWidthToActual(60) + "px", //
          border: drawBorder
            ? scaleWidthToActual(25) + "px solid black"
            : scaleWidthToActual(1) + "px solid black",
          transition: 'transform 0.15s ease-in-out, box-shadow 1s ease-in-out', // Add smooth transition
          transform: drawBorder ? 'scale(1.2)' : 'scale(1)',
          boxShadow: drawBorder ? '0px 4px 20px rgba(0,0,0,0.4)' : '0px rgba(0,0,0,0)',
        }}
        {...props}
      >
        {children}
      </Button>
    );
  };

  const createScoutingConfigChild = (config, key) => {
    const [x, y] = config.positions[key];
    return config.phases.includes(phase)
      ? createFieldLocalMatchComponent(
          key,
          x,
          y,
          config.dimensions.width,
          config.dimensions.height,
          (match) => {
            const isNotShowing =
              config.showFunction && !config.showFunction(match, key);
            const isDisabled = config.disabled && config.disabled(match, key);
            if (isNotShowing) {
              return;
            }
            return config.componentFunction != null ? (
              config.componentFunction(match, key)
            ) : (
              <FieldButton
                sx={{
                  pointerEvents: isDisabled || isNotShowing ? "none" : "auto",
                  borderRadius: config.isCircle ? "50%" : "2%",
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
          /*dontFlip= */ config.dontFlip || false,
          /*isDisabled=*/ (config.disabled &&
            config.disabled(CONTEXT_WRAPPER, key)) ||
            (config.showFunction && !config.showFunction(CONTEXT_WRAPPER, key))
        )
      : null;
  };

  const renderDynamicGamePiece = (gamePiecePosition, icon, name) => {
    if (gamePiecePosition) {
      return createFieldLocalMatchComponent(
        "Dynamic:" + name,
        gamePiecePosition[0][0],
        gamePiecePosition[0][1],
        100,
        100,
        (match) => ImageIcon(icon),
        /* dontFlip= */ gamePiecePosition[1],
        /* isDisabled= */ true
      );
    }
  };
  const getDynamicPosition = (key) => {
    if (!key) {
      return null;
    }
    if (Array.isArray(key)) {
      return [key, true];
    }

    for (const config of Object.values(SCOUTING_CONFIG)) {
      for (const positionKey of Object.keys(config.positions)) {
        if (positionKey == key) {
          return [config.positions[positionKey], false];
        }
      }
    }
  };

  const SidebarButton = ({
    id,
    flexWeight = 1,
    label,
    onClick,
    color,
    disabled = false,
    sx = {},
    show = true,
  }) => {
    const [animating, setAnimating] = useState(false);
    const onClickKeyframes = {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.2)' },
      '100%': { transform: 'scale(1)' },
    };

    if (!show) return null;

    return (
        <Button
          variant="contained"
          color={color}
          disabled={disabled}
          onClick={() => {
            setAnimating(true);
            setTimeout(() => {
              setAnimating(false);
              onClick();
            }, 100);
          }}
          sx={{
            width: "90%",
            height: "95%",
            fontSize: scaleWidthToActual(100) + "px",
            borderRadius: scaleWidthToActual(150) + "px",
            left: "5%",
            '@keyframes onClick': onClickKeyframes,
            animation: animating ? 'onClick 0.1s ease' : 'none',
            ...sx,
          }}
        >
          {label}
        </Button>
      );
  }

  const ScoutingConfigChildren = Object.values(SCOUTING_CONFIG).map((config) =>
    Object.keys(config.positions).map((position) => {
      return createScoutingConfigChild(config, position);
    })
  );

  const GROUND_PICKUPIcon = [];

  powerCellCycles.forEach((cycle, i) => {
    GROUND_PICKUPIcon.push(
      renderDynamicGamePiece(
        getDynamicPosition(cycle.attainedLocation),
        CoralIcon,
        `${GAME_PIECES.POWER_CELL}pickup${i}`
      )
    );

    GROUND_PICKUPIcon.push(
      renderDynamicGamePiece(
        getDynamicPosition(cycle.depositLocation),
        CoralIcon,
        `${GAME_PIECES.POWER_CELL}drop${i}`
      )
    );
  });

  const POST_MATCHChildren = [
    createFieldLocalMatchComponent(
      "disabled",
      250,
      100,
      500,
      150,
      (match) => <FieldButton color={COLORS.PRIMARY}>DISABLED?</FieldButton>,
      /* dontFlip= */ !(isScoringTableFar() && isScoutingRed())
    ),
    ...[150, 500].map((x, index) => {
      const value = ["no", "yes"][index];
      return createFieldLocalMatchComponent(
        `${index}DisabledMenu`,
        x,
        250,
        300,
        100,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            onClick={() => {
              match.setEndgame({ ...match.endgame, disabled: value === "yes" });
            }}
            drawBorder={match.endgame.disabled === (value === "yes")}
          >
            {value}
          </FieldButton>
        ),
        /* dontFlip= */ isScoringTableFar() != isScoutingRed()
      );
    }),
    
    //driver skill
    createFieldLocalMatchComponent(
      "driverSkill",
      250,
      500,
      500,
      150,
      (match) => <FieldButton color={COLORS.PRIMARY}>Driver Skill</FieldButton>,
      /* dontFlip= */ isScoringTableFar() != isScoutingRed()
    ),
    ...[75, 250, 425, 600, 775, 950, 1125].map((x, index) => {
      const value = ["N/A", 0, 1, 2, 3, 4, 5][index];
      return createFieldLocalMatchComponent(
        `${index}DriverSkill`,
        x,
        650,
        150,
        100,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            onClick={() => {
              match.setEndgame({ ...match.endgame, driverSkill: value });
            }}
            drawBorder={match.endgame.driverSkill === value}
          >
            {value}
          </FieldButton>
        ),
        /* dontFlip= */ isScoringTableFar() != isScoutingRed()
      );
    }),

    //defense skill
    createFieldLocalMatchComponent(
      "defenseSkill",
      250,
      900,
      500,
      150,
      (match) => (
        <FieldButton color={COLORS.PRIMARY}>Defense Skill</FieldButton>
      ),
      /* dontFlip= */ isScoringTableFar() != isScoutingRed()
    ),
    ...[75, 250, 425, 600, 775, 950, 1125].map((x, index) => {
      const value = ["N/A", 0, 1, 2, 3, 4, 5][index];
      return createFieldLocalMatchComponent(
        `${index}DefenseSkill`,
        x,
        1050,
        150,
        100,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            onClick={() => {
              match.setEndgame({ ...match.endgame, defenseSkill: value });
            }}
            drawBorder={match.endgame.defenseSkill === value}
          >
            {value}
          </FieldButton>
        ),
        /* dontFlip= */ isScoringTableFar() != isScoutingRed()
      );
    }),

    //role
    createFieldLocalMatchComponent(
      "role",
      250,
      1300,
      500,
      150,
      (match) => <FieldButton color={COLORS.PRIMARY}>Role</FieldButton>,
      /* dontFlip= */ isScoringTableFar() != isScoutingRed()
    ),
    ...[200, 575, 950, 1325].map((x, index) => {
      const value = ["N/A", "Defense", "Cycle", "Feed"][index];
      return createFieldLocalMatchComponent(
        `${index}Role`,
        x,
        1450,
        350,
        100,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            onClick={() => {
              match.setEndgame({ ...match.endgame, role: value });
            }}
            sx={{zIndex: match.endgame.role===value ? 2 : 1}}
            drawBorder={match.endgame.role === value}
          >
            {value}
          </FieldButton>
        ),
        /* dontFlip= */ isScoringTableFar() != isScoutingRed()
      );
    }),

    //comments
    createFieldLocalMatchComponent(
      "comments",
      1850,
      750,
      600,
      1400,
      (match) => (
        <>
          <label
            htmlFor="comments"
            style={{
              color: "black",
            }}
          >
            COMMENTS:
          </label>
          <textarea
            id="comments"
            onChange={(event) =>
              match.setEndgame({
                ...match.endgame,
                comments: event.target.value,
              })
            }
            style={{
              width: "100%",
              height: "100%",
            }}
          ></textarea>
        </>
      ),
      /* dontFlip= */ isScoringTableFar() != isScoutingRed()
    ),
  ];

  const getFieldCanvasOffset = () => {
    if (phase == PHASES.POST_MATCH && !isScoringTableFar()) {
      return 0;
    }
    const shift = 0;

    const defenseShift =
      isDefending() && phase != PHASES.POST_MATCH ? shift : 0;
    const offset =
      isScoutingRed() != isScoringTableFar()
        ? -shift + defenseShift
        : -defenseShift;

    return offset;
  };
  //700, 532, 168, 336, -300, 36
  //600, 456, 144, 288, -278 10
  const renderFieldCanvas = () => {
    const fieldChildren = [
      ...ScoutingConfigChildren,
      ...(phase === PHASES.POST_MATCH ? POST_MATCHChildren : []),
      ...([PHASES.AUTO, PHASES.TELE].includes(phase) ? GROUND_PICKUPIcon : []),
    ];
    return (
      <Box
        sx={{
          transform: `translateX(${getFieldCanvasOffset()}px)`,
        }}
      >
        {scaledBoxRect.width > 0 && (
          <FieldCanvas
            ref={fieldCanvasRef}
            theme={getTheme()}
            height={scaledBoxRect.height}
            perspective={scoutPerspective}
            children={fieldChildren}
            onClick={(x, y) => {
              setPowerCellCycles(prevCycles => {
                let newCycles = [...prevCycles];
                let slot = -1;
                for (let i = 0; i<prevCycles.length; i++) {
                  if (!prevCycles[i].attainedLocation){
                    slot = i;
                    break;
                  }
                }
                if (slot>=0){
                  newCycles[slot] = {attainedLocation: [Math.round(x), Math.round(y)], startTime: getCurrentTime()}
                }else{
                  console.log("ERROR")
                }
                return newCycles;
              });
            }}
            phase={phase}
          />
        )}
      </Box>
    );
  };

  const renderScoutDataLabel = () => {
    return (
      <Box
        sx={{
          backgroundColor: getTheme().palette.primary.main,
          color: getTheme().palette.primary.contrastText,
          fontSize: scaleWidthToActual(50) + "px",
          display: "flex",
          justifyContent: "center"
        }}
      >
        {scoutData ? (
          <div>
            Scout: {userToken.username} Team: {scoutData.teamNumber} Match:{" "}
            {getmatchKey()}
          </div>
        ) : (
          <div>No scout data</div>
        )}
      </Box>
    );
  };
  const renderSideBarHeader = () => {
    const iconSize = scaleWidthToActual(150);
    const fontSize = scaleWidthToActual(60);
    const scoutDataFontSize = scaleWidthToActual(50);

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          borderBottom: "1px solid #ccc",
        }}
      >
        {/* Top Row: Menu, Algae, Coral, and Current Time */}
        <Box
          sx={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Menu Icon */}
          <Button
            onClick={() => setSidebarOpen(true)}
            sx={{
              width: iconSize,
              height: iconSize,
              minWidth: 0,
              padding: 0,
            }}
          >
            <MenuIcon
              sx={{ height: "100%", width: "100%", fontSize: fontSize }}
            />
          </Button>
          {/* Power Cell Icons */}
          <Box
            sx={{
              width: "100%",
              height: iconSize,
              display: "flex",
              justifyContent: "space-evenly"
            }}
          >
            {[0, 1, 2, 3, 4].map((num) => {
              if (getNumPowerCellsInBot()>num){
                return (
                  <Box key={num} sx={{ bgcolor: "#CCCC00", width: "18%", height: "100%", borderRadius: "50%"}}></Box>
                )
              }
              return <Box key={num} sx={{ bgcolor: "rgba(0,0,0,0)", width: "18%", height: "100%", borderRadius: "50%"}}></Box>;
            })}
          </Box>
          {/* Current Time */}
          <Box
            sx={{
              width: iconSize,
              height: iconSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontSize: fontSize }}>
              {displayTime}
            </span>
          </Box>
        </Box>
        {/* Second Row: Scout Data */}
        {renderScoutDataLabel()}
      </Box>
    );
  };

  const renderSideBar = () => {
    let match = CONTEXT_WRAPPER;
    // Filter sidebar config items for the current phase.
    const configItems = SIDEBAR_CONFIG.filter((item) =>
      item.phases.includes(match.phase)
    );

    // For each config item, iterate over its positions keys.
    const buttonsList = configItems.flatMap((item) =>
      item.positions.map((key) => {
        if (!item.show(match, key)) return null;
        return (
          <Box key={key} sx={{ flex: item.flexWeight || 1 }}>
            <SidebarButton
              id={key}
              label={typeof item.label === "function"
                ? item.label(match, key)
                : item.label
              }
              onClick={() => item.onClick && item.onClick(match, key)}
              color={typeof item.color === "function"
                  ? item.color(match, key)
                  : item.color}
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
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          scaleWidthToActual={scaleWidthToActual}
          scaleHeightToActual={scaleHeightToActual}
        />

        {/* Sidebar Buttons (vertical list) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            flex: 1,
            height: "99%",
            margin: "2% 0%",
          }}
        >
          {renderSideBarHeader()}
          <Box sx={{height: "2%", bgcolor: "rgba(0,0,0,0)"}}/>
          {buttonsList.filter(Boolean)}
        </Box>
      </>
    );
  };

  const createFieldButton = ({ props }) => {};

  const resizeScaledBox = () => {
    const { width, height } = getScaledBoxDimensions();
    const rect = scaledBoxRef.current?.getBoundingClientRect() || {
      x: 0,
      y: 0,
      width: width,
      height: height,
    };
    setScaledBoxRect({
      x: rect.left,
      y: rect.top,
      width,
      height,
    });
  };

  const lockOrientation = async () => {
    try {
      await window.screen.orientation.lock("landscape");
      console.log("Orientation locked to landscape");
    } catch (error) {
      console.error("Failed to lock orientation:", error);
    }
  };

  useLayoutEffect(() => {
    lockOrientation();
    window.screen.orientation.addEventListener("change", () =>
      resizeScaledBox()
    );

    resizeScaledBox();
    window.addEventListener("resize", resizeScaledBox);
    return () => window.removeEventListener("resize", resizeScaledBox);
  }, []);

  const getmatchKey = () => {
    return searchParams.get("matchKey");
  };

  return (
    <MatchContext.Provider value={CONTEXT_WRAPPER}>
      <ThemeProvider theme={getTheme()}>
        <Box
          sx={{
            position: "relative",
            width: "100vw",
            height: "100vh",
            bgcolor: "black"
          }}
        >
          <FullscreenDialog />
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
              position: "absolute",
              top: "50%",
              left: "50%",
              width: scaledBoxRect.width,
              height: scaledBoxRect.height,
              transform: "translate(-50%, -50%)",
              background: getTheme().palette.background.default,
            }}
          >
            <Box
              sx={{
                background:
                  phase == PHASES.AUTO
                    ? getTheme().palette.autoBackground.main
                    : "",
                position: "absolute",
                left: scaleWidthToActual(sidebarVirtualWidth),
                width:
                  scaledBoxRect.width - scaleWidthToActual(sidebarVirtualWidth),
                height: scaledBoxRect.height,
                overflow: "hidden",
              }}
            >
              {renderFieldCanvas()}
            </Box>
            <Box
              sx={{
                position: "absolute",
                left: 0,
                width: scaleWidthToActual(sidebarVirtualWidth),
                height: scaledBoxRect.height,
                overflow: "hidden",
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
