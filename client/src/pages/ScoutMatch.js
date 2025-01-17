import React, { useState, useRef, useEffect } from "react";

import { ThemeProvider } from "@mui/material/styles";
import { BlueTheme } from "./BlueTheme.js";

import fieldBlueLeft from "../assets/scouting-2025/field/blue_left.png";
import coralIconImage from "../assets/scouting-2025/coralIcon.png";
import algaeIconImage from "../assets/scouting-2025/algaeIcon.png";
import { Box, Button } from "@mui/material";

//Canvas Helpers
const aspectRatio = 16 / 9;
/** define all button placements based on this synthetic*/
const virtualWidth = aspectRatio * 900;
const virtualHeight = 900;

const fieldWidth = virtualWidth * 0.7;

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
      canvas.width * 0.3,
      0,
      canvas.width * 0.7,
      canvas.height
    );
  };
};

//Scout Match Component
const ScoutMatch = () => {
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

  return (
    <ThemeProvider theme={BlueTheme}>
      <Box sx={{ position: "relative", width: "100vw", height: "100vh" }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          style={{
            overflow: "hidden",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#ffffff",
          }}
        />
        // show curser with canvas coordinates
        <p
          style={{
            color: "#000",
            position: "absolute",
            left: cursorPosition.x,
            top: cursorPosition.y,
            pointerEvents: "none",
          }}
        >
          {cursorPosition.canvasX},{cursorPosition.canvasY}
        </p>
        <CanvasButton
          canvasRect={canvasRect}
          x={1500} // Virtual canvas x-coordinate (relative to 1600x900px)
          y={800} // Virtual canvas y-coordinate (relative to 1600x900px)
          width={100}
          height={100}
          color="primary"
          variant="contained"
          label="Button 1"
          onClick={() => alert("Button 1 clicked!")}
        />
        <CanvasButton
          canvasRect={canvasRect}
          x={400} // Virtual canvas x-coordinate
          y={300} // Virtual canvas y-coordinate
          width={100}
          height={100}
          color="secondary"
          variant="contained"
          label="Button 2"
          onClick={() => alert("Button 2 clicked!")}
        />
      </Box>
    </ThemeProvider>
  );
};
export default ScoutMatch;
