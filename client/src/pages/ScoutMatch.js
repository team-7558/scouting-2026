import React, { useState, useRef, useEffect, startTransition } from "react";

import { ThemeProvider } from "@mui/material/styles";
import Slider from "@mui/material/Slider";
import { BlueTheme } from "./BlueTheme.js";

import fieldBlueLeft from "../assets/scouting-2025/field/blue_left.png";
import coralIconImage from "../assets/scouting-2025/coralIcon.png";
import algaeIconImage from "../assets/scouting-2025/algaeIcon.png";
import { Box, Button } from "@mui/material";
import e from "cors";

const COLORS = {
  INACTIVE: "grey",
  PENDING: "info",
  SUCCESS: "success",
  DISABLED: "disabled",
  ACTIVE: "primary",
};

//Canvas Helpers
const aspectRatio = 16 / 9;
/** define all button placements based on this synthetic*/
const virtualWidth = aspectRatio * 900;
const virtualHeight = 900;
const fieldBackgroundSize = 0.7;

const fieldWidth = virtualWidth * fieldBackgroundSize;

const getCanvasDimensions = () => {
  const { innerWidth, innerHeight } = window;
  let width = innerWidth;
  let height = width / aspectRatio;
  if (height > innerHeight) {
    height = innerHeight;
    width = innerHeight * aspectRatio;
  }
  return { width, height };
};

const drawCanvas = (canvas) => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const fieldImage = new Image();
  fieldImage.src = fieldBlueLeft;
  fieldImage.onload = () => {
    ctx.drawImage(
      fieldImage,
      canvas.width * (1 - fieldBackgroundSize),
      0,
      canvas.width * fieldBackgroundSize,
      canvas.height
    );
  };
};

//Scout Match Component
const ScoutMatch = (driver_station, team_number, scout_perspective) => {
  const convertToVirtualX = (actualX) => {
    return Math.round(
      (virtualWidth / canvasRect.width) * (actualX - canvasRect.x)
    );
  };
  const convertToVirtualY = (actualY) => {
    return Math.round(
      (virtualHeight / canvasRect.height) * (actualY - canvasRect.y)
    );
  };
  const convertToActualX = (virtualX) => {
    return Math.round(
      (canvasRect.width / virtualWidth) * virtualX + canvasRect.x
    );
  };
  const convertToActualY = (virtualY) => {
    return Math.round(
      (canvasRect.height / virtualHeight) * virtualY + canvasRect.y
    );
  };
  const scaleLengthToActual = (virtualY) => {
    return virtualY * (canvasRect.width / virtualWidth);
  };
  const scaleWidthToActual = (virtualX) => {
    return virtualX * (canvasRect.width / virtualWidth);
  };

  const canvasRef = useRef(null);
  const [canvasRect, setCanvasRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const FieldButton = ({ x, y, width, height, label, ...props }) => {
    const buttonStyle = {
      left: `${convertToActualX(x)}px`,
      top: `${convertToActualY(y)}px`,
      width: width,
      height: height,
    };

    return (
      <CanvasButton sx={buttonStyle} {...props}>
        {label}
      </CanvasButton>
    );
  };

  const CanvasButton = ({ x, y, width, height, label, ...props }) => {
    const buttonStyle = {
      position: "absolute",
      left: `${convertToActualX(x)}px`,
      top: `${convertToActualY(y)}px`,
      width: (width * canvasRect.width) / virtualWidth,
      height: (height * canvasRect.height) / virtualHeight,
      "min-width": 0,
      "min-height": 0,
      padding: "none",
      fontSize: `${Math.min(canvasRect.width, canvasRect.height) * 0.02}px`,
      zIndex: 1,
    };

    const FieldSlider = ({ x, y, height, ...props }) => {};

    return (
      <Button sx={buttonStyle} {...props}>
        {label}
      </Button>
    );
  };

  const [cursorPosition, setCursorPosition] = useState({
    x: 0,
    y: 0,
    canvasX: 0,
    canvasY: 0,
  });
  const handleMouseMove = (event) => {
    setCursorPosition({
      x: event.clientX,
      y: event.clientY,
      canvasX: convertToVirtualX(event.clientX),
      canvasY: convertToVirtualY(event.clientY),
    });
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = getCanvasDimensions();
    canvas.width = width;
    canvas.height = height;

    const rect = canvas.getBoundingClientRect();
    setCanvasRect({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    drawCanvas(canvasRef.current);
  }, [canvasRect]);

  //debugging things
  const DisplayMouseCoords = () => {
    return (
      <p
        style={{
          position: "absolute",
          left: cursorPosition.x + 10,
          top: cursorPosition.y + 10,
          pointerEvents: "none",
          color: "#8888FF",
        }}
      >
        {cursorPosition.canvasX},{cursorPosition.canvasY}
      </p>
    );
  };

  // match state
  const [matchStartTime, setMatchStartTime] = useState(-1);
  const PHASES = { PREMATCH: "prematch", AUTO: "auto", TELE: "tele" };
  const [phase, setPhase] = useState(PHASES.PREMATCH);

  // robot state
  const [startingPosition, setStartingPosition] = useState(-1);
  // preload/(X, Y)coordinates/coral station (if its null, it means they aren't holding coral)
  const [coralAttained, setCoralAttained] = useState(null);

  const StartingPositionSlider = () => {
    return (
      <Slider
        /* start position slider. Cannot be wrapped in it's own component or it re-renders anytime it is moved, so you can't drag it */
        orientation="vertical"
        value={startingPosition}
        onChange={(event, value) => {
          setStartingPosition(value);
        }}
        min={1}
        max={13}
        step={1}
        valueLabelDisplay="auto"
        sx={{
          position: "absolute",
          "margin-top": scaleLengthToActual(75),
          "margin-bottom": scaleLengthToActual(75),
          top: convertToActualY(0),
          left: convertToActualX(1315) - scaleWidthToActual(100 / 2),
          height: scaleLengthToActual(750),
          width: scaleWidthToActual(100),
          "& .MuiSlider-thumb": {
            "background-image": `url(
            "https://i.imgur.com/TqGjfyf.jpg"
          )`,
            width: scaleWidthToActual(150),
            height: scaleWidthToActual(150),
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

  const renderSideBar = () => {
    if (phase == PHASES.PREMATCH) {
      return (
        <div>
          <CanvasButton
            x={20}
            y={20}
            height={400}
            width={400}
            disabled={startingPosition < 0}
            color={COLORS.ACTIVE}
            variant="contained"
            label="Start Match"
            onClick={() => setMatchStartTime(Date.now())}
          />

          <CanvasButton
            x={20}
            y={500}
            height={200}
            width={400}
            color={coralAttained == null ? COLORS.PENDING : COLORS.SUCCESS}
            variant="contained"
            label="Has Preload?"
            onClick={() =>
              setCoralAttained(coralAttained == null ? "preload" : null)
            }
          />
        </div>
      );
    }
  };

  return (
    <ThemeProvider theme={BlueTheme}>
      <Box sx={{ position: "relative", width: "100vw", height: "100vh" }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#ffffff",
          }}
        />
        <DisplayMouseCoords />
        {renderSideBar()}
        {StartingPositionSlider()}
      </Box>
    </ThemeProvider>
  );
};
export default ScoutMatch;
