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
import ScaledBox from "./ScaledBox.js";

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

  const StartingPositionSlider = (match) => {
    const fieldRef = fieldCanvasRef.current;
    console.log("Vanshil", fieldRef);
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
            width: fieldRef.scaleWidthToActual(75),
            color: startingPosition == -1 ? COLORS.INACTIVE : COLORS.ACTIVE,
          },
          "& .MuiSlider-rail": {
            width: fieldRef.scaleWidthToActual(75),
            color: startingPosition == -1 ? COLORS.INACTIVE : COLORS.ACTIVE,
          },
        }}
      />
    );
  };

  const renderFieldCanvas = (scaledBoxRect) => {
    const PrematchChildren = [
      createFieldLocalMatchComponent(
        "startingPositionSlider",
        1516,
        805,
        150,
        1310,
        StartingPositionSlider
      ),
      createFieldLocalMatchComponent(
        "defenceButton",
        1755,
        805,
        200,
        200,
        (match) => (
          <Button
            variant="contained"
            sx={{
              fontSize: scaledBoxRect.fontSize,
              width: "100%",
              height: "100%",
              minWidth: 0,
              minHeight: 0,
              padding: "none",
            }}
            onClick={() => match.setIsDefending((prev) => !prev)}
          >
            {match.isDefending ? "Offence" : "Defence"}
          </Button>
        )
      ),
    ];

    const fieldChildren = [
      ...PrematchChildren,
      // ...AutoButtons,
      //...
    ];
    return (
      <Box
        sx={{
          transform: `translateX(${isDefending ? -61 : 0}%)`,
        }}
      >
        {scaledBoxRect.width > 0 && (
          <FieldCanvas
            ref={fieldCanvasRef}
            theme={BlueTheme}
            boundingWidth={scaledBoxRect.width}
            boundingHeight={scaledBoxRect.height}
            children={fieldChildren}
          />
        )}
      </Box>
    );
  };

  const renderSideBar = () => {
    return <div>Sidebar Content</div>;
  };

  return (
    <MatchContext.Provider value={CONTEXT_WRAPPER}>
      <ThemeProvider theme={BlueTheme}>
        <ScaledBox>
          {(scaledBoxRect) => (
            <>
              <Box
                sx={{
                  position: "absolute",
                  left: "25%",
                  width: "75%",
                  height: "100%",
                  overflow: "hidden",
                }}
              >
                {renderFieldCanvas(scaledBoxRect)}
              </Box>
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  width: "25%",
                  height: "100%",
                }}
              >
                {renderSideBar()}
              </Box>
            </>
          )}
        </ScaledBox>
      </ThemeProvider>
    </MatchContext.Provider>
  );
};

const createFieldLocalMatchComponent = (
  id,
  fieldX,
  fieldY,
  virtualWidth,
  virtualHeight,
  componentFunction
) => {
  return (
    <MatchContext.Consumer key={id}>
      {(match) => (
        <FieldLocalComponent
          fieldX={fieldX}
          fieldY={fieldY}
          virtualWidth={virtualWidth}
          virtualHeight={virtualHeight}
        >
          {componentFunction(match)}
        </FieldLocalComponent>
      )}
    </MatchContext.Consumer>
  );
};

export default ScoutMatch;
