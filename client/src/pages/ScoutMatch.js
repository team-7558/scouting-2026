import React, { useState, useRef, useEffect, startTransition } from "react";

import { ThemeProvider } from "@mui/material/styles";
import Slider from '@mui/material/Slider';
import { BlueTheme } from "./BlueTheme.js";

import fieldBlueLeft from "../assets/scouting-2025/field/blue_left.png";
import coralIconImage from "../assets/scouting-2025/coralIcon.png";
import algaeIconImage from "../assets/scouting-2025/algaeIcon.png";
import { Box, Button } from "@mui/material";
import e from "cors";

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
  const convertToActualYLength = (virtualY) => {
    return virtualY * (canvasRect.width / virtualWidth);
  }
  const convertToActualXLength = (virtualX) => {
    return virtualX * (canvasRect.width / virtualWidth);
  }

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

    const FieldSlider = ({x, y, height, ...props }) => {
      
    }

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
    return (<p
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
  }
  

  //general states
  const phases = {preMatch: 0}
  const [phase, setPhase] = useState(phases.preMatch);

  //pre-match states
  const [startPos, setStartPos] = useState(-10);
  const [preload, setPreload] = useState(null);
  const [startPosSlider, setStartPosSlider] = useState({
    width: 100,
    markerColor: "#FF0000",
    railColor: "#FFAAAA",
    trackColor: "#FFAAAA"
  });

  const [preloadButton, setPreloadButton] = useState({
    color: "error",
    text: "Preload?"
  });

  const [startMatchButton, setStartMatchButton] = useState({
    color: "disabled"
  })
  if (phase==phases.preMatch){    
    const onStartPosSliderClicked = (value) => {
      let startPosSliderCopy = JSON.parse(JSON.stringify(startPosSlider));
      startPosSliderCopy.width = 5;
      startPosSliderCopy.markerColor = "#00FF00";
      startPosSliderCopy.railColor = "#ABABAB";
      startPosSliderCopy.trackColor = "#AAAAFF";
      setStartPosSlider(startPosSliderCopy);
      setStartPos(value);

      if (preload!=null){
        setStartMatchButton({color: "primary"});
      }
    }

    const onPreloadButtonClicked = () => {
      if (preload==null || preload==false){
        setPreload(true);
        let preloadButtonCopy = JSON.parse(JSON.stringify(preloadButton));
        preloadButtonCopy.color="primary";
        preloadButtonCopy.text="Preload Coral";
        setPreloadButton(preloadButtonCopy);
      }else{
        setPreload(false);
        let preloadButtonCopy = JSON.parse(JSON.stringify(preloadButton));
        preloadButtonCopy.color="secondary";
        preloadButtonCopy.text="No Preload";
        setPreloadButton(preloadButtonCopy);
      }

      if (startPos>=0){
        setStartMatchButton({color: "primary"});
      }
    }

    const onStartMatchButtonClicked = () => {
      if (startMatchButton.color != "disabled"){
        alert("go to auto");
      }
    }
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

            {/* start match */}
            <CanvasButton 
              x={20}
              y={20}
              height={400}
              width={400}
              color={startMatchButton.color}
              variant="contained"
              label="Start Match"
              onClick={onStartMatchButtonClicked}
            />

            {/* preload */}
            <CanvasButton
              x={20}
              y={500}
              height={200}
              width={400}
              color={preloadButton.color}
              variant="contained"
              label={preloadButton.text}
              onClick={onPreloadButtonClicked}
            />      

            {/* start position slider. Cannot be wrapped in it's own component or it re-renders anytime it is moved, so you can't drag it */}
            <Slider
              orientation="vertical"
              value={startPos}
              onChange={(event, value) => onStartPosSliderClicked(value)}
              min={0}
              max={100}
              step={0.1}
              valueLabelDisplay="auto"
              sx={{
                position: "absolute",
                top: convertToActualY(20) + "px",
                left: convertToActualX(1315) - convertToActualXLength(startPosSlider.width/2) + "px",
                height: convertToActualYLength(875) + "px",
                width: convertToActualXLength(startPosSlider.width) + "px",
                '& .MuiSlider-thumb': {
                  color: startPosSlider.markerColor,
                },
                '& .MuiSlider-track': {
                  color: startPosSlider.trackColor,
                },
                '& .MuiSlider-rail': {
                  color: startPosSlider.railColor,
                },
              }}
            />

          </Box>
        </ThemeProvider>
      )
  }
};
export default ScoutMatch;
