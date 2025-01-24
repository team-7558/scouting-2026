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

const COLORS = {
  INACTIVE: "grey",
  PENDING: "info",
  SUCCESS: "success",
  DISABLED: "disabled",
  ACTIVE: "primary",
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
    console.log("finished coral cycle: " + coralAttained.position, coralDeposited.position);
    setCoralAttained(null);
    setCoralDeposited(null);
  }

  //if algae pickup and dropoff are done, clear them. TODO: add to real cycles list
  if (algaeAttained!=null && algaeAttained.done && algaeDeposited != null && algaeDeposited.done){
    console.log("finished algae cycle: " + algaeAttained.position, algaeDeposited.position);
    setAlgaeAttained(null);
    setAlgaeDeposited(null);
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
    setCoralAttained({position: side + "CoralStation", done: true});
  }

  const onReefButtonClicked = (num) => {
    console.log(coralAttained);
    if (coralAttained!=null && coralAttained.done){
      setCoralDeposited({position: "reef" + num, done: false});
    }
    if (algaeAttained==null || !algaeAttained.done){
      setAlgaeAttained({position: "reef" + num, done: false});
    }
  }

  const onAlgaeScored = (location) => {
    setAlgaeDeposited({position: location, done: true});
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
      const drawBorder = (coralDeposited != null && typeof coralDeposited.position == "string" && coralDeposited.position.includes(index)) || 
        (algaeAttained != null && typeof algaeAttained.position == "string" && algaeAttained.position.includes(index))
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

    // Algae Scores - Net TODO: implement the onclick function
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

    // Coral Mark Buttons TODO: implement the onclick function
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
            sx={{ borderRadius: '50%',
              width: '100%',       
              height: '100%',
             }}
            onClick={() => {
              console.log(`coral mark ${index + 1} clicked`);
            }}
          ></FieldButton>
        )
      );
    }),
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
                setCoralAttained((coralAttained == null) ? {position: "preload", done: true} : null);
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

      //temporary button for testing. NEED TO ADD CYCLE TO FULL CYCLES AFTER THIS IS CLICKED, AND ADD L1-4 BUTTONS
      if (coralDeposited != null && typeof coralDeposited.position == "string" && coralDeposited.position.includes("reef") && !coralDeposited.done){
        buttonsList.push(
          {id: 0,
            flexWeight: 5,
            component: (
              <Button
                variant="contained"
                color={COLORS.PENDING}
                onClick={() => {
                  setCoralDeposited({position: coralDeposited.position, done: true});
                  setAlgaeAttained(null);
                }}
              >
                REEF CORAL DROPOFFS
              </Button>
            ),
          }
        );
      }

      //temporary button for testing. 
      if (algaeAttained != null && typeof algaeAttained.position == "string" && algaeAttained.position.includes("reef") && !algaeAttained.done){
        buttonsList.push(
          {id: 0,
            flexWeight: 5,
            component: (
              <Button
                variant="contained"
                color={COLORS.PENDING}
                onClick={() => {
                  setAlgaeAttained({position: algaeAttained.position, done: true});
                  setCoralDeposited(null);
                }}
              >
                REEF ALGAE PICKUPS
              </Button>
            ),
          }
        );
      }
      // Additional button configurations for AUTO phase
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
