import React, {
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Box } from "@mui/material";
import fullField from "../assets/scouting-2025/field/full_field.png";

// Virtual field dimensions
const fieldVirtualWidth = 3510;
const fieldVirtualHeight = 1610;
const fieldAspectRatio = fieldVirtualWidth / fieldVirtualHeight;

/**
 * Converts virtual field coordinates and dimensions into actual screen coordinates,
 * considering aspect ratio adjustments.
 *
 * @param {number} fieldX - Virtual x coordinate.
 * @param {number} fieldY - Virtual y coordinate.
 * @param {number} width - Virtual width of the element.
 * @param {number} height - Virtual height of the element.
 * @param {number} actualWidth - Measured width of the container.
 * @param {number} actualHeight - Measured height of the container.
 */
const scaleCoordinates = (
  fieldX,
  fieldY,
  width,
  height,
  actualWidth,
  actualHeight
) => {
  const expectedWidth = actualHeight * fieldAspectRatio;
  const offsetX = Math.max((actualWidth - expectedWidth) / 2, 0);

  const scaledX = (fieldX / fieldVirtualWidth) * expectedWidth + offsetX;
  const scaledY = (fieldY / fieldVirtualHeight) * actualHeight;
  const scaledWidth = (width / fieldVirtualWidth) * expectedWidth;
  const scaledHeight = (height / fieldVirtualHeight) * actualHeight;

  return { scaledX, scaledY, scaledWidth, scaledHeight };
};

/**
 * Converts screen (x, y) coordinates into virtual field coordinates,
 * considering aspect ratio adjustments.
 */
const scaleToFieldCoordinates = (x, y, actualWidth, actualHeight) => {
  const expectedWidth = actualHeight * fieldAspectRatio;
  const offsetX = Math.max((actualWidth - expectedWidth) / 2, 0);

  const fieldX = Math.round(
    ((x - offsetX) / expectedWidth) * fieldVirtualWidth
  );
  const fieldY = Math.round((y / actualHeight) * fieldVirtualHeight);

  return { fieldX, fieldY };
};

/**
 * FieldLocalComponent positions its children based on virtual field coordinates.
 * It waits for its parent's dimensions (with a fallback default) before rendering.
 */
const FieldLocalComponent = ({
  fieldX,
  fieldY,
  fieldWidth,
  fieldHeight,
  children,
}) => {
  const localRef = useRef(null);
  // Fallback defaults in case parent's size is not yet measured
  const [parentSize, setParentSize] = useState({ width: 300, height: 300 });

  useLayoutEffect(() => {
    const updateSize = () => {
      if (localRef.current?.parentElement) {
        const { clientWidth, clientHeight } = localRef.current.parentElement;
        setParentSize({ width: clientWidth, height: clientHeight });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const { scaledX, scaledY, scaledWidth, scaledHeight } = scaleCoordinates(
    fieldX,
    fieldY,
    fieldWidth,
    fieldHeight,
    parentSize.width,
    parentSize.height
  );

  return (
    <Box
      ref={localRef}
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

/**
 * FieldCanvas renders a canvas with the field image and provides a container
 * for FieldLocalComponent children. It handles mouse interactions and resizing.
 */
const FieldCanvas = forwardRef(({ theme, children, onClick, height }, ref) => {
  // Use a default size based on the provided height and the field's aspect ratio.
  const initialSize = { width: height * fieldAspectRatio, height: height };
  const [canvasSize, setCanvasSize] = useState(initialSize);
  const [cursorCoordinates, setCursorCoordinates] = useState(null);

  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    scaleWidthToActual: (virtualWidth) =>
      (virtualWidth * canvasSize.width) / fieldVirtualWidth,
    scaleHeightToActual: (virtualHeight) =>
      (virtualHeight * canvasSize.height) / fieldVirtualHeight,
  }));

  // Update canvas dimensions whenever the 'height' prop changes.
  useLayoutEffect(() => {
    const newSize = { width: height * fieldAspectRatio, height: height };
    setCanvasSize(newSize);
  }, [height]);

  // Draw the field image on the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const image = new Image();
    image.src = fullField;
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
  }, [canvasSize]);

  const handleMouseInteraction = (event, isClick = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const coords = scaleToFieldCoordinates(x, y, canvas.width, canvas.height);
    if (isClick) {
      onClick(coords.fieldX, coords.fieldY);
    } else {
      setCursorCoordinates({ canvasX: x, canvasY: y, ...coords });
    }
  };

  const keepInside = (coord, boundary, safety) =>
    boundary - coord < safety ? coord - safety : coord;

  return (
    <Box
      style={{
        position: "relative",
        width: canvasSize.width,
        height: canvasSize.height,
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          background: theme.palette.background.default,
        }}
        onClick={(e) => handleMouseInteraction(e, true)}
        onMouseMove={(e) => handleMouseInteraction(e)}
        onMouseLeave={() => setCursorCoordinates(null)}
      />
      {children}
      {cursorCoordinates && (
        <Box
          style={{
            position: "absolute",
            left: keepInside(
              cursorCoordinates.canvasX + 10,
              canvasSize.width,
              200
            ),
            top: keepInside(
              cursorCoordinates.canvasY + 10,
              canvasSize.height,
              30
            ),
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "2px 4px",
            borderRadius: "2px",
            fontSize: "12px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          FieldX: {cursorCoordinates.fieldX}, FieldY: {cursorCoordinates.fieldY}
        </Box>
      )}
    </Box>
  );
});

export { FieldCanvas, FieldLocalComponent };
