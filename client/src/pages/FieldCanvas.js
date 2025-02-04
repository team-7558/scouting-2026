import React, {
  useRef,
  useEffect,
  useState,
  createContext,
  useContext,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Box, Button } from "@mui/material";
import fullField from "../assets/scouting-2025/field/full_field.png";

const fieldWidthCm = 1755;
const fieldHeightCm = 805;

// Dimensions of the full field in virtual pixels
const fieldVirtualWidth = 3510;
const fieldVirtualHeight = 1610;

const fieldAspectRatio = fieldVirtualWidth / fieldVirtualHeight;

const FieldContext = createContext();

// Scale field coordinates to canvas coordinates
const scaleCoordinates = (fieldBoxRect, fieldX, fieldY, width, height) => {
  const scaledX = (fieldX / fieldVirtualWidth) * fieldBoxRect.width;
  const scaledY = (fieldY / fieldVirtualHeight) * fieldBoxRect.height;
  const scaledWidth = (width / fieldVirtualWidth) * fieldBoxRect.width;
  const scaledHeight = (height / fieldVirtualHeight) * fieldBoxRect.height;

  return { scaledX, scaledY, scaledWidth, scaledHeight };
};

const FieldLocalComponent = ({
  fieldX,
  fieldY,
  fieldWidth,
  fieldHeight,
  children,
}) => {
  const context = useContext(FieldContext);
  const { scaledX, scaledY, scaledWidth, scaledHeight } = scaleCoordinates(
    context.fieldBoxRect,
    fieldX,
    fieldY,
    fieldWidth,
    fieldHeight
  );
  return (
    <Box
      style={{
        position: "absolute",
        left: scaledX,
        top: scaledY,
        width: scaledWidth,
        height: scaledHeight,
      }}
    >
      {children}
    </Box>
  );
};

const FieldCanvas = forwardRef(({ theme, fieldBoxRect, children, onClick }, ref) => {
  const CONTEXT_WRAPPER = {
    fieldBoxRect,
  };
  const canvasRef = useRef(null);

  const scaleWidthToActual = (virtualWidth) =>
    (virtualWidth * fieldBoxRect.width) / fieldVirtualWidth;

  const scaleHeightToActual = (virtualHeight) =>
    (virtualHeight * fieldBoxRect.height) / fieldVirtualHeight;

  // Expose methods to the parent via ref
  useImperativeHandle(ref, () => ({
    scaleWidthToActual,
    scaleHeightToActual,
  }));

  // Draw the field image on the canvas
  const drawFieldImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const fieldImage = new Image();
    fieldImage.src = fullField;

    fieldImage.onload = () => {
      // Match height and calculate width based on aspect ratio
      canvas.height = fieldBoxRect.height;
      canvas.width = fieldBoxRect.height * fieldAspectRatio;

      // Clear the canvas and draw the image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(fieldImage, 0, 0, canvas.width, canvas.height);
    };
  };

  useEffect(() => {
    drawFieldImage();
  }, []);

  return (
    <FieldContext.Provider value={CONTEXT_WRAPPER}>
      <Box
        style={{
          position: "relative",
          width: fieldBoxRect.width,
          height: fieldBoxRect.height,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            background: theme.palette.background.default,
            height: fieldBoxRect.height,
            width: fieldBoxRect.height * fieldAspectRatio, // Maintain aspect ratio
          }}
          onClick={(event) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            // Translate from canvas coordinate to field coordinate
            const fieldX = (x / canvas.width) * (fieldVirtualWidth * 1.2);
            const fieldY = (y / canvas.height) * fieldVirtualHeight;
            onClick(Math.round(fieldX), Math.round(fieldY))}}
        />
        {/* Render dynamic child components */}
        {children}
      </Box>
    </FieldContext.Provider>
  );
});

export { FieldCanvas, FieldLocalComponent };
