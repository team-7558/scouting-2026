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
import {
  FIELD_VIRTUAL_HEIGHT,
  FIELD_VIRTUAL_WIDTH,
  FIELD_ASPECT_RATIO,
  PERSPECTIVE,
} from "./ScoutMatch/Constants";

const { SCORING_TABLE_NEAR, SCORING_TABLE_FAR } = PERSPECTIVE;

const isScoringTableFar = (perspective) => perspective == SCORING_TABLE_FAR;
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
  actualHeight,
  perspective = SCORING_TABLE_NEAR
) => {
  if (isScoringTableFar(perspective)) {
    fieldX = FIELD_VIRTUAL_WIDTH - fieldX;
    fieldY = FIELD_VIRTUAL_HEIGHT - fieldY;
  }
  fieldX = fieldX - width / 2;
  fieldY = fieldY - height / 2;
  const expectedWidth = actualHeight * FIELD_ASPECT_RATIO;
  const offsetX = Math.max((actualWidth - expectedWidth) / 2, 0);

  const scaledX = (fieldX / FIELD_VIRTUAL_WIDTH) * expectedWidth - offsetX;
  const scaledY = (fieldY / FIELD_VIRTUAL_HEIGHT) * actualHeight;
  const scaledWidth = (width / FIELD_VIRTUAL_WIDTH) * expectedWidth;
  const scaledHeight = (height / FIELD_VIRTUAL_HEIGHT) * actualHeight;

  return { scaledX, scaledY, scaledWidth, scaledHeight };
};

/**
 * Converts screen (x, y) coordinates into virtual field coordinates,
 * considering aspect ratio adjustments.
 */
const scaleToFieldCoordinates = (
  x,
  y,
  actualWidth,
  actualHeight,
  perspective = SCORING_TABLE_NEAR
) => {
  const expectedWidth = actualHeight * FIELD_ASPECT_RATIO;
  const offsetX = Math.max((actualWidth - expectedWidth) / 2, 0);

  let fieldX = Math.round(
    ((x - offsetX) / expectedWidth) * FIELD_VIRTUAL_WIDTH
  );
  let fieldY = Math.round((y / actualHeight) * FIELD_VIRTUAL_HEIGHT);
  console.log(perspective);
  if (isScoringTableFar(perspective)) {
    fieldX = FIELD_VIRTUAL_WIDTH - fieldX;
    fieldY = FIELD_VIRTUAL_HEIGHT - fieldY;
  }
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
  perspective,
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
    parentSize.height,
    perspective
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
      {/* {fieldX + ", " + fieldY} */}
      {children}
    </Box>
  );
};

/**
 * FieldCanvas renders a canvas with the field image and provides a container
 * for FieldLocalComponent children. It handles mouse interactions and resizing.
 */
const FieldCanvas = forwardRef(
  ({ theme, children, onClick, height, perspective, strokes }, ref) => {
    // Existing initialization code
    const initialSize = { width: height * FIELD_ASPECT_RATIO, height: height };
    const [canvasSize, setCanvasSize] = useState(initialSize);
    const [cursorCoordinates, setCursorCoordinates] = useState(null);
    const canvasRef = useRef(null);

    useImperativeHandle(ref, () => ({
      scaleWidthToActual: (virtualWidth) =>
        (virtualWidth * canvasSize.width) / FIELD_VIRTUAL_WIDTH,
      scaleHeightToActual: (virtualHeight) =>
        (virtualHeight * canvasSize.height) / FIELD_VIRTUAL_HEIGHT,
    }));

    useLayoutEffect(() => {
      const newSize = { width: height * FIELD_ASPECT_RATIO, height: height };
      setCanvasSize(newSize);
    }, [height]);

    // // Draw the field image on the canvas.
    // useEffect(() => {
    //   const canvas = canvasRef.current;
    //   if (!canvas) return;
    //   const ctx = canvas.getContext("2d");
    //   const image = new Image();
    //   image.src = fullField;
    //   const flipX = isScoringTableFar(perspective);
    //   const flipY = isScoringTableFar(perspective);
    //   image.onload = () => {
    //     ctx.clearRect(0, 0, canvas.width, canvas.height);

    //     // Save the current context state.
    //     ctx.save();

    //     // If flipX is true, translate horizontally by the canvas width.
    //     // If flipY is true, translate vertically by the canvas height.
    //     ctx.translate(flipX ? canvas.width : 0, flipY ? canvas.height : 0);

    //     // Scale the context to flip the image.
    //     // A scale factor of -1 flips the image.
    //     ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

    //     // Draw the image onto the canvas.
    //     ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    //     // Restore the context to its original state.
    //     ctx.restore();
    //   };
    // }, [canvasSize]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const image = new Image();
      image.src = fullField;
      const flipX = isScoringTableFar(perspective);
      const flipY = isScoringTableFar(perspective);
      image.onload = () => {
        // Clear the canvas and draw the field image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(flipX ? canvas.width : 0, flipY ? canvas.height : 0);
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // ---- Added Stroke Drawing Code ----
        if (strokes && strokes.length > 0) {
          strokes.forEach((stroke) => {
            if (!stroke.points || stroke.points.length === 0) return;
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.beginPath();
            stroke.points.forEach((pt, idx) => {
              // Start with the provided field coordinates
              let { fieldX, fieldY } = pt;
              // If the perspective is flipped, adjust the coordinates.
              if (isScoringTableFar(perspective)) {
                fieldX = FIELD_VIRTUAL_WIDTH - fieldX;
                fieldY = FIELD_VIRTUAL_HEIGHT - fieldY;
              }
              // Scale the field coordinates to actual canvas dimensions.
              const scaledX = (fieldX / FIELD_VIRTUAL_WIDTH) * canvas.width;
              const scaledY = (fieldY / FIELD_VIRTUAL_HEIGHT) * canvas.height;
              if (idx === 0) ctx.moveTo(scaledX, scaledY);
              else ctx.lineTo(scaledX, scaledY);
            });
            ctx.stroke();
          });
        }
        // -------------------------------------
      };
    }, [canvasSize, perspective, strokes]);

    const handleMouseInteraction = (event, isClick = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const coords = scaleToFieldCoordinates(
        x,
        y,
        canvas.width,
        canvas.height,
        perspective
      );
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
            // background: theme.palette.background.default,
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
            FieldX: {cursorCoordinates.fieldX}, FieldY:{" "}
            {cursorCoordinates.fieldY}
          </Box>
        )}
      </Box>
    );
  }
);

export { FieldCanvas, FieldLocalComponent };
