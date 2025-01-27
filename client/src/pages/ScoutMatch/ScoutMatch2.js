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
  INACTIVE: "grey",
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
  // preload/(X, Y)coordinates/coral station (if its null, it means they aren't holding coral)
  const [coralAttained, setCoralAttained] = useState({position: "preload", done: true});
  //[reefNum][Leve]/drop. (if its null, means they haven't shot anything)
  const [coralDeposited, setCoralDeposited] = useState(null);

  // (X, Y)coordinates/[reefNum] (if its null, it means they aren't holding algae)
  const [algaeAttained, setAlgaeAttained] = useState(null);
  //processor/net/drop (if its null, means they haven't shot anything)
  const [algaeDeposited, setAlgaeDeposited] = useState(null);

  //increment timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (matchStartTime>0){
        setCurrentTime(Math.round((Date.now() - matchStartTime)/1000));
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
    coralAttained,
    setCoralAttained,
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
            color: startingPosition == -1 ? COLORS.INACTIVE : COLORS.ACTIVE,
          },
          "& .MuiSlider-rail": {
            color: startingPosition == -1 ? COLORS.INACTIVE : COLORS.ACTIVE,
          },
        }}
      />
    );
  };

  //if coral pickup and dropoff are done, clear them. TODO: add to real cycles list
  if (coralAttained!=null && coralAttained.done && coralDeposited != null && coralDeposited.done){
    console.log("finished coral cycle: " + coralAttained.position, coralAttained.time, coralDeposited.position, coralDeposited.time);
    setCoralAttained(null);
    setCoralDeposited(null);
  }

  //if algae pickup and dropoff are done, clear them. TODO: add to real cycles list
  if (algaeAttained!=null && algaeAttained.done && algaeDeposited != null && algaeDeposited.done){
    console.log("finished algae cycle: " + algaeAttained.position, algaeAttained.time, algaeDeposited.position, algaeDeposited.time);
    setAlgaeAttained(null);
    setAlgaeDeposited(null);
  }

  const removeNotDoneActions = (removeCoralAttained, removeCoralDeposited, removeAlgaeAttained, removeAlgaeDeposited) => {
    if (removeCoralAttained && coralAttained!=null && !coralAttained.done){
      setCoralAttained(null);
    }
    if (removeCoralDeposited && coralDeposited!=null && !coralDeposited.done){
      setCoralDeposited(null);
    }
    if (removeAlgaeAttained && algaeAttained!=null && !algaeAttained.done){
      setAlgaeAttained(null);
    }
    if (removeAlgaeDeposited && algaeDeposited!=null && !algaeDeposited.done){
      setAlgaeDeposited(null);
    }
    
  }

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
    setCoralAttained({position: side + "CoralStation", time: currentTime, done: false});
    removeNotDoneActions(false, true, true, true);
  }

  const onReefButtonClicked = (num) => {
    if (coralAttained!=null && coralAttained.done){
      setCoralDeposited({position: "reef" + num, time: currentTime, done: false});
    }
    if (algaeAttained==null || !algaeAttained.done){
      setAlgaeAttained({position: "reef" + num, time: currentTime, done: false});
    }

    removeNotDoneActions(true, false, false, true);
  }

  const onAlgaeScored = (location) => {
    setAlgaeDeposited({position: location, time: currentTime, done: false});

    removeNotDoneActions(true, true, true, false);
  }

  const onCoralMarkClicked = (num) => {
    if (coralAttained == null || !coralAttained.done){
      setCoralAttained({position: "coralMark" + num, time: currentTime, done: false});
    }
    if (algaeAttained == null || !algaeAttained.done){
      setAlgaeAttained({position: "coralMark" + num, time: currentTime, done: false});
    }

    removeNotDoneActions(false, true, false, true);
  }
  const AutoChildren = [
    // Coral Pickup Left side 
    createFieldLocalMatchComponent(
      "leftCoralStation",
      0,
      0,
      450,
      250,
      (match) => (
        <FieldButton
          color={COLORS.ACTIVE}
          disabled={coralAttained != null && coralAttained.done}
          onClick={() => onCoralStationButtonClicked("left")}
        >
          Left Coral Station
        </FieldButton>
      )
    ),

    // Coral Pickup Right side 
    createFieldLocalMatchComponent(
      "rightCoralStation",
      0,
      1350,
      450,
      250,
      (match) => (
        <FieldButton
          color={COLORS.ACTIVE}
          disabled={coralAttained != null && coralAttained.done}
          onClick={() => onCoralStationButtonClicked("right")}
        >
          Right Coral Station
        </FieldButton>
      )
    ),

    // Reef Buttons 
    ...[550, 550, 740, 950, 950, 740].map((y, index) => {
      const x = [850, 1170, 1300, 1170, 850, 750][index];
      const drawBorder = (coralDeposited != null && typeof coralDeposited.position == "string" && coralDeposited.position.includes(index) && coralDeposited.position.includes("reef")) || 
        (algaeAttained != null && typeof algaeAttained.position == "string" && algaeAttained.position.includes(index) && algaeAttained.position.includes("reef") && !algaeAttained.done)
      return createFieldLocalMatchComponent(
          `${index}ReefButton`,
          x,
          y,
          100,
          120,
          (match) => (
            <FieldButton
              color={COLORS.PENDING}
              onClick={() => onReefButtonClicked(index)}
              sx={{borderRadius: '50%', 
                width: '100%',       
                height: '100%', 
                border: drawBorder ? '10px solid rgb(0, 0, 0)' : '',
              }}
            >
              
            </FieldButton>
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
          color={COLORS.SUCCESS}
          disabled={algaeAttained==null || !algaeAttained.done}
          onClick={() => {onAlgaeScored("processor");}}
        >
          Score Processor
        </FieldButton>
      )
    ),

    // Algae Scores - Net
    createFieldLocalMatchComponent(
      "scoreNet",
      2000,
      900,
      300,
      700,
      (match) => 
        <FieldButton 
      color={COLORS.SUCCESS}
      disabled={algaeAttained==null || !algaeAttained.done}
      onClick={() => {onAlgaeScored("net");}}
    >
      Score Net
    </FieldButton>
    ),

    // Coral Mark Buttons
    ...[380, 750, 1120].map((y, index) => {
      const drawBorderCoral = coralAttained!=null && typeof coralAttained.position == "string" && coralAttained.position.includes("coralMark") && coralAttained.position.includes(index)
      const drawBorderAlgae = algaeAttained!=null && typeof algaeAttained == "string" && algaeAttained.position.includes("coralMark") && algaeAttained.position.includes(index)
      return createFieldLocalMatchComponent(
        `coralMark${index}`,
        210,
        y,
        50,
        120,
        (match) => (
          <FieldButton
            color={COLORS.SUCCESS}
            sx={{ borderRadius: '50%',
              width: '100%',       
              height: '100%',
              border: drawBorderCoral || drawBorderAlgae ? "10px solid rgb(0, 0, 0)" : ""
             }}
            onClick={() => {
              onCoralMarkClicked(index);
            }}
          ></FieldButton>
        )
      );
    }),

    //timer
    createFieldLocalMatchComponent(
      "timer",
      2000,
      0,
      300,
      100,
      (match) => 
        <FieldButton
        color={COLORS.TRANSPARENT}
        style={{
          fontSize: "2em",
          fontWeight: 1000,
        }}>
          {currentTime}
        </FieldButton>
    ),

    //coral icon
    createFieldLocalMatchComponent(
      "coralIcon",
      1950,
      100,
      400,
      200,
      (match) => 
        <FieldButton
        color={COLORS.TRANSPARENT}>
          <span style={{
            display: 'block',
            overflow: 'hidden',
            visibility: coralAttained!=null && coralAttained.done ? "visible" : "hidden",
          }}>
            <img src={CoralIcon} alt="CORAL ICON NOT FOUND" style={{
              display: 'block', 
              objectFit: 'cover', 
              height:'100%',
              width:'100%', 
            }}></img>
          </span>
        </FieldButton>
    ),

    //algae icon
    createFieldLocalMatchComponent(
      "algaeIcon",
      1950,
      300,
      400,
      200,
      (match) => 
        <FieldButton
        color={COLORS.TRANSPARENT}>
          <span style={{
            display: 'block',
            overflow: 'hidden',
            visibility: algaeAttained!=null && algaeAttained.done ? "visible" : "hidden",
          }}>
            <img src={AlgaeIcon} alt="ALGAE ICON NOT FOUND" style={{
              display: 'block', 
              objectFit: 'cover', 
              height:'100%',
              width:'100%', 
            }}></img>
          </span>
        </FieldButton>
    ),
  ]

  const teleopChildren = [
    
  ]

  const renderFieldCanvas = () => {
    const fieldChildren = [
      ...(phase === PHASES.PREMATCH ? PrematchChildren : []),
      ...(phase === PHASES.AUTO ? AutoChildren : []),
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
              color={(coralAttained == null) ? COLORS.PENDING : COLORS.SUCCESS}
              onClick={() => {
                setCoralAttained((coralAttained == null) ? {position: "preload", time: currentTime, done: true} : null);
                console.log("preload set to: " + JSON.stringify((coralAttained == null) ? {position: "preload", done: true} : null));
              }}
              sx={{
                width: "100%",
                height: "100%",
                fontSize: "1.5rem",
              }}
            >
              {coralAttained == null ? "No Preload" : "Preload Coral"}
            </Button>
          ),
        },
      ];
    } else if (phase === PHASES.AUTO) {
      //REEF CORAL DROPOFF BUTTONS
      if (coralDeposited != null && 
        typeof coralDeposited.position == "string" && 
        coralDeposited.position.includes("reef") && 
        !coralDeposited.done){
          //L1-4 BUTTONS
          const onScoreReefClicked = (level) => {
            setCoralDeposited({position: coralDeposited.position + level, time: currentTime, done: true});
            removeNotDoneActions(true, false, true, true);
          }

          [1, 2, 3, 4].map((level, index) => {
            buttonsList.push(
              {
                id: index,
                flexWeight: 1,
                component: (
                  <Button
                    variant="contained"
                    color={COLORS.PENDING}
                    onClick={() => {onScoreReefClicked(`L${level}`)}}
                  >
                    L{level}
                  </Button>
                )
              }
            )}
          )

            //drop coral button
            buttonsList.push(
              {
                id: 4,
                flexWeight: 1,
                component: (
                  <Button
                    variant="contained"
                    color={COLORS.PENDING}
                    onClick={() => {onScoreReefClicked("Drop")}}
                  >
                    DROP CORAL
                  </Button>
                )
              }
            )
      }

      //REEF ALGAE PICKUP BUTTON
      if (algaeAttained != null && 
        typeof algaeAttained.position == "string" && 
        algaeAttained.position.includes("reef") && 
        !algaeAttained.done){
          buttonsList.push(
            {id: 5,
              flexWeight: 1,
              component: (
                <Button
                  variant="contained"
                  color={COLORS.PENDING}
                  onClick={() => {
                    setAlgaeAttained({position: algaeAttained.position, time: currentTime, done: true});
                    if (coralAttained != null && !coralAttained.done){
                      setCoralDeposited(null);
                    }
                  }}
                >
                  REEF ALGAE PICKUPS
                </Button>
              ),
            }
          );
      }

      //REEF MENU CANCEL BUTTON
      if ((coralDeposited != null && 
        typeof coralDeposited.position == "string" && 
        coralDeposited.position.includes("reef") && 
        !coralDeposited.done)
        ||
        algaeAttained != null && 
        typeof algaeAttained.position == "string" && 
        algaeAttained.position.includes("reef") && 
        !algaeAttained.done){
          buttonsList.push({
            id: 6,
            flexWeight: 1,
            component: (
              <Button
                variant="contained"
                color={COLORS.PENDING}
                onClick={() => {removeNotDoneActions(true, true, true, true)}}
              >
                CANCEL
              </Button>
            )
          })
      }

      //CORAL pickup from coral mark
      if (coralAttained != null && 
        typeof coralAttained.position == "string" && 
        coralAttained.position.includes("coralMark") && 
        !coralAttained.done){
        buttonsList.push(
          {id: 0,
            flexWeight: 5,
            component: (
              <Button
                variant="contained"
                color={COLORS.PENDING}
                onClick={() => {
                  setCoralAttained({position: coralAttained.position, time: currentTime, done: true});
                  setAlgaeAttained(null);
                }}
              >
                PICKUP CORAL 
              </Button>
            ),
          }
        );
      }

      //ALGAE pickup from coral mark
      if (algaeAttained != null && 
        typeof algaeAttained.position == "string" && 
        algaeAttained.position.includes("coralMark") && 
        !algaeAttained.done){
        buttonsList.push(
          {id: 0,
            flexWeight: 5,
            component: (
              <Button
                variant="contained"
                color={COLORS.PENDING}
                onClick={() => {
                  setAlgaeAttained({position: algaeAttained.position, time: currentTime, done: true});
                  removeNotDoneActions(true, true, false, true);
                }}
              >
                PICKUP ALGAE
              </Button>
            ),
          }
        );
      }      

      //PROCESSOR/NET SCORE MENU
      const onAlgaeScored = (success) => {
        if (success)
          setAlgaeDeposited({position: algaeDeposited.position, time: currentTime, done: true});
        else{
          setAlgaeDeposited({position: algaeDeposited.position + "Drop", time: currentTime, done: true});
        }
      }
      if (algaeDeposited!=null && 
        !algaeDeposited.done && 
        (algaeDeposited.position == "processor" || algaeDeposited.position == "net")){
          buttonsList.push(
            {id: 0,
              flexWeight: 1,
              component: (
                <Button
                  variant="contained"
                  color={COLORS.PENDING}
                  onClick={() => onAlgaeScored(true)}
                >
                  SCORE {algaeDeposited.position}
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
                    MISS {algaeDeposited.position}
                  </Button>
              )
            },
            {
              id: 2,
              flexWeight: 1,
              component: (
                <Button
                    variant="contained"
                    color={COLORS.PENDING}
                    onClick={() => removeNotDoneActions(true, true, true, true)}
                  >
                    CANCEL
                  </Button>
              )
            }
          );
      }

      //coral stations.
      const onCoralPickup = (success) => {
        setCoralAttained({position: coralAttained.position, time: currentTime, done: true});
        if (!success){
          setCoralDeposited({position: coralAttained.position + "Drop", time: currentTime, done: true});
        }
        removeNotDoneActions(false, true, true, true);
      }

      if (coralAttained!=null &&
        !coralAttained.done &&
        typeof coralAttained.position == "string" &&
        (coralAttained.position.includes("CoralStation"))){
          buttonsList.push(
            {id: 0,
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
                <Button
                    variant="contained"
                    color={COLORS.PENDING}
                    onClick={() => onCoralPickup(false)}
                  >
                    MISS CORAL PICKUP
                  </Button>
              )
            },
            {
              id: 2,
              flexWeight: 1,
              component: (
                <Button
                    variant="contained"
                    color={COLORS.PENDING}
                    onClick={() => removeNotDoneActions(true, true, true, true)}
                  >
                    CANCEL
                  </Button>
              )
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
