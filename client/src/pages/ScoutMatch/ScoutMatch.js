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

import AlgaeIcon from "../../assets/scouting-2025/algaeIcon.png";
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
} from "./Constants.js";
import { SCOUTING_CONFIG } from "./ScoutingConfig.js";
import { getScoutMatch } from "../../requests/ApiRequests.js";
import { ImageIcon } from "./CustomFieldComponents.js";
import MissingParamsDialog from "./MissingParamsDialog.js";
import { SIDEBAR_CONFIG } from "./SidebarConfig.js";
import { getSignedInUser } from "../../TokenUtils.js";

const { B1, R1, R2, R3 } = DRIVER_STATIONS;
const { SCORING_TABLE_NEAR, SCORING_TABLE_FAR } = PERSPECTIVE;

const {
  ACQUIRE,
  DEPOSIT,
  FINISH,
  HANG_ENTER,
  HANG_CAGE_TOUCH,
  HANG_COMPLETE,
  GO_TELE,
  GO_DEFENSE,
  GO_POST_MATCH,
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
      !searchParams.get("matchCode") ||
      !searchParams.get("station")
    ) {
      setSearchParamsError("Missing search params");
    } else if (!scoutData) {
      fetchScoutMatchData();
    }
  }, [searchParams]);

  const handleMissingParamsSubmit = ({ eventKey, matchCode, station }) => {
    setSearchParams({ eventKey, matchCode, station });
  };

  const eventKey = searchParams.get("eventKey");
  const matchCode = searchParams.get("matchCode");
  const driverStation = searchParams.get("station") || B1;

  const scoutPerspective =
    searchParams.get("perspective") || PERSPECTIVE.SCORING_TABLE_NEAR;

  const [scoutData, setScoutData] = useState(null);

  const [matchStartTime, setMatchStartTime] = useState(null);
  const getCurrentTime = () => {
    return Math.min(
      phase == PHASES.AUTO ? AUTO_MAX_TIME : TELE_MAX_TIME,
      matchStartTime == null ? 0 : Date.now() - matchStartTime
    );
  };
  const [displayTime, setDisplayTime] = useState(0);

  const [phase, setPhase] = useState(PHASES.PRE_MATCH);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [cycles, setCycles] = useState([]);

  // robot state
  // const [isDefending, setIsDefending] = useState(false);

  const [startingPosition, setStartingPosition] = useState(-1);

  const [coral, setCoral] = useState({
    attainedLocation: null,
    attainedTime: null,
    depositLocation: null,
    depositTime: null,
  });

  const [algae, setAlgae] = useState({
    attainedLocation: null, // if not null, pickup is pending
    attainedTime: null, // if not null, holding gamepiece
    depositLocation: null,
    depositTime: null,
  });

  const [defense, setDefense] = useState({
    enterTime: null,
    exitTime: null,
  });
  const isDefending = () => isUnfinished(defense.enterTime, defense.exitTime);

  const [contact, setContact] = useState({
    startTime: null,
    endTime: null,
    robot: null,
    pin_count: null,
    foul_count: null,
  });

  const [hang, setHang] = useState({
    enterTime: null, // when robot enters under barge
    cageTouchTime: null, // when robot touches cage
    completeTime: null, // when robot off the floor
    location: null, // LEFT MIDDLE RIGHT
    cageType: null,
    result: null, // will be entered after match score released PARK // SUCCESS
  });

  const [endgame, setEndgame] = useState({
    disabled: false,
    driverSkill: "N/A",
    defenseSkill: "N/A",
    role: "N/A",
    comments: "",
  });

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
  const allies = [7558, 188, 1325];
  const enemies = [1, 2, 3];

  const fetchScoutMatchData = async () => {
    if (!eventKey || !driverStation || !matchCode) {
      console.error("Missing eventKey, station, or matchCode in URL.");
      return;
    }
    try {
      const response = await getScoutMatch({
        eventKey,
        station: driverStation,
        matchCode,
      });
      setScoutData(response.data);
      setSearchParamsError(null);
      console.log("Fetched scout match data:", response.data);
    } catch (err) {
      setSearchParamsError(err.response?.data?.message);
      console.error("Error fetching scout match data:", err);
    }
  };
  const getDisplayTime = () => {
    let displayTime = null;
    if (phase == PHASES.AUTO) {
      displayTime = AUTO_MAX_TIME - getCurrentTime();
    } else if (phase == PHASES.TELE) {
      displayTime = TELE_MAX_TIME - getCurrentTime();
    }

    return displayTime != null ? Math.round(displayTime / 1000) : "- - -";
  };
  useEffect(() => {
    setDisplayTime(getDisplayTime()); //first time
    const interval = setInterval(() => {
      setDisplayTime(getDisplayTime);
    }, 500); // 500 ms to make sure we don't skip a number

    return () => clearInterval(interval);
  }, [matchStartTime, phase]);

  const getCycle = (cycleType) => {
    switch (cycleType) {
      case CYCLE_TYPES.ALGAE:
        return algae;
      case CYCLE_TYPES.CORAL:
        return coral;
      case CYCLE_TYPES.CONTACT:
        return contact;
      case CYCLE_TYPES.DEFENSE:
        return defense;
      case CYCLE_TYPES.HANG:
        return hang;
    }
  };

  const getWritableCycle = (cycleType) => {
    return {
      phase,
      type: cycleType,
      ...getCycle(cycleType),
    };
  };

  const terminateCycle = (
    cycleType,
    terminator,
    cleanupFunction,
    skipTerminator = false
  ) => {
    const cycle = getCycle(cycleType);
    if (terminator != null || skipTerminator) {
      console.log(`Terminating ${cycleType} cycle: ${JSON.stringify(cycle)}`);
      setCycles([...cycles, getWritableCycle(cycleType)]);
      cleanupFunction();
    }
  };

  useEffect(() => {
    terminateCycle(CYCLE_TYPES.CORAL, coral.depositTime, () => setCoral({}));
    terminateCycle(CYCLE_TYPES.ALGAE, algae.depositTime, () => setAlgae({}));
    terminateCycle(CYCLE_TYPES.DEFENSE, defense.exitTime, () => setDefense({}));
    terminateCycle(CYCLE_TYPES.CONTACT, contact.endTime, () => setContact({}));
    terminateCycle(CYCLE_TYPES.HANG, hang.result, () => setHang({}));
    clearUnfinished();
  }, [
    coral.depositTime,
    algae.depositTime,
    defense.exitTime,
    contact.endTime,
    hang.result,
  ]);

  useEffect(() => {
    if (coral.attainedTime != null) {
      console.log("coral cycle progress: " + JSON.stringify(coral));
      clearUnfinished();
    }
  }, [coral.attainedTime]);

  useEffect(() => {
    if (algae.attainedTime != null) {
      console.log("algae cycle progress: " + JSON.stringify(algae));
      clearUnfinished();
    }
  }, [algae.attainedTime]);

  const hasCoral = () => {
    return coral.attainedTime != null;
  };

  const hasAlgae = () => {
    return algae.attainedTime != null;
  };

  useEffect(() => {
    if (hang.completeTime != null) {
      endMatch();
    }
  }, [hang.completeTime]);

  const isScoutingRed = () => [R1, R2, R3].includes(driverStation);
  const isScoringTableFar = () => scoutPerspective == SCORING_TABLE_FAR;
  const flipX = () => isScoutingRed();
  const flipY = () => isScoutingRed();

  const clearUnfinished = (matchContext = CONTEXT_WRAPPER) => {
    // console.log(matchContext);
    clearUnfinishedGamepiece(matchContext.coral, matchContext.setCoral);
    clearUnfinishedGamepiece(matchContext.algae, matchContext.setAlgae);
    matchContext.setHang({});
    matchContext.setContact({});
  };

  const isUnfinished = (location, time) => location != null && time == null;
  const hasUnfinished = (matchContext = CONTEXT_WRAPPER) => {
    return (
      isUnfinished(
        matchContext.coral.attainedLocation,
        matchContext.coral.attainedTime
      ) ||
      isUnfinished(
        matchContext.coral.depositLocation,
        matchContext.coral.depositTime
      ) ||
      isUnfinished(
        matchContext.algae.attainedLocation,
        matchContext.algae.attainedTime
      ) ||
      isUnfinished(
        matchContext.algae.depositLocation,
        matchContext.algae.depositTime
      ) ||
      isUnfinished(
        matchContext.hang.enterTime,
        matchContext.hang.completeTime
      ) ||
      isUnfinished(matchContext.contact.startTime, matchContext.contact.endTime)
    );
  };
  const shouldWriteCycle = (cycleType) => {
    switch (cycleType) {
      case CYCLE_TYPES.ALGAE:
        return isUnfinished(algae.attainedTime, algae.depositTime);
      case CYCLE_TYPES.CORAL:
        return isUnfinished(coral.attainedTime, coral.depositTime);
      case CYCLE_TYPES.CONTACT:
        return isUnfinished(contact.startTime, algae.endTime);
      case CYCLE_TYPES.DEFENSE:
        return isUnfinished(defense.enterTime, defense.endTime);
      case CYCLE_TYPES.HANG:
        return isUnfinished(hang.startTime, hang.result);
    }
  };

  const CONTEXT_WRAPPER = {
    fieldCanvasRef,
    matchStartTime,
    setMatchStartTime,
    phase,
    setPhase,
    isDefending,
    startingPosition,
    setStartingPosition,
    coral,
    setCoral,
    algae,
    setAlgae,
    hasCoral,
    hasAlgae,
    hang,
    setHang,
    endgame,
    setEndgame,
    defense,
    setDefense,
    getCurrentTime,
    isScoutingRed: isScoutingRed(),
    isScoringTableFar: isScoringTableFar(),
    isUnfinished,
    clearUnfinished,
    hasUnfinished,
    scoutData,
    contact,
    setContact,
  };

  const createTask = (action, gamepiece = null) => ({
    action: action,
    gamepiece: gamepiece,
  });

  const getGamepieceState = (gamepiece, matchContext) => {
    switch (gamepiece) {
      case CORAL:
        return [matchContext.coral, matchContext.setCoral];
      case ALGAE:
        return [matchContext.algae, matchContext.setAlgae];
    }
  };

  const clearUnfinishedGamepiece = (gamepieceState, setter) => {
    if (gamepieceState?.attainedTime == null) {
      setter({});
      return;
    }
    if (gamepieceState?.depositTime == null) {
      setter({ ...gamepieceState, depositLocation: null });
      return;
    }
  };

  // don't add default matchContext here
  const startAcquireGamepiece = (location, gamepiece, matchContext) => {
    const [gamepieceState, setter] = getGamepieceState(gamepiece, matchContext);
    console.log("acquiring: ", gamepiece, location);
    if (gamepieceState?.attainedTime == null) {
      setter({ attainedLocation: location });
    }
  };

  // don't add default matchContext here
  const startDepositGamepiece = (location, gamepiece, matchContext) => {
    const [gamepieceState, setter] = getGamepieceState(gamepiece, matchContext);
    console.log("depositing: ", gamepiece, location);
    if (gamepieceState?.attainedTime == null) {
      return;
    }
    setter({ ...gamepieceState, depositLocation: location });
  };

  const finishGamepiece = (location, gamepiece, matchContext) => {
    const [gamepieceState, setter] = getGamepieceState(gamepiece, matchContext);
    if (
      isUnfinished(gamepieceState.attainedLocation, gamepieceState.attainedTime)
    ) {
      setter({ ...gamepieceState, attainedTime: getCurrentTime() });
    } else if (
      isUnfinished(gamepieceState.depositLocation, gamepieceState.depositTime)
    ) {
      setter({ ...gamepieceState, depositTime: getCurrentTime() });
    }
  };

  const endMatch = () => {
    console.log(
      [
        ...cycles,
        shouldWriteCycle(CYCLE_TYPES.ALGAE) &&
          getWritableCycle(CYCLE_TYPES.ALGAE),
        shouldWriteCycle(CYCLE_TYPES.CORAL) &&
          getWritableCycle(CYCLE_TYPES.CORAL),
        shouldWriteCycle(CYCLE_TYPES.DEFENSE) && {
          ...getWritableCycle(CYCLE_TYPES.DEFENSE),
          exitTime: getCurrentTime(),
        },
        shouldWriteCycle(CYCLE_TYPES.CONTACT) && {
          ...getWritableCycle(CYCLE_TYPES.CONTACT),
          endTime: getCurrentTime(),
        },
        shouldWriteCycle(CYCLE_TYPES.HANG) &&
          getWritableCycle(CYCLE_TYPES.HANG),
      ].filter((x) => x)
    );
  };
  // actions is a map of gamepiece transformations to be executed
  const startPendingTasks = (
    location,
    tasks,
    matchContext = CONTEXT_WRAPPER
  ) => {
    if (![PHASES.PRE_MATCH, PHASES.AUTO, PHASES.TELE].includes(phase)) {
      return;
    }
    clearUnfinished();
    // console.log(matchContext.hang);
    // console.log("executing: ", actions);
    for (let i in tasks) {
      // console.log(tasks[i]);
      let task = tasks[i];
      switch (task.action) {
        case ACQUIRE:
          startAcquireGamepiece(location, task.gamepiece, matchContext);
          break;
        case DEPOSIT:
          startDepositGamepiece(location, task.gamepiece, matchContext);
          break;
        case FINISH:
          finishGamepiece(location, task.gamepiece, matchContext);
          break;
        case HANG_ENTER:
          matchContext.setHang({
            enterTime: getCurrentTime(),
          });
          break;
        case HANG_CAGE_TOUCH:
          matchContext.setHang({
            ...matchContext.hang,
            cageLocation: location,
            cageTouchTime: getCurrentTime(),
          });
          break;
        case HANG_COMPLETE:
          matchContext.setHang({
            ...matchContext.hang,
            completeTime: getCurrentTime(),
          });
          break;
        case GO_TELE:
          matchContext.setPhase(PHASES.TELE);
          break;
        case GO_DEFENSE:
          matchContext.setDefense(
            matchContext.isDefending()
              ? { ...matchContext.defense, exitTime: getCurrentTime() }
              : { enterTime: getCurrentTime() }
          );
          break;
        case GO_POST_MATCH:
          endMatch();
          break;
      }
    }
  };

  const getTheme = () => (isScoutingRed() ? RedTheme : BlueTheme);
  const createFieldLocalMatchComponent = (
    id,
    fieldX,
    fieldY,
    fieldWidth,
    fieldHeight,
    componentFunction,
    dontFlip = false,
    isDisabled = false
  ) => {
    if (!dontFlip) {
      fieldX = flipX() ? FIELD_VIRTUAL_WIDTH - fieldX : fieldX;
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
            sx={{ pointerEvents: isDisabled ? "none" : "auto" }}
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
            const isDisabled = config.disabled && config.disabled(match, key);
            if (config.showFunction && !config.showFunction(match, key)) {
              return;
            }
            return config.componentFunction != null ? (
              config.componentFunction(match, key)
            ) : (
              <FieldButton
                sx={{
                  pointerEvents: isDisabled ? "none" : "auto",
                  borderRadius: config.isCircle ? "50%" : "2%",
                }}
                drawBorder={config.drawBorder && config.drawBorder(match, key)}
                disabled={isDisabled}
                color={config.color || COLORS.ACTIVE}
                onClick={() => {
                  startPendingTasks(key, config.tasks, match);
                }}
              >
                {config.textFunction && config.textFunction(match, key)}
              </FieldButton>
            );
          },
          /*dontFlip= */ false,
          /*isDisabled=*/ config.disabled &&
            config.disabled(CONTEXT_WRAPPER, key)
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

  const createSidebarButton = ({
    id,
    flexWeight = 1,
    label,
    onClick,
    color,
    disabled = false,
    sx = {},
    show = true,
  }) => {
    if (!show) return null;
    return {
      id,
      flexWeight,
      component: (
        <Button
          variant="contained"
          color={color}
          disabled={disabled}
          onClick={onClick}
          sx={{
            width: "90%",
            height: "90%",
            fontSize: scaleWidthToActual(100) + "px",
            borderRadius: scaleWidthToActual(150) + "px",
            ...sx,
          }}
        >
          {label}
        </Button>
      ),
    };
  };

  const ScoutingConfigChildren = Object.values(SCOUTING_CONFIG).map((config) =>
    Object.keys(config.positions).map((position) => {
      return createScoutingConfigChild(config, position);
    })
  );

  const GROUND_PICKUPIcon = [];

  GROUND_PICKUPIcon.push(
    renderDynamicGamePiece(
      getDynamicPosition(coral.attainedLocation),
      CoralIcon,
      GAME_PIECES.CORAL
    )
  );
  GROUND_PICKUPIcon.push(
    renderDynamicGamePiece(
      getDynamicPosition(algae.attainedLocation),
      AlgaeIcon,
      GAME_PIECES.ALGAE
    )
  );
  GROUND_PICKUPIcon.push(
    renderDynamicGamePiece(
      getDynamicPosition(coral.depositLocation),
      CoralIcon,
      "dropoff-coral"
    )
  );
  GROUND_PICKUPIcon.push(
    renderDynamicGamePiece(
      getDynamicPosition(algae.depositLocation),
      AlgaeIcon,
      "dropoff-algae"
    )
  );

  // let looping = true;
  // [
  //   [coral.attainedLocation, coral.attainedTime],
  //   [coral.depositLocation, coral.depositTime],
  //   [algae.attainedLocation, algae.attainedTime],
  //   [algae.depositLocation, algae.depositTime],
  // ].map((values) => {
  //   if (
  //     [PHASES.AUTO, PHASES.TELE].includes(phase) &&
  //     looping &&
  //     isUnfinished(values[0], values[1]) &&
  //     Array.isArray(values[0])
  //   ) {
  //     GROUND_PICKUPIcon.push(
  //       createFieldLocalMatchComponent(
  //         "disabled",
  //         values[0][0],
  //         values[0][1],
  //         100,
  //         100,
  //         (match) => <FieldButton color={COLORS.PRIMARY}></FieldButton>,
  //         /* dontFlip= */ true
  //       )
  //     );

  //     looping = false;
  //   }
  // });

  const POST_MATCHChildren = [
    createFieldLocalMatchComponent(
      "disabled",
      250,
      100,
      500,
      150,
      (match) => <FieldButton color={COLORS.PRIMARY}>DISABLED?</FieldButton>,
      /* dontFlip= */ !isScoringTableFar()
    ),
    ...[150, 600].map((x, index) => {
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
        /* dontFlip= */ !isScoringTableFar()
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
      /* dontFlip= */ !isScoringTableFar()
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
        /* dontFlip= */ !isScoringTableFar()
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
      /* dontFlip= */ !isScoringTableFar()
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
        /* dontFlip= */ !isScoringTableFar()
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
      /* dontFlip= */ !isScoringTableFar()
    ),
    ...[200, 575, 950, 1325].map((x, index) => {
      const value = ["N/A", "Defense", "Coral Cycle", "Algae Cycle"][index];
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
            drawBorder={match.endgame.role === value}
          >
            {value}
          </FieldButton>
        ),
        /* dontFlip= */ !isScoringTableFar()
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
      /* dontFlip= */ !isScoringTableFar()
    ),
  ];

  const getFieldCanvasOffset = () => {
    if (phase == PHASES.POST_MATCH) {
      return 0;
    }
    const shift =
      scaledBoxRect.height * FIELD_ASPECT_RATIO -
      scaleWidthToActual(FIELD_VIRTUAL_WIDTH);

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
              startPendingTasks(
                [x, y],
                [
                  hasCoral()
                    ? createTask(DEPOSIT, CORAL)
                    : createTask(ACQUIRE, CORAL),
                  hasAlgae()
                    ? createTask(DEPOSIT, ALGAE)
                    : createTask(ACQUIRE, ALGAE),
                ]
              );
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
        }}
      >
        {scoutData ? (
          <div>
            Scout: {userToken.username} Team: {scoutData.teamNumber} Match:{" "}
            {getMatchCode()}
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
          {/* Algae Icon */}
          <Box
            sx={{
              width: iconSize,
              height: iconSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasAlgae() && ImageIcon(AlgaeIcon)}
          </Box>
          {/* Coral Icon */}
          <Box
            sx={{
              width: iconSize * 2,
              height: iconSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasCoral() && ImageIcon(CoralIcon)}
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
            <span style={{ color: "black", fontSize: fontSize }}>
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
            {
              createSidebarButton({
                id: key,
                label:
                  typeof item.label === "function"
                    ? item.label(match, key)
                    : item.label,
                onClick: () =>
                  item.tasks != null
                    ? startPendingTasks(key, item.tasks, match)
                    : item.onClick && item.onClick(match, key),
                color:
                  typeof item.color === "function"
                    ? item.color(match, key)
                    : item.color,
                sx: item.sx,
                flexWeight: item.flexWeight || 1,
                disabled: item.isDisabled && item.isDisabled(match, key),
              }).component
            }
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
            height: "100%",
          }}
        >
          {renderSideBarHeader()}
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

  // Use a useLayoutEffect so measurement occurs before paint
  useLayoutEffect(() => {
    resizeScaledBox();
    window.addEventListener("resize", resizeScaledBox);
    return () => window.removeEventListener("resize", resizeScaledBox);
  }, []);

  const getMatchCode = () => {
    if (scoutData) {
      return (
        scoutData.comp_level +
        scoutData.match_number +
        (scoutData.comp_level !== "qm" ? scoutData.set_number : "")
      );
    }
  };

  return (
    <MatchContext.Provider value={CONTEXT_WRAPPER}>
      <ThemeProvider theme={getTheme()}>
        <Box
          sx={{
            position: "relative",
            width: "100vw",
            height: "100vh",
          }}
        >
          {/* <FullscreenDialog /> */}
          <MissingParamsDialog
            open={searchParamsError != null}
            searchParams={searchParams}
            searchParamsError={searchParamsError}
            onSubmit={handleMissingParamsSubmit}
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
