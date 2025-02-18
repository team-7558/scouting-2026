import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  createContext,
  useCallback,
  useLayoutEffect, // <-- Added if not already imported
} from "react";
import { ThemeProvider } from "@mui/material/styles";
import Slider from "@mui/material/Slider";
import { BlueTheme } from "./themes/BlueTheme.js";

import { Box, Button } from "@mui/material";
import { FieldCanvas, FieldLocalComponent } from "../FieldCanvas.js";
import FullscreenDialog from "./FullScreenDialog.js";

import AlgaeIcon from "../../assets/scouting-2025/algaeIcon.png";
import CoralIcon from "../../assets/scouting-2025/coralIcon.png";

// Import locations and positions from Constants.js
import {
  GAME_LOCATIONS,
  POSITIONS,
  ACTIONS,
  GAME_PIECES,
} from "./Constants.js";
const { ACQUIRE, DEPOSIT, HANG } = ACTIONS;
const { CORAL, ALGAE } = GAME_PIECES;

const COLORS = {
  PENDING: "info",
  SUCCESS: "success",
  DISABLED: "disabled",
  ACTIVE: "primary",
  CORALPICKUP: "coralPickup",
  ALGAEPICKUP: "algaePickup",
  CORALDROPOFF: "coralDropoff",
  ALGAEDROPOFF: "algaeDropoff",
  DROP: "warning",
  CANCEL: "error",
};

// Canvas Helpers
const sidebarVirtualWidth = 1100;
const virtualWidth = 3510 + sidebarVirtualWidth;
const virtualHeight = 1610;
const aspectRatio = 16 / 9;

const MatchContext = createContext();

// Scout Match Component
const ScoutMatch = ({ driverStation, teamNumber, scoutPerspective }) => {
  const createFieldLocalMatchComponent = (
    id,
    fieldX,
    fieldY,
    fieldWidth,
    fieldHeight,
    componentFunction
  ) => {
    return (
      <MatchContext.Consumer key={id}>
        {(match) => (
          <FieldLocalComponent
            fieldX={fieldX - fieldWidth / 2}
            fieldY={fieldY - fieldHeight / 2}
            fieldWidth={fieldWidth}
            fieldHeight={fieldHeight}
          >
            {componentFunction(match)}
          </FieldLocalComponent>
        )}
      </MatchContext.Consumer>
    );
  };

  const context = useContext(MatchContext);
  // match state
  const [matchStartTime, setMatchStartTime] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const PHASES = {
    PREMATCH: "prematch",
    AUTO: "auto",
    TELE: "tele",
    ENDGAME: "endgame",
    POSTMATCH: "postmatch",
  };
  const [phase, setPhase] = useState(PHASES.PREMATCH);

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
    time: null,
    position: null,
    height: null,
  });

  const [endgame, setEndgame] = useState({
    disabled: false,
    driverSkill: "N/A",
    defenseSkill: "N/A",
    role: "N/A",
    comments: "",
  });

  //TODO: replace with real teams.
  const allies = [7558, 188, 1325];
  const enemies = [2056, 4039, 9785];

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
      console.log("defense cycle: " + JSON.stringify(defense));
      setDefense({});
    }
  }, [defense.endTime]);

  // Only run when hang.time changes
  useEffect(() => {
    if (hang.time != null) {
      console.log("Hang: " + JSON.stringify(hang));
      setHang({});
    }
  }, [hang.time]);

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

  const CONTEXT_WRAPPER = {
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
      isUnfinished(matchContext.hang.position, matchContext.hang.time)
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
        matchContext.setCoral({
          ...matchContext.coral,
          depositLocation: location,
        });
        break;
      case GAME_PIECES.ALGAE:
        matchContext.setAlgae({
          ...matchContext.algae,
          depositLocation: location,
        });
        break;
    }
  };

  const startHang = (location, matchContext) => {
    console.log("starting hang", location);
    matchContext.setHang(location);
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
      }
    }
  };

  const StartingPositionSlider = (match) => {
    const leftIsOnTop = true;
    const flipSlider = -1 * leftIsOnTop;

    return (
      <Slider
        orientation="vertical"
        value={match.startingPosition * flipSlider}
        onChange={(event, value) => match.setStartingPosition(Math.abs(value))}
        min={13 * flipSlider}
        max={1 * flipSlider}
        step={1}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => <div>{Math.abs(value)}</div>}
        sx={{
          "margin-top": scaleHeightToActual(150),
          "margin-bottom": scaleHeightToActual(150),
          padding: 0,
          "& .MuiSlider-thumb": {
            "background-image": `url("https://i.imgur.com/TqGjfyf.jpg")`,
            width: fieldCanvasRef.current?.scaleWidthToActual(300) || 0,
            height: fieldCanvasRef.current?.scaleHeightToActual(300) || 0,
            margin: 0,
            "background-position": "center",
            "background-size": "cover",
            "border-radius": 0,
          },
          "& .MuiSlider-track": {
            color:
              match.startingPosition == -1 ? COLORS.DISABLED : COLORS.ACTIVE,
          },
          "& .MuiSlider-rail": {
            color:
              match.startingPosition == -1 ? COLORS.DISABLED : COLORS.ACTIVE,
          },
        }}
      />
    );
  };

  const PrematchChildren = [
    createFieldLocalMatchComponent(
      "startingPositionSlider",
      POSITIONS[GAME_LOCATIONS.STARTING_LINE][0],
      POSITIONS[GAME_LOCATIONS.STARTING_LINE][1],
      0,
      1310,
      StartingPositionSlider
    ),
  ];

  const coralMarkKeys = [
    GAME_LOCATIONS.CORAL_MARK.LEFT,
    GAME_LOCATIONS.CORAL_MARK.MIDDLE,
    GAME_LOCATIONS.CORAL_MARK.RIGHT,
  ];
  const AutoChildren = [
    ...coralMarkKeys.map((key) => {
      const [x, y] = POSITIONS[key];
      return createFieldLocalMatchComponent(key, x, y, 200, 200, (match) => (
        <FieldButton
          color={COLORS.SUCCESS}
          drawBorder={
            (match.coral.attainedLocation === key && !match.hasCoral()) ||
            (match.algae.attainedLocation === key && !match.hasAlgae())
          }
          sx={{ borderRadius: "50%" }}
          disabled={match.hasAlgae() && match.hasCoral()}
          onClick={() => {
            startPendingTasks(
              key,
              [createTask(ACQUIRE, CORAL), createTask(ACQUIRE, ALGAE)],
              match
            );
          }}
        ></FieldButton>
      ));
    }),
    // Next phase (Tele) button
    createFieldLocalMatchComponent(
      "nextPhase",
      2000,
      850,
      250,
      250,
      (match) => (
        <FieldButton
          color={COLORS.ACTIVE}
          onClick={() => {
            match.setPhase(PHASES.TELE);
          }}
        >
          TELE
        </FieldButton>
      )
    ),
  ];

  // AutoTeleChildren: Update coral station and reef buttons
  const coralStationKeys = [
    GAME_LOCATIONS.CORAL_STATION.LEFT,
    GAME_LOCATIONS.CORAL_STATION.RIGHT,
  ];
  const AutoTeleChildren = [
    // Coral Stations
    Object.keys(GAME_LOCATIONS.CORAL_STATION).map((position, index) => {
      const coralKey = GAME_LOCATIONS.CORAL_STATION[position];
      const [x, y] = POSITIONS[coralKey];
      return createFieldLocalMatchComponent(
        coralKey,
        x,
        y,
        450,
        250,
        (match) => (
          <FieldButton
            color={COLORS.ACTIVE}
            disabled={match.hasCoral()}
            onClick={() => {
              startPendingTasks(
                coralKey,
                [
                  {
                    action: ACQUIRE,
                    gamepiece: GAME_PIECES.CORAL,
                  },
                ],
                match
              );
            }}
            drawBorder={
              !match.hasCoral() && match.coral.attainedLocation === coralKey
            }
          >
            Coral Station {position}
          </FieldButton>
        )
      );
    }),
    // Reef Buttons
    Object.keys(GAME_LOCATIONS.REEF).map((position, index) => {
      const reefKey = GAME_LOCATIONS.REEF[position];
      const [x, y] = POSITIONS[reefKey];
      return createFieldLocalMatchComponent(
        reefKey,
        x,
        y,
        200,
        200,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            disabled={!match.hasCoral() && match.hasAlgae()}
            onClick={() => {
              startPendingTasks(
                reefKey,
                [createTask(DEPOSIT, CORAL), createTask(ACQUIRE, ALGAE)],
                match
              );
            }}
            drawBorder={
              (match.coral.depositLocation === reefKey &&
                match.coral.depositTime == null) ||
              (!match.hasAlgae() && match.algae.attainedLocation === reefKey)
            }
            sx={{ borderRadius: "50%" }}
          >
            {position}
          </FieldButton>
        )
      );
    }),
    // Score Processor button
    createFieldLocalMatchComponent(
      "scoreProcessor",
      POSITIONS[GAME_LOCATIONS.PROCESSOR][0],
      POSITIONS[GAME_LOCATIONS.PROCESSOR][1],
      500,
      200,
      (match) => (
        <FieldButton
          color={COLORS.ACTIVE}
          disabled={!match.hasAlgae()}
          onClick={() => {
            startPendingTasks(
              GAME_LOCATIONS.PROCESSOR,
              [createTask(DEPOSIT, ALGAE)],
              match
            );
          }}
        >
          Score Processor
        </FieldButton>
      )
    ),
    // Score Net button
    createFieldLocalMatchComponent(
      "scoreNet",
      POSITIONS[GAME_LOCATIONS.NET][0],
      POSITIONS[GAME_LOCATIONS.NET][1],
      300,
      750,
      (match) => (
        <FieldButton
          color={COLORS.ACTIVE}
          disabled={!match.hasAlgae()}
          onClick={() => {
            startPendingTasks(
              GAME_LOCATIONS.NET,
              [createTask(DEPOSIT, ALGAE)],
              match
            );
          }}
        >
          Score Net
        </FieldButton>
      )
    ),
    // Timer remains unchanged
    createFieldLocalMatchComponent("timer", 2500, 50, 300, 100, (match) => (
      <p
        style={{
          fontWeight: 1000,
          color: "rgb(0, 0, 0)",
          backgroundColor: "rgb(255, 255, 255)",
        }}
      >
        {match.currentTime}
      </p>
    )),
  ];

  const AlgaeCoralIcons = [
    // Coral icon component
    createFieldLocalMatchComponent(
      "coralIcon",
      2000,
      200,
      400,
      200,
      (match) => (
        <span
          style={{
            display: "block",
            overflow: "hidden",
            visibility: match.hasCoral() ? "visible" : "hidden",
            pointerEvents: "none",
          }}
        >
          <img
            src={CoralIcon}
            alt="CORAL ICON NOT FOUND"
            style={{
              display: "block",
              objectFit: "cover",
              height: "100%",
              width: "100%",
              pointerEvents: "none",
            }}
          />
        </span>
      )
    ),
    // Algae icon component
    createFieldLocalMatchComponent(
      "algaeIcon",
      2000,
      450,
      400,
      200,
      (match) => (
        <span
          style={{
            display: "block",
            overflow: "hidden",
            visibility: match.hasAlgae() ? "visible" : "hidden",
            pointerEvents: "none",
          }}
        >
          <img
            src={AlgaeIcon}
            alt="ALGAE ICON NOT FOUND"
            style={{
              display: "block",
              objectFit: "cover",
              height: "100%",
              width: "100%",
              pointerEvents: "none",
            }}
          />
        </span>
      )
    ),
  ];

  // TeleChildren: Hang buttons updated using LOCATIONS.HANG
  const hangKeys = [
    GAME_LOCATIONS.HANG.LEFT,
    GAME_LOCATIONS.HANG.MIDDLE,
    GAME_LOCATIONS.HANG.RIGHT,
  ];

  const TeleChildren = [
    // Defense button remains unchanged
    createFieldLocalMatchComponent("defense", 2000, 900, 250, 250, (match) => (
      <FieldButton
        color={COLORS.PRIMARY}
        onClick={() => {
          if (match.isDefending && match.defense?.endTime == null) {
            match.setDefense({ ...match.defense, endTime: currentTime });
          }
          match.setIsDefending(!match.isDefending);
        }}
      >
        {match.isDefending ? "Cycle" : "Defend"}
      </FieldButton>
    )),
    Object.keys(GAME_LOCATIONS.HANG).map((position, index) => {
      const key = GAME_LOCATIONS.HANG[position];
      const [x, y] = POSITIONS[key];
      return createFieldLocalMatchComponent(key, x, y, 250, 200, (match) => (
        <FieldButton
          color={COLORS.PENDING}
          drawBorder={match.hang.position === index}
          onClick={() => {
            // TODO Update to startPendingTasks
            match.setHang({
              ...match.hang,
              position: index,
            });
            if (match.hasCoral()) {
              match.setCoral({ ...match.coral, depositLocation: null });
            } else {
              match.setCoral({});
            }
            if (match.hasAlgae()) {
              match.setAlgae({ ...match.algae, depositLocation: null });
            } else {
              match.setAlgae({});
            }
          }}
        >
          HANG {[position]}
        </FieldButton>
      ));
    }),

    // post-match button
    createFieldLocalMatchComponent(
      "postMatch",
      2500,
      1300,
      300,
      280,
      (match) => (
        <FieldButton
          color={COLORS.PRIMARY}
          onClick={() => match.setPhase(PHASES.POSTMATCH)}
        >
          POST MATCH
        </FieldButton>
      )
    ),
  ];

  const PostMatchChildren = [
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
    createFieldLocalMatchComponent(
      "driverSkill",
      250,
      450,
      500,
      150,
      (match) => <FieldButton color={COLORS.PRIMARY}>Driver Skill</FieldButton>
    ),
    ...[100, 350, 600, 850, 1100, 1350, 1600].map((x, index) => {
      const value = ["N/A", 0, 1, 2, 3, 4, 5][index];
      return createFieldLocalMatchComponent(
        `${index}DriverSkill`,
        x,
        600,
        200,
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
    createFieldLocalMatchComponent(
      "defenseSkill",
      250,
      800,
      500,
      150,
      (match) => <FieldButton color={COLORS.PRIMARY}>Defense Skill</FieldButton>
    ),
    ...[100, 350, 600, 850, 1100, 1350, 1600].map((x, index) => {
      const value = ["N/A", 0, 1, 2, 3, 4, 5][index];
      return createFieldLocalMatchComponent(
        `${index}DefenseSkill`,
        x,
        950,
        200,
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
    createFieldLocalMatchComponent("role", 250, 1150, 500, 150, (match) => (
      <FieldButton color={COLORS.PRIMARY}>Role</FieldButton>
    )),
    ...[225, 685, 1145, 1605].map((x, index) => {
      const value = ["N/A", "Defense", "Coral Cycle", "Algae Cycle"][index];
      return createFieldLocalMatchComponent(
        `${index}Role`,
        x,
        1300,
        450,
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
    createFieldLocalMatchComponent(
      "comments",
      2250,
      750,
      750,
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

  const renderFieldCanvas = () => {
    const fieldChildren = [
      ...(phase === PHASES.PREMATCH ? PrematchChildren : []),
      ...(phase === PHASES.PREMATCH ||
      phase === PHASES.AUTO ||
      phase === PHASES.TELE
        ? AlgaeCoralIcons
        : []),
      ...(phase === PHASES.AUTO ? AutoChildren : []),
      ...(phase === PHASES.AUTO || phase === PHASES.TELE
        ? AutoTeleChildren
        : []),
      ...(phase === PHASES.TELE ? TeleChildren : []),
      ...(phase === PHASES.POSTMATCH ? PostMatchChildren : []),
    ];

    return (
      <Box
        sx={{
          transform: `translateX(${
            isDefending && phase != PHASES.POSTMATCH ? -56 : 0
          }%)`,
        }}
      >
        {scaledBoxRect.width > 0 && (
          <FieldCanvas
            ref={fieldCanvasRef}
            theme={BlueTheme}
            height={scaledBoxRect.height}
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

    if (phase === PHASES.PREMATCH) {
      buttonsList = [
        {
          id: 0,
          flexWeight: 2,
          component: (
            <Button
              variant="contained"
              color={startingPosition < 0 ? "disabled" : COLORS.ACTIVE}
              disabled={startingPosition < 0}
              onClick={() => {
                setMatchStartTime(Date.now());
                setPhase(PHASES.AUTO);
              }}
              sx={{
                width: "100%",
                height: "100%",
                fontSize: "1.5rem",
              }}
            >
              Start Match
            </Button>
          ),
        },
        {
          id: 1,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={hasCoral() ? COLORS.SUCCESS : COLORS.PENDING}
              onClick={() => {
                setCoral(
                  hasCoral()
                    ? {}
                    : { attainedLocation: "preload", attainedTime: 0 }
                );
              }}
              sx={{
                width: "100%",
                height: "100%",
                fontSize: "1.5rem",
              }}
            >
              {hasCoral() ? "Preload Coral" : "No Preload"}
            </Button>
          ),
        },
      ];
    } else if (
      (phase === PHASES.AUTO || phase === PHASES.TELE) &&
      !isDefending &&
      hang.position == null
    ) {
      // STANDARD AUTO/TELE
      let drawCancelButton = false;

      // --- REEF SCORE BUTTONS
      if (
        hasCoral() &&
        Object.values(GAME_LOCATIONS.REEF).includes(coral.depositLocation)
      ) {
        drawCancelButton = true;
        Object.keys(GAME_LOCATIONS.REEF_LEVEL)
          .sort()
          .reverse()
          .forEach((level) => {
            buttonsList.push({
              id: `reefLevel_${level}`,
              flexWeight: 1,
              component: (
                <Button
                  variant="contained"
                  color={COLORS.CORALDROPOFF}
                  onClick={() => {
                    updateCoral({
                      ...coral,
                      depositLocation: coral.depositLocation + `L${level}`,
                      depositTime: currentTime,
                    });
                    if (!hasAlgae()) {
                      updateAlgae({});
                    }
                  }}
                >
                  L{level}
                </Button>
              ),
            });
          });
      }

      if (isUnfinished(algae.attainedLocation, algae.attainedTime)) {
        drawCancelButton = true;
        buttonsList.push({
          id: "PICKUP_ALGAE",
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.ALGAEPICKUP}
              onClick={() => {
                updateAlgae({ ...algae, attainedTime: currentTime });
              }}
            >
              PICKUP ALGAE
            </Button>
          ),
        });
      }

      if (isUnfinished(coral.attainedLocation, coral.attainedTime)) {
        buttonsList.push({
          id: "PICKUP_CORAL",
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.CORALPICKUP}
              onClick={() => {
                updateCoral({ ...coral, attainedTime: currentTime });
              }}
            >
              PICKUP CORAL
            </Button>
          ),
        });
      }

      // --- PROCESSOR/NET SCORE MENU ---
      if (
        algae.depositLocation === GAME_LOCATIONS.PROCESSOR ||
        algae.depositLocation === GAME_LOCATIONS.NET
      ) {
        drawCancelButton = true;
        buttonsList.push({
          id: "scoreProcessor",
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.ALGAEDROPOFF}
              onClick={() => {
                updateAlgae({ ...algae, depositTime: currentTime });
              }}
            >
              Score {algae.depositLocation}
            </Button>
          ),
        });
      }

      if (isUnfinished(coral.depositLocation, coral.depositTime)) {
        buttonsList.push({
          id: "DROP_CORAL",
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.DROP}
              onClick={() => {
                updateCoral({ ...coral, depositTime: currentTime });
              }}
            >
              DROP CORAL
            </Button>
          ),
        });
      }

      if (isUnfinished(algae.depositLocation, algae.depositTime)) {
        buttonsList.push({
          id: "DROP_CORAL",
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.DROP}
              onClick={() => {
                updateAlgae({ ...algae, depositTime: currentTime });
                // clearUnfinished();
              }}
            >
              DROP ALGAE
            </Button>
          ),
        });
      }

      if (hasUnfinished()) {
        buttonsList.push({
          id: "cancel",
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.PENDING}
              onClick={(e) => {
                clearUnfinished();
              }}
            >
              cancel
            </Button>
          ),
        });
      }
    } else if (
      phase === PHASES.AUTO ||
      (phase === PHASES.TELE && isDefending)
    ) {
      if (defense.defendingTeam == null) {
        enemies.forEach((enemy, index) => {
          buttonsList.push({
            id: `defense_${index}`,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.PENDING}
                onClick={() => {
                  setDefense({
                    startTime: currentTime,
                    defendingTeam: enemy,
                    endTime: null,
                  });
                }}
              >
                {enemy}
              </Button>
            ),
          });
        });
      } else {
        buttonsList.push({
          id: "stopDefending",
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.PENDING}
              onClick={() => {
                setDefense({ ...defense, endTime: currentTime });
              }}
            >
              STOP DEFENDING
            </Button>
          ),
        });
      }
    } else if (phase === PHASES.TELE && hang.position != null) {
      Object.values(GAME_LOCATIONS.HANG_LEVEL).forEach((height, index) => {
        buttonsList.push({
          id: `hangDepth_${index}`,
          flexWeight: 1,
          component: (
            <Button
              color={COLORS.PENDING}
              variant="contained"
              onClick={() => {
                setHang({ ...hang, time: currentTime, height });
              }}
            >
              {height}
            </Button>
          ),
        });
      });
      buttonsList.push({
        id: "cancelHang",
        flexWeight: 1,
        component: (
          <Button
            variant="contained"
            color={COLORS.PENDING}
            onClick={() => {
              setHang({ time: null, position: null, depth: null });
            }}
          >
            CANCEL
          </Button>
        ),
      });
    } else if (phase === PHASES.POSTMATCH) {
      buttonsList.push({
        id: "submit",
        flexWeight: 1,
        component: (
          <Button
            variant="contained"
            color={COLORS.PENDING}
            onClick={() => {
              setMatchStartTime(-1);
              setCurrentTime(0);
              setPhase(PHASES.PREMATCH);

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
                time: null,
                position: null,
                height: null,
              });
              setEndgame({
                disabled: false,
                driverSkill: "N/A",
                defenseSkill: "N/A",
                role: "N/A",
                comments: "",
              });
            }}
          >
            SUBMIT
          </Button>
        ),
      });
    }

    // Clone components to add common styling
    for (let i = 0; i < buttonsList.length; i++) {
      const button = buttonsList[i];
      buttonsList[i] = {
        ...button,
        component: React.cloneElement(button.component, {
          sx: {
            width: "90%",
            height: "90%",
            fontSize: scaleWidthToActual(100) + "px",
            borderRadius: scaleWidthToActual(150) + "px",
            ...button.component.sx,
          },
        }),
      };
    }

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: BlueTheme.palette.background.paper,
          overflowY: "auto",
        }}
      >
        {buttonsList.map((button, index) => (
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

  return (
    <MatchContext.Provider value={CONTEXT_WRAPPER}>
      <ThemeProvider theme={BlueTheme}>
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
              background: BlueTheme.palette.background.default,
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
