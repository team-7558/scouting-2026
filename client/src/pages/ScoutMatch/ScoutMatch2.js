import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  createContext,
} from "react";
import { useCallback } from "react";

import { ThemeProvider } from "@mui/material/styles";
import Slider from "@mui/material/Slider";
import { BlueTheme } from "./themes/BlueTheme.js";

import { Box, Button } from "@mui/material";
import { FieldCanvas, FieldLocalComponent } from "../FieldCanvas.js";
import FullscreenDialog from "./FullScreenDialog.js";

import AlgaeIcon from "../../assets/scouting-2025/algaeIcon.png";
import CoralIcon from "../../assets/scouting-2025/coralIcon.png";

const COLORS = {
  PENDING: "info",
  SUCCESS: "success",
  DISABLED: "disabled",
  ACTIVE: "primary",
  TRANSPARENT: "transparent",
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
            fieldX={fieldX}
            fieldY={fieldY}
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
  const PHASES = { PREMATCH: "prematch", AUTO: "auto", TELE: "tele" };
  const [phase, setPhase] = useState(PHASES.PREMATCH);

  // robot state
  const [isDefending, setIsDefending] = useState(false);
  const [startingPosition, setStartingPosition] = useState(-1);

  const [pendingAction, setPendingAction] = useState();

  const GAME_PIECES = {
    CORAL: "coral",
    ALGAE: "algae",
  };
  const GAME_PIECE_STATUS = {
    HOLDING: "holding",
    SCORING: "scoring",
  };

  const [coral, setCoral] = useState({
    attainedLocation: null, // if not null, pickup is pending
    attainedTime: null, // if not null, holding gamepiece

    depositLocation: null,
    depositTime: null,
  });

  const [algae, setAlgae] = useState({
    attainedLocation: null, // if not null, pickup is pending
    attainedTime: null, // if not null, holding gamepiece

    depositLocation: null,
    depositTime: null,
  });

  //[reefNum][Leve]/drop. (if its null, means they haven't shot anything)
  const [coralDeposited, setCoralDeposited] = useState(null);

  // (X, Y)coordinates/[reefNum] (if its null, it means they aren't holding algae)
  const [algaeAttained, setAlgaeAttained] = useState(null);
  //processor/net/drop (if its null, means they haven't shot anything)
  const [algaeDeposited, setAlgaeDeposited] = useState(null);

  //increment timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (matchStartTime > 0) {
        setCurrentTime(Math.round((Date.now() - matchStartTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [matchStartTime]);

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

  const FieldButton = ({ children, ...props }) => {
    return (
      <Button
        variant="contained"
        sx={{ width: "100%", height: "100%", minWidth: 0, minHeight: 0 }}
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
        /* start position slider. Cannot be wrapped in it's own component or it re-renders anytime it is moved, so you can't drag it */
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
            "background-image": `url(
            "https://i.imgur.com/TqGjfyf.jpg"
          )`,
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

  useEffect(() => {
    if (coral.depositTime != null) {
      // TODO Update cycles when scored
      setCoral({});
    }
  }, [coral]);

  useEffect(() => {
    if (algae.depositTime != null) {
      // TODO Update cycles when scored
      setAlgae({});
    }
  }, [algae]);

  // TODO add sanity checks here
  const updateCoral = (updates) => {
    // intentially re-writing the entire state,
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
    // intentially re-writing the entire state,
    // the caller of this method should decide if it wants to include prior state
    setAlgae(updates);
  };

  const PrematchChildren = [
    createFieldLocalMatchComponent(
      "startingPositionSlider",
      1750,
      0,
      75,
      1310,
      StartingPositionSlider
    ),
    createFieldLocalMatchComponent(
      "other button",
      2000,
      200,
      200,
      200,
      (match) => (
        <FieldButton onClick={() => match.setIsDefending((prev) => !prev)}>
          Defence
        </FieldButton>
      )
    ),
  ];

  const onCoralStationButtonClicked = (side) => {
    updateCoral({
      attainedLocation: "CoralStation",
    });
  };

  const onReefButtonClicked = (num) => {
    if (hasCoral()) {
      updateCoral({ ...coral, depositLocation: "reef" + num });
    }
    if (!hasAlgae()) {
      setAlgae({ attainedLocation: "reef" + num });
    }
  };

  const onAlgaeScored = (location) => {
    updateAlgae({
      ...algae,
      depositLocation: location,
    });
  };

  const onCoralMarkClicked = (num) => {
    if (!hasCoral()) {
      updateCoral({ attainedLocation: "coralMark" + num });
    }
    if (!hasAlgae()) {
      updateAlgae({ attainedLocation: "coralMark" + num });
    }
  };
  const AutoChildren = [
    ...[0, 1350].map((y, index) => {
      return createFieldLocalMatchComponent(
        "coralStation" + index,
        0,
        y,
        450,
        250,
        (match) => (
          <FieldButton
            color={COLORS.ACTIVE}
            disabled={hasCoral()}
            onClick={() =>
              onCoralStationButtonClicked(index == 0 ? "left" : "right")
            }
            sx={{}}
          >
            {index == 0 ? "Left" : "Right"} Coral Station
          </FieldButton>
        )
      );
    }),

    // Reef Buttons
    ...[550, 550, 740, 950, 950, 740].map((y, index) => {
      const x = [850, 1170, 1300, 1170, 850, 750][index];
      return createFieldLocalMatchComponent(
        `${index}ReefButton`,
        x,
        y,
        100,
        120,
        (match) => (
          <FieldButton
            color={COLORS.PENDING}
            disabled={!hasCoral() && hasAlgae()}
            onClick={() => onReefButtonClicked(index)}
            sx={{
              borderRadius: "50%",
              width: "100%",
              height: "100%",
            }}
          ></FieldButton>
        )
      );
    }),

    // Algae Scores - Proccessor
    createFieldLocalMatchComponent(
      "scoreProcessor",
      1500,
      1400,
      500,
      200,
      (match) => (
        <FieldButton
          color={COLORS.ACTIVE}
          disabled={!hasAlgae()}
          onClick={() => {
            onAlgaeScored("processor");
          }}
        >
          Score Processor
        </FieldButton>
      )
    ),

    // Algae Scores - Net
    createFieldLocalMatchComponent("scoreNet", 2000, 900, 300, 700, (match) => (
      <FieldButton
        color={COLORS.ACTIVE}
        disabled={!hasAlgae()}
        onClick={() => {
          onAlgaeScored("net");
          console.log(algae);
        }}
      >
        Score Net
      </FieldButton>
    )),

    // Coral Mark Buttons
    ...[380, 750, 1120].map((y, index) => {
      return createFieldLocalMatchComponent(
        `coralMark${index}`,
        210,
        y,
        50,
        120,
        (match) => (
          <FieldButton
            color={COLORS.SUCCESS}
            sx={{
              borderRadius: "50%",
              width: "100%",
              height: "100%",
            }}
            onClick={() => {
              onCoralMarkClicked(index);
            }}
          ></FieldButton>
        )
      );
    }),

    //timer
    createFieldLocalMatchComponent("timer", 2000, 0, 300, 100, (match) => (
      <FieldButton
        color={COLORS.TRANSPARENT}
        style={{
          fontSize: "2em",
          fontWeight: 1000,
        }}
      >
        {currentTime}
      </FieldButton>
    )),
  ];

  const renderFieldCanvas = () => {
    const fieldChildren = [
      ...[phase === PHASES.PREMATCH && PrematchChildren],
      ...[phase === PHASES.AUTO && AutoChildren],
      ...[
        //coral icon
        createFieldLocalMatchComponent(
          "coralIcon",
          1900,
          100,
          400,
          200,
          (match) => (
            <FieldButton color={COLORS.TRANSPARENT}>
              <span
                style={{
                  display: "block",
                  overflow: "hidden",
                  visibility: hasCoral() ? "visible" : "hidden",
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
                  }}
                ></img>
              </span>
            </FieldButton>
          )
        ),

        //algae icon
        createFieldLocalMatchComponent(
          "algaeIcon",
          1900,
          300,
          400,
          200,
          (match) => (
            <FieldButton color={COLORS.TRANSPARENT}>
              <span
                style={{
                  display: "block",
                  overflow: "hidden",
                  visibility:
                    // algaeAttained != null && algaeAttained.done
                    algae.attainedTime != null ? "visible" : "hidden",
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
                  }}
                ></img>
              </span>
            </FieldButton>
          )
        ),
      ],
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
              {"Preload Coral"}
            </Button>
          ),
        },
      ];
    } else if (phase === PHASES.AUTO || phase === PHASES.TELE) {
      //REEF CORAL DROPOFF BUTTONS
      if (coral.depositLocation?.includes("reef")) {
        //L1-4 BUTTONS
        const onScoreReefClicked = (level) => {
          updateCoral({
            ...coral,
            depositLocation: level,
            depositTime: currentTime,
          });
          if (!hasAlgae()) {
            updateAlgae({});
          }
        };

        [1, 2, 3, 4].map((level, index) => {
          buttonsList.push({
            id: index,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.PENDING}
                onClick={() => {
                  onScoreReefClicked(`L${level}`);
                }}
              >
                L{level}
              </Button>
            ),
          });
        });

        //drop coral button
        buttonsList.push({
          id: 4,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.PENDING}
              onClick={() => {
                onScoreReefClicked("Drop");
              }}
            >
              DROP CORAL
            </Button>
          ),
        });
      }

      //REEF ALGAE PICKUP BUTTON
      if (
        algae.attainedLocation &&
        !hasAlgae()
        // algaeAttained != null &&
        // typeof algaeAttained.location == "string" &&
        // algaeAttained.location.includes("reef") &&
        // !algaeAttained.done
      ) {
        buttonsList.push({
          id: 5,
          flexWeight: 1,
          component: (
            <Button
              variant="contained"
              color={COLORS.PENDING}
              onClick={() => {
                updateAlgae({ ...algae, attainedTime: currentTime });
                updateCoral({ ...coral, depositLocation: null });
              }}
            >
              REEF ALGAE PICKUPS
            </Button>
          ),
        });
      }

      //REEF MENU CANCEL BUTTON
      if (
        (coralDeposited != null &&
          typeof coralDeposited.location == "string" &&
          coralDeposited.location.includes("reef") &&
          !coralDeposited.done) ||
        (algaeAttained != null &&
          typeof algaeAttained.location == "string" &&
          algaeAttained.location.includes("reef") &&
          !algaeAttained.done)
      ) {
        buttonsList.push({
          id: 6,
          flexWeight: 1,
          component: (
            <Button variant="contained" color={COLORS.PENDING}>
              CANCEL
            </Button>
          ),
        });
      }

      //CORAL pickup from coral mark
      if (!hasCoral() && coral.attainedLocation?.includes("coralMarl")) {
        buttonsList.push({
          id: 0,
          flexWeight: 5,
          component: (
            <Button
              variant="contained"
              color={COLORS.PENDING}
              onClick={() => {
                updateCoral({ attainedTime: currentTime });
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

      //ALGAE pickup from coral mark
      if (!hasAlgae() && algae.attainedLocation?.includes("coralMark")) {
        buttonsList.push({
          id: 0,
          flexWeight: 5,
          component: (
            <Button
              variant="contained"
              color={COLORS.PENDING}
              onClick={() => {
                updateAlgae({ attainedTime: currentTime });
                if (!hasCoral()) {
                  updateCoral({});
                }
              }}
            >
              PICKUP ALGAE
            </Button>
          ),
        });
      }

      //PROCESSOR/NET SCORE MENU
      const onAlgaeScored = (success) => {
        if (success) {
          updateAlgae({ ...algae, depositTime: currentTime });
        } else {
          updateAlgae({ ...algae, depositLocation: null });
        }
      };
      if (
        algae.depositLocation === "processor" ||
        algae.depositLocation === "net"
      ) {
        buttonsList.push(
          {
            id: 0,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.PENDING}
                onClick={() => onAlgaeScored(true)}
              >
                SCORE {algae.depositLocation}
              </Button>
            ),
          },
          {
            id: 1,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.PENDING}
                onClick={() => onAlgaeScored(false)}
              >
                CANCEL
              </Button>
            ),
          }
        );
      }

      //coral stations.
      const onCoralPickup = (success) => {
        if (success) {
          updateCoral({ ...coral, attainedTime: currentTime });
        } else {
          updateCoral({ attainedLocation: null });
        }
      };

      //coral station 2
      if (!hasCoral() && coral.attainedLocation?.includes("CoralStation")) {
        buttonsList.push(
          {
            id: 0,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.PENDING}
                onClick={() => onCoralPickup(true)}
              >
                CORAL PICKUP
              </Button>
            ),
          },
          {
            id: 1,
            flexWeight: 1,
            component: (
              <Button variant="contained" color={COLORS.PENDING}>
                CANCEL
              </Button>
            ),
          }
        );
      }
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
