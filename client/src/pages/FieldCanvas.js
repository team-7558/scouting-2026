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

const scale = (value, startingDimen, targetDimen) =>
  (value * targetDimen) / startingDimen;

const fieldWidthCm = 1755;
const fieldHeightCm = 805;

// Dimensions of the full field in virtual pixels
const fieldVirtualWidth = 3510;
const fieldVirtualHeight = 1610;

const fieldAspectRatio = fieldVirtualWidth / fieldVirtualHeight;

const FieldContext = createContext();

const convertToVirtualX = (canvasBoundingWidth, actualX) => {
  return Math.round((actualX / canvasBoundingWidth) * fieldVirtualWidth);
};

const convertToVirtualY = (boundingHeight, actualY) => {
  return Math.round((actualY / boundingHeight) * fieldVirtualHeight);
};

const FieldLocalComponent = ({
  fieldX,
  fieldY,
  virtualWidth,
  virtualHeight,
  children,
}) => {
  const fieldContext = useContext(FieldContext);

  // Scale field coordinates to canvas coordinates
  const scaleCoordinates = () => {
    const { canvasBoundingWidth, boundingHeight } = fieldContext;
    const scaledX = scale(fieldX, fieldVirtualWidth, canvasBoundingWidth);
    const scaledY = scale(fieldY, fieldVirtualHeight, boundingHeight);
    const scaledWidth = scale(
      virtualWidth,
      fieldVirtualWidth,
      canvasBoundingWidth
    );
    const scaledHeight = scale(
      virtualHeight,
      fieldVirtualHeight,
      boundingHeight
    );
    return { scaledX, scaledY, scaledWidth, scaledHeight };
  };

  const { scaledX, scaledY, scaledWidth, scaledHeight } = scaleCoordinates();
  return (
    <Box
      style={{
        position: "absolute",
        left: scaledX - scaledWidth / 2,
        top: scaledY - scaledHeight / 2,
        width: scaledWidth,
        height: scaledHeight,
      }}
    >
      {children}
    </Box>
  );
};

const FieldCanvas = forwardRef(
  ({ theme, children, boundingWidth, boundingHeight }, ref) => {
    const canvasBoundingWidth = boundingHeight * fieldAspectRatio;
    const CONTEXT_WRAPPER = {
      boundingWidth,
      boundingHeight,
      canvasBoundingWidth,
    };
    const canvasRef = useRef(null);

    const scaleWidthToActual = (virtualWidth) =>
      scale(virtualWidth, fieldVirtualWidth, canvasBoundingWidth);

    const scaleHeightToActual = (virtualHeight) =>
      scale(virtualHeight, fieldVirtualHeight, boundingHeight);

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
        canvas.height = boundingHeight;
        canvas.width = boundingHeight * fieldAspectRatio;

        // Clear the canvas and draw the image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(fieldImage, 0, 0, canvas.width, canvas.height);
      };
    };

    useEffect(() => {
      drawFieldImage();
    }, []);

    const [cursorPosition, setCursorPosition] = useState({
      x: 0,
      y: 0,
      canvasX: 0,
      canvasY: 0,
    });
    const handleMouseMove = (event) => {
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();
      setCursorPosition({
        x: Math.round(event.clientX - rect.left) + 30,
        y: Math.round(event.clientY - rect.top) + 30,
        canvasX: convertToVirtualX(
          canvasBoundingWidth,
          Math.round(event.clientX - rect.left)
        ),
        canvasY: convertToVirtualY(
          boundingHeight,
          Math.round(event.clientY - rect.top)
        ),
      });
    };
    //debugging things
    const DisplayMouseCoords = () => {
      return (
        <p
          style={{
            position: "absolute",
            left: cursorPosition.x,
            top: cursorPosition.y,
            color: "#8888FF",
          }}
        >
          {cursorPosition.canvasX},{cursorPosition.canvasY}
        </p>
      );
    };
    return (
      <FieldContext.Provider value={CONTEXT_WRAPPER}>
        <Box
          onMouseMove={handleMouseMove}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              background: theme.palette.background.default,
              height: boundingHeight,
              width: canvasBoundingWidth,
            }}
          />
          {/* Render dynamic child components */}
          {children}
          <DisplayMouseCoords />
        </Box>
      </FieldContext.Provider>
    );
  }
);

export { FieldCanvas, FieldLocalComponent };
