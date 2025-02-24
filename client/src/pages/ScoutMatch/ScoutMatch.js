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
import MenuIcon from '@mui/icons-material/Menu';
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
} from "./Constants.js";
import { SCOUTING_CONFIG } from "./ScoutingConfig.js";

const { B1, R1, R2, R3 } = DRIVER_STATIONS;
const { SCORING_TABLE_NEAR, SCORING_TABLE_FAR } = PERSPECTIVE;

const { ACQUIRE, DEPOSIT, HANG, GO_TELE, GO_DEFENSE, GO_POST_MATCH } = ACTIONS;
const { CORAL, ALGAE } = GAME_PIECES;

// Canvas Helpers
const sidebarVirtualWidth = 1100;
const virtualWidth = FIELD_VIRTUAL_WIDTH + sidebarVirtualWidth;
const virtualHeight = FIELD_VIRTUAL_HEIGHT;
const aspectRatio = 16 / 9;

const MatchContext = createContext();

// Scout Match Component
const ScoutMatch = () => {
  const [searchParams] = useSearchParams();
  // console.log("Query Params:", searchParams.toString());
  const driverStation = searchParams.get("station") || B1;
  const teamNumber = searchParams.get("teamNumber");
  const scoutPerspective =
    searchParams.get("perspective") || PERSPECTIVE.SCORING_TABLE_NEAR;
  // console.log(driverStation, scoutPerspective);
  const context = useContext(MatchContext);
  // match state
  const [matchStartTime, setMatchStartTime] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);

  const [phase, setPhase] = useState(PHASES.PRE_MATCH);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [data, setData] = useState({
    prematch: {
      scoutName: "Name",
      driverStation,
      teamNumber,
    },
    cycles: [],
    hang: {},
    endgame: {}
  });

  const [cycles, setCycles] = useState([]);

  // robot state
  const [isDefending, setIsDefending] = useState(false);
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
    defendingTeam: null,
    startTime: null,
    endTime: null,
  });

  const [hang, setHang] = useState({
    startTime: null,
    endTime: null,
    position: null,
    height: null,
    succeeded: false,
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        matchStartTime > 0 &&
        (currentTime < 15 || (phase === PHASES.TELE && currentTime < 150))
      ) {
        setCurrentTime((prevTime) => prevTime + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [matchStartTime, phase, currentTime]);

  // Only run when coral.depositTime changes
  useEffect(() => {
    if (coral.depositTime != null) {
      setCycles([...cycles, {
        type: "coral",
        ...coral
      }]);

      console.log("coral cycle: " + JSON.stringify(coral));
      // TODO Update cycles when scored
      // Note: updateCoral re-writes the entire state intentionally.
      updateCoral({});
      clearUnfinished();
    }
  }, [coral.depositTime]);

  // Only run when algae.depositTime changes
  useEffect(() => {
    if (algae.depositTime != null) {      
      setCycles([...cycles, {
        type: "algae",
        ...algae
      }]);

      console.log("algae cycle: " + JSON.stringify(algae));
      // TODO Update cycles when scored
      setAlgae({});
      clearUnfinished();
    }
  }, [algae.depositTime]);

  useEffect(() => {
    if (coral.attainedTime != null) {      
      console.log("coral cycle: " + JSON.stringify(coral));
      // TODO Update cycles when scored
      // Note: updateCoral re-writes the entire state intentionally.
      updateCoral({});
      clearUnfinished();
    }
  }, [coral.attainedTime]);

  // Only run when algae.depositTime changes
  useEffect(() => {
    if (algae.attainedTime != null) {
      console.log("algae cycle: " + JSON.stringify(algae));
      // TODO Update cycles when scored
      setAlgae({});
      clearUnfinished();
    }
  }, [algae.attainedTime]);

  // Only run when defense.endTime changes
  useEffect(() => {
    if (defense.endTime != null) {
      setCycles([...cycles, {
        type: "defense",
        ...defense,
      }]);

      console.log("defense cycle: " + JSON.stringify(defense));
      setDefense({});
    }
  }, [defense.endTime]);

  // Only run when hang.time changes
  useEffect(() => {
    if (hang.endTime != null) {
      setData({
        ...data,
        hang
      })
      console.log("Hang: " + JSON.stringify(hang));
      setHang({});
    }
  }, [hang.endTime]);

  // TODO add sanity checks here
  const updateCoral = (updates) => {
    // intentionally re-writing the entire state,
    // the caller of this method should decide if it wants to include prior state
    setCoral(updates);
  };

  const hasCoral = () => {
    return coral.attainedTime != null;
  };

  const hasAlgae = () => {
    return algae.attainedTime != null;
  };

  // TODO add sanity checks here
  const updateAlgae = (updates) => {
    // intentionally re-writing the entire state,
    // the caller of this method should decide if it wants to include prior state
    setAlgae(updates);
  };
  const isScoutingRed = () => [R1, R2, R3].includes(driverStation);
  const isScoringTableFar = () => scoutPerspective == SCORING_TABLE_FAR;
  const flipX = () => isScoutingRed();
  const flipY = () => isScoutingRed();
  // console.log(
  //   flipX(),
  //   flipY(),
  //   isScoutingRed(),
  //   isScoringTableFar(),
  //   driverStation,
  //   scoutPerspective
  // );
  const CONTEXT_WRAPPER = {
    fieldCanvasRef,
    matchStartTime,
    setMatchStartTime,
    phase,
    setPhase,
    isDefending,
    setIsDefending,
    startingPosition,
    setStartingPosition,
    coral,
    setCoral,
    algae,
    setAlgae,
    updateCoral,
    updateAlgae,
    hasCoral,
    hasAlgae,
    hang,
    setHang,
    endgame,
    setEndgame,
    defense,
    setDefense,
    currentTime,
    isScoutingRed: isScoutingRed(),
    isScoringTableFar: isScoringTableFar(),
  };

  const createTask = (action, gamepiece = null) => ({
    action: action,
    gamepiece: gamepiece,
  });

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

  const clearUnfinished = (matchContext = CONTEXT_WRAPPER) => {
    // console.log(matchContext);
    clearUnfinishedGamepiece(matchContext.coral, matchContext.setCoral);
    clearUnfinishedGamepiece(matchContext.algae, matchContext.setAlgae);
    matchContext.setHang({});
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
      isUnfinished(matchContext.hang.position, matchContext.hang.endTime)
    );
  };

  // don't add default matchContext here
  const startAcquireGamepiece = (location, gamepiece, matchContext) => {
    console.log("acquiring: ", gamepiece, location);
    switch (gamepiece) {
      case GAME_PIECES.CORAL:
        if (!matchContext.hasCoral()) {
          matchContext.setCoral({ attainedLocation: location });
        }
        break;
      case GAME_PIECES.ALGAE:
        if (!matchContext.hasAlgae()) {
          matchContext.setAlgae({ attainedLocation: location });
        }
        break;
    }
  };

  // don't add default matchContext here
  const startDepositGamepiece = (location, gamepiece, matchContext) => {
    console.log("depositing: ", gamepiece, location);
    switch (gamepiece) {
      case GAME_PIECES.CORAL:
        if (!matchContext.hasCoral()) {
          return;
        }
        matchContext.setCoral({
          ...matchContext.coral,
          depositLocation: location,
        });
        break;
      case GAME_PIECES.ALGAE:
        if (!matchContext.hasAlgae()) {
          return;
        }
        matchContext.setAlgae({
          ...matchContext.algae,
          depositLocation: location,
        });
        break;
    }
  };

  const startHang = (location, matchContext) => {
    console.log("starting hang", location);
    matchContext.setHang({...hang, position: location, startTime: currentTime});
  };

  // actions is a map of gamepiece transformations to be executed
  const startPendingTasks = (
    location,
    tasks,
    matchContext = CONTEXT_WRAPPER
  ) => {
    clearUnfinished();

    // console.log("executing: ", actions);
    for (let i in tasks) {
      console.log(tasks[i]);
      let task = tasks[i];
      switch (task.action) {
        case ACQUIRE:
          startAcquireGamepiece(location, task.gamepiece, matchContext);
          break;
        case DEPOSIT:
          startDepositGamepiece(location, task.gamepiece, matchContext);
          break;
        case HANG:
          startHang(location, matchContext);
          break;
        case GO_TELE:
          matchContext.setPhase(PHASES.TELE);
          break;
        case GO_DEFENSE:
          matchContext.setIsDefending(!matchContext.isDefending);
          break;
        case GO_POST_MATCH:
          matchContext.setPhase(PHASES.POST_MATCH);
          break;
      }
    }
  };

  const getGamepieceState = (gamepiece, matchContext) => {
    switch (gamepiece) {
      case CORAL:
        return [matchContext.coral, matchContext.setCoral];
      case ALGAE:
        return [matchContext.algae, matchContext.setAlgae];
    }
  };
  const finishTask = (task, matchContext = CONTEXT_WRAPPER) => {
    const { action, gamepiece } = task;
    const [gamepieceState, setter] = getGamepieceState(gamepiece, matchContext);
    switch (action) {
      case ACQUIRE:
        setter({ ...gamepieceState, attainedTime: currentTime });
      case DEPOSIT:
        setter({ ...gamepieceState, depositTime: currentTime });
        break;
    }
  };

  const getTheme = () => (isScoutingRed() ? RedTheme : BlueTheme);
  const createFieldLocalMatchComponent = (
    id,
    fieldX,
    fieldY,
    fieldWidth,
    fieldHeight,
    componentFunction
  ) => {
    fieldX = flipX() ? FIELD_VIRTUAL_WIDTH - fieldX : fieldX;
    fieldY = flipY() ? FIELD_VIRTUAL_HEIGHT - fieldY : fieldY;
    return (
      <MatchContext.Consumer key={id}>
        {(match) => (
          <FieldLocalComponent
            fieldX={fieldX}
            fieldY={fieldY}
            fieldWidth={fieldWidth}
            fieldHeight={fieldHeight}
            perspective={scoutPerspective}
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
            if (config.showFunction && !config.showFunction(match, key)) {
              return;
            }
            return config.componentFunction != null ? (
              config.componentFunction(match, key)
            ) : (
              <FieldButton
                sx={{
                  borderRadius: config.isCircle ? "50%" : "2%",
                }}
                drawBorder={config.drawBorder && config.drawBorder(match, key)}
                disabled={config.disabled && config.disabled(match, key)}
                color={config.color || COLORS.ACTIVE}
                onClick={() => {
                  startPendingTasks(key, config.tasks, match);
                }}
              >
                {config.textFunction && config.textFunction(match, key)}
              </FieldButton>
            );
          }
        )
      : null;
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

  const GROUND_PICKUPIcon = [
  ]

  let looping = true;
  [[coral.attainedLocation, coral.attainedTime], 
    [coral.depositLocation, coral.depositTime], 
    [algae.attainedLocation, algae.attainedTime], 
    [algae.depositLocation, algae.depositTime]].map((values) => {
      if ([PHASES.AUTO, PHASES.TELE].includes(phase) && looping && isUnfinished(values[0], values[1]) && Array.isArray(values[0])){
        GROUND_PICKUPIcon.push(
          createFieldLocalMatchComponent(
           "disabled", 
           driverStation.includes("b") ? values[0][0] : 3500 - values[0][0], 
           driverStation.includes("b") ? values[0][1] : 1600 - values[0][1], 
           100, 
           100, 
           (match) => (
            <FieldButton color={COLORS.PRIMARY}></FieldButton>
          ))
        );

        looping = false;
      }
    })

  const POST_MATCHChildren = [
    createFieldLocalMatchComponent("disabled", 250, 100, 500, 150, (match) => (
      <FieldButton color={COLORS.PRIMARY}>DISABLED?</FieldButton>
    )),
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
        )
      );
    }),

    //driver skill
    createFieldLocalMatchComponent(
      "driverSkill",
      250,
      500,
      500,
      150,
      (match) => <FieldButton color={COLORS.PRIMARY}>Driver Skill</FieldButton>
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
        )
      );
    }),

    //defense skill
    createFieldLocalMatchComponent(
      "defenseSkill",
      250,
      900,
      500,
      150,
      (match) => <FieldButton color={COLORS.PRIMARY}>Defense Skill</FieldButton>
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
        )
      );
    }),

    //role
    createFieldLocalMatchComponent("role", 250, 1300, 500, 150, (match) => (
      <FieldButton color={COLORS.PRIMARY}>Role</FieldButton>
    )),
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
        )
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
      )
    ),
  ];

  const getFieldCanvasOffset = () => {
    const shift =
      scaledBoxRect.height * FIELD_ASPECT_RATIO -
      scaleWidthToActual(FIELD_VIRTUAL_WIDTH);

    const defenseShift =
      isDefending && phase != PHASES.POST_MATCH ? shift / 2 : 0;
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
      ...GROUND_PICKUPIcon,
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

  const renderSideBar = () => {
    let buttonsList = [];

    if (phase === PHASES.PRE_MATCH) {
      buttonsList = [
        createSidebarButton({
          id: "startMatch",
          flexWeight: 2,
          label:
            startingPosition < 0
              ? "Please select starting position"
              : "Start match",
          onClick: () => {
            setMatchStartTime(Date.now());
            setPhase(PHASES.AUTO);
            clearUnfinished();
          },
          color: startingPosition < 0 ? "disabled" : COLORS.ACTIVE,
          disabled: startingPosition < 0,
          extraSx: { width: "100%", height: "100%", fontSize: "1.5rem" },
        }),
        createSidebarButton({
          id: "preload",
          flexWeight: 1,
          label: hasCoral() ? "Has preload" : "No Preload",
          onClick: () => {
            setCoral(
              hasCoral() ? {} : { attainedLocation: "preload", attainedTime: 0 }
            );
          },
          color: hasCoral() ? COLORS.SUCCESS : COLORS.PENDING,
          extraSx: { width: "100%", height: "100%", fontSize: "1.5rem" },
          show: true,
        }),
      ].filter(Boolean);
    } else if (
      (phase === PHASES.AUTO || phase === PHASES.TELE) &&
      !isDefending &&
      hang?.startTime==null
    ) {
      // REEF SCORE BUTTONS
      Object.keys(GAME_LOCATIONS.REEF_LEVEL)
        .sort()
        .reverse()
        .forEach((level) => {
          buttonsList.push(
            createSidebarButton({
              id: `reefLevel_${level}`,
              label: `L${level}`,
              onClick: () => {
                updateCoral({
                  ...coral,
                  depositLocation: coral.depositLocation + `L${level}`,
                  depositTime: currentTime,
                });
                if (!hasAlgae()) {
                  updateAlgae({});
                }
              },
              color: COLORS.CORALDROPOFF,
              show:
                hasCoral() &&
                Object.values(GAME_LOCATIONS.REEF).includes(
                  coral.depositLocation
                ),
            })
          );
        });

      buttonsList.push(
        createSidebarButton({
          id: "DROP_CORAL",
          label: "DROP CORAL",
          onClick: () => {
            updateCoral({ ...coral, depositTime: currentTime });
          },
          color: COLORS.DROP,
          show: isUnfinished(coral.depositLocation, coral.depositTime),
        })
      );

      buttonsList.push(
        createSidebarButton({
          id: "PICKUP_ALGAE",
          label: "PICKUP ALGAE",
          onClick: () => {
            updateAlgae({ ...algae, attainedTime: currentTime });
          },
          color: COLORS.ALGAEPICKUP,
          show: isUnfinished(algae.attainedLocation, algae.attainedTime),
        })
      );

      buttonsList.push(
        createSidebarButton({
          id: "PICKUP_CORAL",
          label: "PICKUP CORAL",
          onClick: () => {
            updateCoral({ ...coral, attainedTime: currentTime });
          },
          color: COLORS.CORALPICKUP,
          show: isUnfinished(coral.attainedLocation, coral.attainedTime),
        })
      );

      // PROCESSOR/NET SCORE MENU
      if (
        algae.depositLocation === GAME_LOCATIONS.PROCESSOR ||
        algae.depositLocation === GAME_LOCATIONS.NET
      ) {
        buttonsList.push(
          createSidebarButton({
            id: "scoreProcessor",
            label: `Score ${algae.depositLocation}`,
            onClick: () => {
              updateAlgae({ ...algae, depositTime: currentTime });
            },
            color: COLORS.ALGAEDROPOFF,
            show: true,
          })
        );
      }

      buttonsList.push(
        createSidebarButton({
          id: "DROP_ALGAE",
          label: "DROP ALGAE",
          onClick: () => {
            updateAlgae({ ...algae, depositTime: currentTime });
          },
          color: COLORS.DROP,
          show: isUnfinished(algae.depositLocation, algae.depositTime),
        })
      );

      buttonsList.push(
        createSidebarButton({
          id: "cancel",
          label: "cancel",
          onClick: () => {
            clearUnfinished();
          },
          color: COLORS.PENDING,
          show: hasUnfinished(),
        })
      );
    } else if (
      phase === PHASES.AUTO ||
      (phase === PHASES.TELE && isDefending)
    ) {
      enemies.forEach((enemy, index) => {
        buttonsList.push(
          createSidebarButton({
            id: `defense_${index}`,
            label: `${enemy}`,
            onClick: () => {
              setDefense({
                startTime: currentTime,
                defendingTeam: enemy,
                endTime: null,
              });
            },
            color: COLORS.PENDING,
            show: defense.defendingTeam == null,
          })
        );
      });
      buttonsList.push(
        createSidebarButton({
          id: "stopDefending",
          label: "STOP DEFENDING",
          onClick: () => {
            setDefense({ ...defense, endTime: currentTime });
          },
          color: COLORS.PENDING,
          show: defense.defendingTeam != null,
        })
      );
    } else if (phase === PHASES.TELE && hang?.startTime!=null) {
      if (hang.height==null){
        Object.values(GAME_LOCATIONS.HANG_LEVEL).forEach((height, index) => {
          buttonsList.push(
            createSidebarButton({
              id: `hangDepth_${index}`,
              label: `${height}`,
              onClick: () => {
                setHang({ ...hang, height });
              },
              color: COLORS.PENDING,
              show: true,
            })
          );
        });
        buttonsList.push(
          createSidebarButton({
            id: "cancelHang",
            label: "CANCEL",
            onClick: () => {
              setHang({ startTime: null, endTime: null, position: null, depth: null, succeeded: false, });
            },
            color: COLORS.PENDING,
            show: true,
          })
        );
      }
      else {
        Object.values(GAME_LOCATIONS.HANG_STATE).forEach((state, index) => {
          buttonsList.push(
            createSidebarButton({
              id: `hangState_${index}`,
              label: `${state}`,
              onClick: () => {
                setHang({ ...hang, succeeded: state==GAME_LOCATIONS.HANG_STATE.SUCCEED, endTime: currentTime });
              },
              color: COLORS.PENDING,
              show: true,
            })
          );
        });
        buttonsList.push(
          createSidebarButton({
            id: "cancelHangState",
            label: "CANCEL",
            onClick: () => {
              setHang({ startTime: null, endTime: null, position: null, depth: null, succeeded: false, });
            },
            color: COLORS.PENDING,
            show: true,
          })
        );
      }
    } else if (phase === PHASES.POST_MATCH) {
      buttonsList.push(
        createSidebarButton({
          id: "submit",
          label: "SUBMIT",
          onClick: () => {
            console.log("cycles: ", cycles)
            setData({
              ...data,
              endgame,
              cycles,
            });

            console.log({
              ...data,
              endgame,
              cycles,
            });

            setMatchStartTime(-1);
            setCurrentTime(0);
            setPhase(PHASES.PRE_MATCH);

            // robot state
            setIsDefending(false);
            setStartingPosition(-1);
            setCoral({
              attainedLocation: null,
              attainedTime: null,
              depositLocation: null,
              depositTime: null,
            });
            setAlgae({
              attainedLocation: null,
              attainedTime: null,
              depositLocation: null,
              depositTime: null,
            });
            setDefense({
              defendingTeam: null,
              startTime: null,
              endTime: null,
            });
            setHang({
              startTime: null,
              endTime: null,
              position: null,
              height: null,
              succeeded: false,
            });
            setEndgame({
              disabled: false,
              driverSkill: "N/A",
              defenseSkill: "N/A",
              role: "N/A",
              comments: "",
            });
          },
          color: COLORS.PENDING,
          show: true,
        })
      );
    }

    return (<>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} scaleWidthToActual={scaleWidthToActual} scaleHeightToActual={scaleHeightToActual}/>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: "10%",
          overflowX: "auto",
        }}
      >
        <Button
          sx={{
            width: "90%",
            height: "90%",
          }}
          onClick={() => setSidebarOpen(true)}
        >
          <MenuIcon />
        </Button>
        <Box
          sx={{
            width: "90%",
            height: "90%",
          }}
        >
          <img 
            src={AlgaeIcon} 
              style={{
                width: "auto%", 
                height: "90%",
                visibility: hasAlgae() ? "visible" : "hidden"
              }}></img>
        </Box>
        <Box
          sx={{
            width: "90%",
            height: "90%",
          }}
        >
          <img 
            src={CoralIcon} 
            style={{
              width: "auto%", 
              height: "90%",
              visibility: hasCoral() ? "visible" : "hidden"
            }}></img>
        </Box>
        <Box
          sx={{
            width: "90%",
            height: "90%",
          }}
        >
          <h2 style={{color: 'black', marginTop: '30%'}}>{currentTime}</h2>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "90%",
          backgroundColor: getTheme().palette.background.paper,
          overflowY: "auto",
        }}
      >
        {buttonsList.filter(Boolean).map((button, index) => (
          <Box
            key={index}
            sx={{
              flex: button.flexWeight || 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 0,
            }}
          >
            {button.component}
          </Box>
        ))}
      </Box>
    </>);
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
