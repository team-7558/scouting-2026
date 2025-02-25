import React, { useState, useLayoutEffect, useRef } from "react";
import { Box, Button } from "@mui/material";
import { FieldCanvas } from "../FieldCanvas"; // Leave FieldCanvas unchanged
import {
  FIELD_VIRTUAL_WIDTH,
  FIELD_VIRTUAL_HEIGHT,
  FIELD_ASPECT_RATIO,
  PERSPECTIVE,
} from "../../pages/ScoutMatch/Constants";

const MatchStrategy = () => {
  // Get overall container dimensions.
  const [containerDims, setContainerDims] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useLayoutEffect(() => {
    const handleResize = () => {
      setContainerDims({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper: Scale a virtual value (base width 1920) to the actual container width.
  const scaleWidthToActual = (virtualValue) =>
    (virtualValue / 1920) * containerDims.width;

  // Reserve 10% of height for top and 10% for bottom control panels.
  const topPanelHeight = containerDims.height * 0.1;
  const bottomPanelHeight = containerDims.height * 0.1;
  const drawingAreaHeight =
    containerDims.height - topPanelHeight - bottomPanelHeight;
  const drawingAreaWidth = containerDims.width;

  // FieldCanvas uses a fixed aspect ratio.
  let fieldCanvasHeight = drawingAreaHeight;
  if (fieldCanvasHeight * FIELD_ASPECT_RATIO > drawingAreaWidth) {
    fieldCanvasHeight = drawingAreaWidth / FIELD_ASPECT_RATIO;
  }
  const fieldCanvasWidth = fieldCanvasHeight * FIELD_ASPECT_RATIO;
  // Center FieldCanvas within the drawing area.
  const offsetX = (drawingAreaWidth - fieldCanvasWidth) / 2;
  const offsetY = (drawingAreaHeight - fieldCanvasHeight) / 2;

  // ----------------- Drawing State -----------------
  // Each stroke: { color, points: [{ fieldX, fieldY }] }
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [selectedColor, setSelectedColor] = useState("black");
  const [perspective, setPerspective] = useState(
    PERSPECTIVE.SCORING_TABLE_NEAR
  );
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  // For the eraser, store relative coordinates (rx, ry) where 0 ≤ rx,ry ≤ 1.
  const [eraserCursor, setEraserCursor] = useState(null);

  // Ref for the transparent overlay.
  const overlayRef = useRef(null);

  // Conversion: Given mouse coordinates (x,y) relative to the overlay (which is fieldCanvasWidth x fieldCanvasHeight),
  // convert them into field coordinates.
  const convertToFieldCoordinates = (x, y) => {
    const clampedX = Math.max(0, Math.min(x, fieldCanvasWidth));
    const clampedY = Math.max(0, Math.min(y, fieldCanvasHeight));
    let fieldX = Math.round(
      (clampedX / fieldCanvasWidth) * FIELD_VIRTUAL_WIDTH
    );
    let fieldY = Math.round(
      (clampedY / fieldCanvasHeight) * FIELD_VIRTUAL_HEIGHT
    );
    if (perspective === PERSPECTIVE.SCORING_TABLE_FAR) {
      fieldX = FIELD_VIRTUAL_WIDTH - fieldX;
      fieldY = FIELD_VIRTUAL_HEIGHT - fieldY;
    }
    return { fieldX, fieldY };
  };

  // Eraser threshold in field units.
  const eraserThreshold = 20;
  const performEraser = (fieldPoint) => {
    setStrokes((prev) =>
      prev.filter((stroke) => {
        return !stroke.points.some((pt) => {
          const dx = pt.fieldX - fieldPoint.fieldX;
          const dy = pt.fieldY - fieldPoint.fieldY;
          return Math.sqrt(dx * dx + dy * dy) < eraserThreshold;
        });
      })
    );
  };

  // ----------------- Mouse Event Handlers -----------------
  const handleMouseDown = (e) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const fieldPoint = convertToFieldCoordinates(x, y);
    if (isEraserActive) {
      setIsErasing(true);
      performEraser(fieldPoint);
      // Store relative coordinates.
      setEraserCursor({ rx: x / fieldCanvasWidth, ry: y / fieldCanvasHeight });
    } else {
      setCurrentStroke({ color: selectedColor, points: [fieldPoint] });
    }
  };

  const handleMouseMove = (e) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (isEraserActive && isErasing) {
      setEraserCursor({ rx: x / fieldCanvasWidth, ry: y / fieldCanvasHeight });
      const fieldPoint = convertToFieldCoordinates(x, y);
      performEraser(fieldPoint);
      return;
    }
    if (!currentStroke) return;
    const fieldPoint = convertToFieldCoordinates(x, y);
    setCurrentStroke((prev) => ({
      ...prev,
      points: [...prev.points, fieldPoint],
    }));
  };

  const handleMouseUp = () => {
    if (!isEraserActive && currentStroke) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
    if (isEraserActive) {
      setIsErasing(false);
      setEraserCursor(null);
    }
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const togglePerspective = () => {
    setPerspective((prev) =>
      prev === PERSPECTIVE.SCORING_TABLE_NEAR
        ? PERSPECTIVE.SCORING_TABLE_FAR
        : PERSPECTIVE.SCORING_TABLE_NEAR
    );
  };

  // ----------------- Button Scaling -----------------
  // Use 30 as the base virtual font size.
  const btnSx = {
    fontSize: `${scaleWidthToActual(30)}px`,
    minWidth: 0,
    minHeight: 0,
    padding: `${scaleWidthToActual(10)}px ${scaleWidthToActual(20)}px`,
  };

  return (
    <Box
      sx={{
        width: containerDims.width,
        height: containerDims.height,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top Control Panel */}
      <Box
        sx={{
          height: topPanelHeight,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        {["black", "red", "blue", "green", "orange"].map((c) => (
          <Button
            key={c}
            variant={
              selectedColor === c && !isEraserActive ? "contained" : "outlined"
            }
            onClick={() => {
              setSelectedColor(c);
              setIsEraserActive(false);
            }}
            sx={{ ...btnSx, backgroundColor: c, color: "white" }}
          >
            {c}
          </Button>
        ))}
        <Button
          variant={isEraserActive ? "contained" : "outlined"}
          onClick={() => setIsEraserActive((prev) => !prev)}
          sx={btnSx}
        >
          Eraser
        </Button>
        <Button variant="outlined" onClick={handleUndo} sx={btnSx}>
          Undo
        </Button>
        <Button variant="outlined" onClick={togglePerspective} sx={btnSx}>
          Flip
        </Button>
      </Box>

      {/* Drawing Area */}
      <Box
        sx={{
          width: drawingAreaWidth,
          height: drawingAreaHeight,
          position: "relative",
          backgroundColor: "#fff",
          overflow: "hidden",
          margin: "0 auto",
        }}
      >
        {/* Container to center FieldCanvas */}
        <Box sx={{ position: "absolute", top: offsetY, left: offsetX }}>
          <FieldCanvas
            height={fieldCanvasHeight}
            perspective={perspective}
            strokes={currentStroke ? [...strokes, currentStroke] : strokes}
          />
          {/* Transparent overlay to capture mouse events */}
          <Box
            ref={overlayRef}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: fieldCanvasWidth,
              height: fieldCanvasHeight,
              cursor: isEraserActive ? "not-allowed" : "crosshair",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </Box>
      </Box>

      {/* Bottom Control Panel with Placeholder Buttons */}
      <Box
        sx={{
          height: bottomPanelHeight,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Button variant="outlined" sx={btnSx}>
          Placeholder 1
        </Button>
        <Button variant="outlined" sx={btnSx}>
          Placeholder 2
        </Button>
        <Button variant="outlined" sx={btnSx}>
          Placeholder 3
        </Button>
      </Box>

      {/* Eraser Cursor Indicator */}
      {isEraserActive && eraserCursor && (
        <Box
          sx={{
            position: "absolute",
            // Compute absolute position using the relative coordinates.
            top: topPanelHeight + offsetY + eraserCursor.ry * fieldCanvasHeight,
            left: offsetX + eraserCursor.rx * fieldCanvasWidth,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid rgba(0,0,0,0.5)",
            backgroundColor: "rgba(255,255,255,0.4)",
            pointerEvents: "none",
            zIndex: 10,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </Box>
  );
};

export default MatchStrategy;
