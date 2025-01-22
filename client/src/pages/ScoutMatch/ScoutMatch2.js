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
  const [coralAttained, setCoralAttained] = useState(null);

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

  const handleMouseMove = (event) => {
    setCursorPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const scaleWidthToActual = (virtualValue) =>
    (virtualValue / virtualWidth) * scaledBoxRect.width;

  const scaleHeightToActual = (virtualValue) =>
    (virtualValue / virtualHeight) * scaledBoxRect.height;

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
        <Button
          variant="contained"
          onClick={() => match.setIsDefending((prev) => !prev)}
        >
          Defence
        </Button>
      )
    ),
  ];

  const renderFieldCanvas = () => {
    const fieldChildren = [
      ...(phase == PHASES.PREMATCH ? PrematchChildren : []),

      // Coral Pickup Buttons
      createFieldLocalMatchComponent(
        "leftCoralStation",
        475,
        0,
        200,
        150,
        (match) => (
          <Button
            variant="contained"
            color={
              match.coralAttained == null ? COLORS.ACTIVE : COLORS.DISABLED
            }
            onClick={() => {
              console.log("left coral station clicked");
            }}
          >
            Left Coral Station
          </Button>
        )
      ),

      createFieldLocalMatchComponent(
        "rightCoralStation",
        475,
        750,
        200,
        150,
        (match) => (
          <Button
            variant="contained"
            color={
              match.coralAttained == null ? COLORS.ACTIVE : COLORS.DISABLED
            }
            onClick={() => {
              console.log("right coral station clicked");
            }}
          >
            Right Coral Station
          </Button>
        )
      ),

      // Reef Buttons
      ...[315, 320, 425, 530, 530, 425].map((y, index) => {
        const x = [895, 1015, 1080, 1015, 895, 835][index];
        return createFieldLocalMatchComponent(
          `reefButton${index}`,
          x,
          y,
          50,
          50,
          (match) => (
            <Button
              variant="contained"
              color={COLORS.ACTIVE}
              sx={{ borderRadius: "50%" }}
            ></Button>
          )
        );
      }),

      // Algae Scores
      createFieldLocalMatchComponent(
        "scoreProcessor",
        1100,
        750,
        300,
        150,
        (match) => (
          <Button variant="contained" color={COLORS.ACTIVE}>
            Score Processor
          </Button>
        )
      ),

      createFieldLocalMatchComponent("scoreNet", 1400, 480, 150, 420, () => (
        <Button variant="contained" color={COLORS.ACTIVE}>
          Score Net
        </Button>
      )),

      // Coral Mark Buttons
      ...[220, 425, 630].map((y, index) => {
        return createFieldLocalMatchComponent(
          `coralMark${index}`,
          590,
          y,
          50,
          50,
          (match) => (
            <Button
              variant="contained"
              color={COLORS.SUCCESS}
              sx={{ borderRadius: "50%" }}
              onClick={() => {
                console.log(`coral mark ${index + 1} clicked`);
              }}
            ></Button>
          )
        );
      }),
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
              color={coralAttained == null ? COLORS.PENDING : COLORS.SUCCESS}
              onClick={() => {
                setCoralAttained(coralAttained == null ? "preload" : null);
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

  const [cursorPosition, setCursorPosition] = useState({
    x: 0,
    y: 0,
    scaledBoxX: 0,
    scaledBoxY: 0,
  });

  return (
    <MatchContext.Provider value={CONTEXT_WRAPPER}>
      <ThemeProvider theme={BlueTheme}>
        <Box
          onMouseMove={handleMouseMove}
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
