import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  createContext,
  useCallback,
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
import { LOCATIONS, POSITIONS } from "./Constants.js";

const COLORS = {
  PENDING: "info",
  SUCCESS: "success",
  DISABLED: "disabled",
  ACTIVE: "primary",
  CORALPICKUP: "coralPickup",
  CORALDROPOFF: "coralDropoff",
  ALGAEPICKUP: "algaePickup",
  ALGAEDROPOFF: "algaeDropoff",
  CANCEL: "cancel",
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
    }
  }, [coral.depositTime]);

  // Only run when algae.depositTime changes
  useEffect(() => {
    if (algae.depositTime != null) {
      console.log("algae cycle: " + JSON.stringify(algae));
      // TODO Update cycles when scored
      setAlgae({});
    }
  }, [algae.depositTime]);

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
  const [scaledBoxRect, setScaledBoxRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const scaleWidthToActual = (virtualValue) =>
    (virtualValue / virtualWidth) * scaledBoxRect.width;

  const scaleHeightToActual = (virtualValue) =>
    (virtualValue / virtualHeight) * scaledBoxRect.height;

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

  const StartingPositionSlider = (match) => {
    const fieldRef = fieldCanvasRef.current;
    if (!fieldRef) return;
    return (
      <Slider
        orientation="vertical"
        value={match.startingPosition}
        onChange={(event, value) => match.setStartingPosition(value)}
        min={1}
        max={13}
        step={1}
        valueLabelDisplay="auto"
        sx={{
          "margin-top": fieldRef.scaleHeightToActual(150),
          "margin-bottom": fieldRef.scaleHeightToActual(150),
          "& .MuiSlider-thumb": {
            "background-image": `url("https://i.imgur.com/TqGjfyf.jpg")`,
            width: fieldRef.scaleWidthToActual(300),
            height: fieldRef.scaleHeightToActual(300),
            "background-position": "center",
            "background-size": "cover",
            "border-radius": 0,
          },
          "& .MuiSlider-track": {
            color: startingPosition == -1 ? COLORS.DISABLED : COLORS.ACTIVE,
          },
          "& .MuiSlider-rail": {
            color: startingPosition == -1 ? COLORS.DISABLED : COLORS.ACTIVE,
          },
        }}
      />
    );
  };

  const PrematchChildren = [
    createFieldLocalMatchComponent(
      "startingPositionSlider",
      POSITIONS[LOCATIONS.STARTING_LINE][0],
      POSITIONS[LOCATIONS.STARTING_LINE][1],
      75,
      1310,
      StartingPositionSlider
    ),
  ];

  const coralMarkKeys = [
    LOCATIONS.CORAL_MARK.LEFT,
    LOCATIONS.CORAL_MARK.MIDDLE,
    LOCATIONS.CORAL_MARK.RIGHT,
  ];
  const AutoChildren = [
    ...coralMarkKeys.map((key) => {
      const [x, y] = POSITIONS[key];
      return createFieldLocalMatchComponent(key, x, y, 250, 200, (match) => (
        <FieldButton
          color={COLORS.SUCCESS}
          drawBorder={
            (match.coral.attainedLocation === key && !match.hasCoral()) ||
            (match.algae.attainedLocation === key && !match.hasAlgae())
          }
          sx={{ borderRadius: "50%" }}
          disabled={match.hasAlgae() && match.hasCoral()}
          onClick={() => {
            if (!match.hasCoral()) {
              match.setCoral({
                attainedLocation: key,
                attainedTime: null,
                depositLocation: null,
                depositTime: null,
              });
            } else if (match.coral.depositTime == null) {
              match.setCoral({
                ...match.coral,
                depositLocation: null,
              });
            }
            if (!match.hasAlgae()) {
              match.setAlgae({
                attainedLocation: key,
                attainedTime: null,
                depositLocation: null,
                depositTime: null,
              });
            } else {
              match.setAlgae({ ...match.algae, depositLocation: null });
            }
            match.setHang({});
          }}
        ></FieldButton>
      ));
    }),
    // Next phase (Tele) button
    createFieldLocalMatchComponent(
      "nextPhase",
      2150,
      850,
      300,
      200,
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
    LOCATIONS.CORAL_STATION.LEFT,
    LOCATIONS.CORAL_STATION.RIGHT,
  ];
  const AutoTeleChildren = [
    // Coral Stations
    ...coralStationKeys.map((key) => {
      const [x, y] = POSITIONS[key];
      return createFieldLocalMatchComponent(key, x, y, 450, 250, (match) => (
        <FieldButton
          color={COLORS.ACTIVE}
          disabled={match.hasCoral()}
          onClick={() => {
            match.setCoral({
              attainedLocation: key,
              attainedTime: null,
              depositLocation: null,
              depositTime: null,
            });
            if (!match.hasAlgae()) {
              match.setAlgae({});
            } else {
              match.setAlgae({ ...match.algae, depositLocation: null });
            }
            match.setHang({});
          }}
          drawBorder={!match.hasCoral() && match.coral.attainedLocation === key}
        >
          {key === LOCATIONS.CORAL_STATION.LEFT ? "Left" : "Right"} Coral
          Station
        </FieldButton>
      ));
    }),
    // Reef Buttons
    ...Object.values(LOCATIONS.REEF).map((reefKey) => {
      const [x, y] = POSITIONS[reefKey];
      return createFieldLocalMatchComponent(
        reefKey,
        x,
        y,
        250,
        200,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            disabled={!match.hasCoral() && match.hasAlgae()}
            onClick={() => {
              if (match.hasCoral()) {
                match.setCoral({
                  attainedLocation: match.coral.attainedLocation,
                  attainedTime: match.coral.attainedTime,
                  depositLocation: reefKey,
                  depositTime: null,
                });
              } else {
                match.setCoral({
                  attainedLocation: null,
                  attainedTime: null,
                  depositLocation: reefKey,
                  depositTime: null,
                });
              }
              if (!match.hasAlgae()) {
                match.setAlgae({
                  attainedLocation: reefKey,
                  attainedTime: null,
                  depositLocation: null,
                  depositTime: null,
                });
              } else if (match.algae.depositTime == null) {
                match.setAlgae({ ...match.algae, depositLocation: null });
              }
              match.setHang({});
            }}
            drawBorder={
              (match.coral.depositLocation === reefKey &&
                match.coral.depositTime == null) ||
              (!match.hasAlgae() && match.algae.attainedLocation === reefKey)
            }
            sx={{ borderRadius: "50%" }}
          ></FieldButton>
        )
      );
    }),
    // Score Processor button
    createFieldLocalMatchComponent(
      "scoreProcessor",
      POSITIONS[LOCATIONS.PROCESSOR][0],
      POSITIONS[LOCATIONS.PROCESSOR][1],
      500,
      200,
      (match) => (
        <FieldButton
          color={COLORS.ACTIVE}
          disabled={!match.hasAlgae()}
          onClick={() => {
            match.setAlgae({
              attainedLocation: match.algae.attainedLocation,
              attainedTime: match.algae.attainedTime,
              depositLocation: LOCATIONS.PROCESSOR,
              depositTime: null,
            });
            if (!match.hasCoral()) {
              match.setCoral({});
            } else if (match.coral.depositTime == null) {
              match.setCoral({ ...match.coral, depositLocation: null });
            }
            match.setHang({});
          }}
        >
          Score Processor
        </FieldButton>
      )
    ),
    // Score Net button
    createFieldLocalMatchComponent(
      "scoreNet",
      POSITIONS[LOCATIONS.NET][0],
      POSITIONS[LOCATIONS.NET][1],
      300,
      750,
      (match) => (
        <FieldButton
          color={COLORS.ACTIVE}
          disabled={!match.hasAlgae()}
          onClick={() => {
            match.setAlgae({
              attainedLocation: match.algae.attainedLocation,
              attainedTime: match.algae.attainedTime,
              depositLocation: LOCATIONS.NET,
              depositTime: null,
            });
            if (!match.hasCoral()) {
              match.setCoral({});
            } else if (match.coral.depositTime == null) {
              match.setCoral({ ...match.coral, depositLocation: null });
            }
            match.setHang({});
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
          fontSize: "2em",
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
      2500,
      300,
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
      2500,
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
    LOCATIONS.HANG.LEFT,
    LOCATIONS.HANG.MIDDLE,
    LOCATIONS.HANG.RIGHT,
  ];

  const TeleChildren = [
    // Defense button remains unchanged
    createFieldLocalMatchComponent("defense", 2500, 900, 300, 280, (match) => (
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
    ...hangKeys.map((key, index) => {
      const [x, y] = POSITIONS[key];
      return createFieldLocalMatchComponent(
        `hang_${key}`,
        x,
        y,
        250,
        200,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            drawBorder={match.hang.position === index}
            onClick={() => {
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
            HANG {index + 1}
          </FieldButton>
        )
      );
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
      <FieldButton
        color={COLORS.PRIMARY}
        sx={{
          fontSize: scaleWidthToActual(80) + "px",
        }}
      >
        DISABLED?
      </FieldButton>
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
            sx={{
              fontSize: scaleWidthToActual(70) + "px",
            }}
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
      (match) => (
        <FieldButton
          color={COLORS.PRIMARY}
          sx={{
            fontSize: scaleWidthToActual(80) + "px",
          }}
        >
          Driver Skill
        </FieldButton>
      )
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
            sx={{
              fontSize: scaleWidthToActual(70) + "px",
            }}
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
      (match) => (
        <FieldButton
          color={COLORS.PRIMARY}
          sx={{
            fontSize: scaleWidthToActual(80) + "px",
          }}
        >
          Defense Skill
        </FieldButton>
      )
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
            sx={{
              fontSize: scaleWidthToActual(70) + "px",
            }}
          >
            {value}
          </FieldButton>
        )
      );
    }),
    createFieldLocalMatchComponent("role", 250, 1150, 500, 150, (match) => (
      <FieldButton
        color={COLORS.PRIMARY}
        sx={{
          fontSize: scaleWidthToActual(80) + "px",
        }}
      >
        Role
      </FieldButton>
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
            sx={{
              fontSize: scaleWidthToActual(70) + "px",
            }}
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
              fontSize: scaleWidthToActual(100) + "px",
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
              fontSize: scaleWidthToActual(100) + "px",
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
          transform: `translateX(${isDefending ? -50 : 0}%)`,
        }}
      >
        {scaledBoxRect.width > 0 && (
          <FieldCanvas
            ref={fieldCanvasRef}
            theme={BlueTheme}
            fieldBoxRect={scaledBoxRect}
            children={fieldChildren}
            onClick={(x, y) => {
              if (!hasCoral()) {
                setCoral({
                  ...coral,
                  attainedLocation: [x, y],
                });
              } else {
                setCoral({
                  ...coral,
                  depositLocation: [x, y],
                });
              }

              if (!hasAlgae()) {
                setAlgae({
                  ...algae,
                  attainedLocation: [x, y],
                });
              } else {
                setAlgae({
                  ...algae,
                  depositLocation: [x, y],
                });
              }
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
        Object.values(LOCATIONS.REEF).includes(coral.depositLocation)
      ) {
        drawCancelButton = true;
        Object.values(LOCATIONS.REEF_LEVEL).forEach((level) => {
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
        buttonsList.push({
          id: "reefDrop",
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.CORALDROPOFF}
              onClick={() => {
                updateCoral({
                  ...coral,
                  depositLocation: "DROP",
                  depositTime: currentTime,
                });
                if (!hasAlgae()) {
                  updateAlgae({});
                }
              }}
            >
              DROP CORAL
            </Button>
          ),
        });
      }

      // --- REEF ALGAE PICKUP BUTTON ---
      if (
        !hasAlgae() &&
        Object.values(LOCATIONS.REEF).includes(algae.attainedLocation)
      ) {
        drawCancelButton = true;
        buttonsList.push({
          id: "algaePickupReef",
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.ALGAEPICKUP}
              onClick={() => {
                updateAlgae({ ...algae, attainedTime: currentTime });
                updateCoral({ ...coral, depositLocation: null });
              }}
            >
              PICKUP ALGAE
            </Button>
          ),
        });
      }

      // --- CORAL_MARK BUTTONS ---
      // Instead of checking for each mark with separate conditions,
      // iterate over all coral mark keys.
      if (
        !hasCoral() &&
        Object.values(LOCATIONS.CORAL_MARK).includes(coral.attainedLocation)
      ) {
        drawCancelButton = true;
        buttonsList.push({
          id: `coralPickupMark_${coral.attainedLocation}`,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.CORALPICKUP}
              onClick={() => {
                updateCoral({ ...coral, attainedTime: currentTime });
                if (!hasAlgae()) {
                  updateAlgae({});
                }
              }}
            >
              PICKUP CORAL
            </Button>
          ),
        });
      }

      if (
        !hasAlgae() &&
        Object.values(LOCATIONS.CORAL_MARK).includes(algae.attainedLocation)
      ) {
        drawCancelButton = true;
        buttonsList.push({
          id: `coralPickupMark_${coral.attainedLocation}`,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.CORALPICKUP}
              onClick={() => {
                updateAlgae({ ...algae, attainedTime: currentTime });
                if (!hasCoral()) {
                  updateCoral({});
                }
              }}
            >
              PICKUP AlGAE
            </Button>
          ),
        });
      }

      // --- CORAL_STATION BUTTONS ---
      // Similarly, iterate over coral station keys.
      if (
        !hasCoral() &&
        Object.values(LOCATIONS.CORAL_STATION).includes(coral.attainedLocation)
      ) {
        drawCancelButton = true;
        buttonsList.push(
          {
            id: `coralPickupStation_${coral.attainedLocation}`,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.CORALPICKUP}
                onClick={() => {
                  updateCoral({ ...coral, attainedTime: currentTime });
                }}
              >
                CORAL PICKUP
              </Button>
            ),
          },
          {
            id: `coralDropoffStation_${coral.attainedLocation}`,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.CORALDROPOFF}
                onClick={() => {
                  updateCoral({
                    ...coral,
                    attainedTime: currentTime,
                    depositLocation: "DROP",
                    depositTime: currentTime,
                  });
                }}
              >
                DROP CORAL
              </Button>
            ),
          }
        );
      }

      // --- PROCESSOR/NET SCORE MENU ---
      if (
        algae.depositLocation === LOCATIONS.PROCESSOR ||
        algae.depositLocation === LOCATIONS.NET
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

      // Ground pickup/dropoff for coral:
      if (
        (Array.isArray(coral.attainedLocation) && coral.attainedTime == null) ||
        (Array.isArray(coral.depositLocation) && coral.depositTime == null)
      ) {
        drawCancelButton = true;
        buttonsList.push({
          id: "groundCoral",
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={hasCoral() ? COLORS.CORALDROPOFF : COLORS.CORALPICKUP}
              onClick={() => {
                if (hasCoral()) {
                  setCoral({ ...coral, depositTime: currentTime });
                } else {
                  setCoral({ ...coral, attainedTime: currentTime });
                }
                if (algae.attainedTime == null) {
                  setAlgae({});
                } else if (algae.depositTime == null) {
                  setAlgae({ ...algae, depositLocation: null });
                }
              }}
            >
              CORAL {hasCoral() ? "DROPOFF" : "PICKUP"}
            </Button>
          ),
        });
      }

      // Ground pickup/dropoff for algae:
      if (
        (Array.isArray(algae.attainedLocation) && algae.attainedTime == null) ||
        (Array.isArray(algae.depositLocation) && algae.depositTime == null)
      ) {
        drawCancelButton = true;
        buttonsList.push({
          id: "groundAlgae",
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={hasAlgae() ? COLORS.CORALDROPOFF : COLORS.CORALPICKUP}
              onClick={() => {
                if (hasAlgae()) {
                  setAlgae({ ...algae, depositTime: currentTime });
                } else {
                  setAlgae({ ...algae, attainedTime: currentTime });
                }
                if (coral.attainedTime == null) {
                  setCoral({});
                } else if (coral.depositTime == null) {
                  setCoral({ ...coral, depositLocation: null });
                }
              }}
            >
              ALGAE {hasAlgae() ? "DROPOFF" : "PICKUP"}
            </Button>
          ),
        });
      }

      // Cancel Button:
      const cancel = () => {
        if (!hasCoral()) {
          setCoral({});
        } else if (coral.depositTime == null) {
          setCoral({ ...coral, depositLocation: null });
        }
        if (!hasAlgae()) {
          setAlgae({});
        } else if (coral.depositTime == null) {
          setAlgae({ ...algae, depositLocation: null });
        }
      };
      if (drawCancelButton) {
        buttonsList.push({
          id: "cancel",
          flexWeight: 1,
          component: (
            <Button variant="contained" color={COLORS.PENDING} onClick={cancel}>
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
      Object.values(LOCATIONS.HANG_LEVEL).forEach((height, index) => {
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

  const resizeScaledBox = () => {
    const { width, height } = getScaledBoxDimensions();
    const rect = scaledBoxRef.current?.getBoundingClientRect() || {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    setScaledBoxRect({
      x: rect.left,
      y: rect.top,
      width,
      height,
    });
  };

  useEffect(() => {
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
          <FullscreenDialog />
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
