import React, {
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Box } from "@mui/material";
import fullField from "../assets/scouting-2025/field/full_field.png"; // Make sure this path is correct
import {
  FIELD_VIRTUAL_HEIGHT,
  FIELD_VIRTUAL_WIDTH,
  FIELD_ASPECT_RATIO,
  PERSPECTIVE,
  PHASES,
} from "./ScoutMatch/Constants";

const { SCORING_TABLE_FAR } = PERSPECTIVE;

const isScoringTableFar = (perspective) => perspective === SCORING_TABLE_FAR;

const getDefenseOffset = (isBlue, isDefending) => {
  if (!isDefending) return 0;
  return isBlue ? 0.38 : -0.38;
}

// ===================================================================================
// HOW IT WORKS, PART 1: The Coordinate Scaling Functions
// These two functions are the "single source of truth" for all coordinate math.
// ===================================================================================

const SCREEN_FIELD_VIRTUAL_WIDTH = FIELD_VIRTUAL_WIDTH * 0.62;
const imageScaleGlobal = 1;
const imageOffsetXGlobal = (isBlue) => isBlue ? -0.382 : 0;

const scaleCoordinates = (
  fieldX, fieldY, width, height, actualWidth, actualHeight, perspective, isBlue, isDefending, flip
) => {
  const imageScale = imageScaleGlobal;
  const imageOffsetX = imageOffsetXGlobal(isBlue);

  console.log("flip", flip);
  if (!flip) {
    console.log("here");
    const topLeftX = fieldX - width / 2;
    const topLeftY = fieldY - height / 2;

    // Convert the final virtual coordinate to a screen pixel coordinate.
    const scaledX = (topLeftX / FIELD_VIRTUAL_WIDTH) * actualWidth;
    const scaledY = (topLeftY / FIELD_VIRTUAL_HEIGHT) * actualHeight;

    const scaledWidth = (width / FIELD_VIRTUAL_WIDTH) * actualWidth;
    const scaledHeight = (height / FIELD_VIRTUAL_HEIGHT) * actualHeight;

    console.log("stuff", fieldX, scaledX, fieldY, scaledY, scaledWidth, scaledHeight);

    return { scaledX, scaledY, scaledWidth, scaledHeight };
  }

  // --- START OF THE FIX ---

  let flipX = false;
  let flipY = false;

  // Rule 1: Perspective flips X. We toggle the flipX state.
  if (isScoringTableFar(perspective)) {
    fieldX = SCREEN_FIELD_VIRTUAL_WIDTH - fieldX;
    flipY = !flipY;
  }

  // Rule 2: Blue alliance flips both X and Y. We toggle both states.
  if (isBlue) {
    flipX = !flipX;
    flipY = !flipY;
  }

  let fieldX2 = fieldX;

  if (flip) {
    fieldX2 = fieldX -
      (getDefenseOffset(isBlue, isDefending) *
        FIELD_VIRTUAL_WIDTH *
        0.85
        * (isScoringTableFar(perspective) ? 1 : -1)
      );
  }
  //multiply by 0.85 because the buttons need to move a little less than the picture


  // 2. Apply the final transformation state ONCE to the original coordinates.
  const finalX = flipX ? FIELD_VIRTUAL_WIDTH - fieldX2 : fieldX2;
  const finalY = flipY ? FIELD_VIRTUAL_HEIGHT - fieldY : fieldY;

  // --- END OF THE FIX ---

  // Adjust from center-point to top-left for CSS positioning using the final transformed coordinates.
  const topLeftX = finalX - width / 2;
  const topLeftY = finalY - height / 2;

  const expectedWidth = actualHeight * FIELD_ASPECT_RATIO;
  const containerOffsetX = Math.max((actualWidth - expectedWidth) / 2, 0);

  // Convert the final virtual coordinate to a screen pixel coordinate.
  const scaledX = ((topLeftX / FIELD_VIRTUAL_WIDTH) * imageScale + imageOffsetX) * expectedWidth + containerOffsetX;
  const scaledY = (topLeftY / FIELD_VIRTUAL_HEIGHT) * actualHeight;

  const scaledWidth = (width / FIELD_VIRTUAL_WIDTH) * expectedWidth * imageScale;
  const scaledHeight = (height / FIELD_VIRTUAL_HEIGHT) * actualHeight;

  return { scaledX, scaledY, scaledWidth, scaledHeight };
};

const scaleToFieldCoordinates = (
  x, y, actualWidth, actualHeight, perspective, isBlue
) => {
  const imageScale = imageScaleGlobal;
  const imageOffsetX = imageOffsetXGlobal(isBlue);
  const expectedWidth = actualHeight * FIELD_ASPECT_RATIO;
  const containerOffsetX = Math.max((actualWidth - expectedWidth) / 2, 0);

  // Un-apply pan/zoom to get a virtual percentage.
  const virtualXPercent = ((x - containerOffsetX) / expectedWidth - imageOffsetX) / imageScale;

  let fieldX = Math.round(virtualXPercent * FIELD_VIRTUAL_WIDTH);
  let fieldY = Math.round((y / actualHeight) * FIELD_VIRTUAL_HEIGHT);

  // --- START OF THE FIX ---

  // 1. Determine the final state of the axes using the exact same rules.
  let flipX = false;
  let flipY = false;

  if (isScoringTableFar(perspective)) {
    fieldX = SCREEN_FIELD_VIRTUAL_WIDTH - fieldX;
    flipY = !flipY;
  }
  if (isBlue) {
    flipX = !flipX;
    flipY = !flipY;
  }

  // 2. Un-apply the final transformation state ONCE to get the canonical coordinate.
  if (flipX) {
    fieldX = FIELD_VIRTUAL_WIDTH - fieldX;
  }
  if (flipY) {
    fieldY = FIELD_VIRTUAL_HEIGHT - fieldY;
  }

  // --- END OF THE FIX ---

  return { fieldX, fieldY };
};

// FieldLocalComponent remains unchanged, as its logic is correctly abstracted.
const FieldLocalComponent = ({
  fieldX, fieldY, fieldWidth, fieldHeight, perspective, sx, children, isDefending = false, flip = true
}) => {
  const localRef = useRef(null);
  const [parentSize, setParentSize] = useState({ width: 300, height: 300 });
  const isBlue = new URLSearchParams(window.location.search).get('station')?.startsWith('b');

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
    fieldX, fieldY, fieldWidth, fieldHeight,
    parentSize.width, parentSize.height, perspective, isBlue, isDefending, flip
  );

  return (
    <Box ref={localRef} sx={{ position: "absolute", left: scaledX, top: scaledY, width: scaledWidth, height: scaledHeight, ...sx }}>
      {children}
    </Box>
  );
};


// ===================================================================================
// HOW IT WORKS, PART 2: The Canvas Drawing Effect
// This component now correctly redraws itself when the alliance color changes.
// ===================================================================================
const FieldCanvas = forwardRef(
  ({ children, onClick, height, perspective, strokes, match }, ref) => {
    const initialSize = { width: height * FIELD_ASPECT_RATIO, height: height };
    const [canvasSize, setCanvasSize] = useState(initialSize);
    const [cursorCoordinates, setCursorCoordinates] = useState(null);
    const canvasRef = useRef(null);

    // Line 1: The alliance color is determined on every render.
    const isBlue = new URLSearchParams(window.location.search).get('station')?.startsWith('b');
    const isNear = new URLSearchParams(window.location.search).get('perspective')?.startsWith('n');

    useImperativeHandle(ref, () => ({
      scaleWidthToActual: (virtualWidth) => (virtualWidth * canvasSize.width) / FIELD_VIRTUAL_WIDTH,
      scaleHeightToActual: (virtualHeight) => (virtualHeight * canvasSize.height) / FIELD_VIRTUAL_HEIGHT,
    }));

    useLayoutEffect(() => { setCanvasSize({ width: height * FIELD_ASPECT_RATIO, height: height }); }, [height]);

    // Line 2: The main drawing logic.
    // REPLACE the entire useEffect hook inside your FieldCanvas component with this one.
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const image = new Image();
      image.src = fullField;

      console.log("getting offset", isBlue, match.isDefending());

      const defenseOffset = getDefenseOffset(isBlue, match.isDefending());

      image.onload = () => {
        // 1. CRITICAL: Save the default, unflipped state of the canvas.
        ctx.save();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. The Visual 180° Rotation:
        if (isScoringTableFar(perspective)) {
          // Move the canvas's origin point (0,0) to the bottom-right corner.
          ctx.translate(canvas.width * 0.62, canvas.height);
          // Flip both the X and Y axes.
          ctx.scale(-1, -1);
        }

        // 3. Draw the Image: This call is now "dumb". It draws onto whatever the current
        // context is (flipped or not), making the image appear correctly rotated.
        ctx.drawImage(
          image, //image
          canvas.width * imageOffsetXGlobal(isBlue) + defenseOffset * canvas.width * imageScaleGlobal, //x starting point
          0, //y starting point
          canvas.width * imageScaleGlobal, //width
          canvas.height //height
        );

        // 4. CRITICAL: Restore the canvas to its original, unflipped state.
        // This prevents the flip from affecting other drawings or the next render cycle.
        ctx.restore();

        if (strokes && strokes.length > 0) {
          // Stroke logic would go here.
        }
      };
      // 5. Add `perspective` to the dependency array so this effect re-runs when it changes.
    }, [canvasSize, perspective, strokes, isBlue, match?.isDefending()]);

    const handleMouseInteraction = (event, isClick = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const coords = scaleToFieldCoordinates(x, y, canvas.width, canvas.height, perspective, isBlue);

      if (isClick && onClick != null) {
        onClick(coords.fieldX, coords.fieldY);
      } else {
        setCursorCoordinates({ canvasX: x, canvasY: y, ...coords });
      }
    };

    const keepInside = (coord, boundary, safety) =>
      boundary - coord < safety ? coord - safety : coord;

    return (
      <Box style={{ position: "relative", width: canvasSize.width, height: canvasSize.height, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
          onClick={(e) => handleMouseInteraction(e, true)}
          onMouseMove={(e) => handleMouseInteraction(e)}
          onMouseLeave={() => setCursorCoordinates(null)}
        />
        {children}
        {cursorCoordinates && (
          <Box style={{ position: "absolute", left: keepInside(cursorCoordinates.canvasX + 10, canvasSize.width, 200), top: keepInside(cursorCoordinates.canvasY + 10, canvasSize.height, 30), background: "rgba(0,0,0,0.7)", color: "#fff", padding: "2px 4px", borderRadius: "2px", fontSize: "12px", pointerEvents: "none", whiteSpace: "nowrap" }}>
            FieldX: {Math.round(cursorCoordinates.fieldX)}, FieldY: {Math.round(cursorCoordinates.fieldY)}
          </Box>
        )}
      </Box>
    );
  }
);

export { FieldCanvas, FieldLocalComponent };