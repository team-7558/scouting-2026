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
  // Returns the offset as a percentage (e.g., 0.38 for 38%)
  return isBlue ? 0.38 : -0.38;
}

const getDefenseButtonOffset = (isBlue, isDefending, matchPhase) => {
  if (!isDefending || matchPhase===PHASES.POST_MATCH) return 0;
  return isBlue ? -0.14 : 0.14;
}

// ===================================================================================
// HOW IT WORKS, PART 1: The Coordinate Scaling Functions
// These two functions are the "single source of truth" for all coordinate math.
// ===================================================================================

const SCREEN_FIELD_VIRTUAL_WIDTH = FIELD_VIRTUAL_WIDTH * 0.62;
const imageScaleGlobal = 1;
// This is the static offset to show the correct half of the field for the blue alliance.
const imageOffsetXGlobal = (isBlue) => isBlue ? -0.382 : 0;

const scaleCoordinates = (
  fieldX, fieldY, width, height, actualWidth, actualHeight, perspective, isBlue, isDefending, flip
) => {
  if (!flip) {
    const topLeftX = fieldX - width / 2;
    const topLeftY = fieldY - height / 2;
    const scaledX = (topLeftX / FIELD_VIRTUAL_WIDTH) * actualWidth;
    const scaledY = (topLeftY / FIELD_VIRTUAL_HEIGHT) * actualHeight;
    const scaledWidth = (width / FIELD_VIRTUAL_WIDTH) * actualWidth;
    const scaledHeight = (height / FIELD_VIRTUAL_HEIGHT) * actualHeight;
    return { scaledX, scaledY, scaledWidth, scaledHeight };
  }

  // --- START OF THE FIX ---

  // Determine the final state of the coordinate system based on perspective and alliance.
  let flipX = false;
  let flipY = false;

  // if (isScoringTableFar(perspective)) {
  //   fieldX = SCREEN_FIELD_VIRTUAL_WIDTH - fieldX;
  //   flipY = !flipY;
  // }
  if (isBlue) {
    flipX = !flipX;
    // flipY = !flipY;
  }

  // Apply the final flip state ONCE to the canonical coordinates.
  // The complex defense offset logic has been removed from here.
  const finalX = flipX ? FIELD_VIRTUAL_WIDTH - fieldX : fieldX;
  const finalY = flipY ? FIELD_VIRTUAL_HEIGHT - fieldY : fieldY;

  // Adjust from center-point to top-left for CSS positioning.
  const topLeftX = finalX - width / 2;
  const topLeftY = finalY - height / 2;

  const expectedWidth = actualHeight * FIELD_ASPECT_RATIO;
  const containerOffsetX = Math.max((actualWidth - expectedWidth) / 2, 0);

  // Combine the static alliance offset with the dynamic defense offset.
  // This now perfectly mirrors the logic used by the canvas `drawImage` call.
  const baseImageOffsetX = imageOffsetXGlobal(isBlue);
  const dynamicDefenseOffset = getDefenseOffset(isBlue, isDefending);
  const totalImageOffsetX = baseImageOffsetX + dynamicDefenseOffset;

  // Use the combined total offset in the final scaling calculation.
  const scaledX = ((topLeftX / FIELD_VIRTUAL_WIDTH) * imageScaleGlobal + totalImageOffsetX) * expectedWidth + containerOffsetX;
  const scaledY = (topLeftY / FIELD_VIRTUAL_HEIGHT) * actualHeight;

  // --- END OF THE FIX ---

  const scaledWidth = (width / FIELD_VIRTUAL_WIDTH) * expectedWidth * imageScaleGlobal;
  const scaledHeight = (height / FIELD_VIRTUAL_HEIGHT) * actualHeight;

  return { scaledX, scaledY, scaledWidth, scaledHeight };
};

const scaleToFieldCoordinates = (
  x, y, actualWidth, actualHeight, perspective, isBlue, isDefending = false, phase
) => {
  const imageScale = imageScaleGlobal;
  const expectedWidth = actualHeight * FIELD_ASPECT_RATIO;
  const containerOffsetX = Math.max((actualWidth - expectedWidth) / 2, 0);

  // --- START OF THE FIX ---
  // We must account for the total offset when reversing the coordinates.

  // 1. Calculate the total offset, just like in scaleCoordinates.
  const baseImageOffsetX = imageOffsetXGlobal(isBlue);
  const dynamicDefenseOffset = getDefenseOffset(isBlue, isDefending);
  const totalImageOffsetX = baseImageOffsetX + dynamicDefenseOffset;

  // 2. Remove the container offset and scale to get a percentage of the field image.
  const virtualXPercentWithOffset = (x - containerOffsetX) / expectedWidth;
  // 3. Remove the total image offset to get the true canonical percentage.
  const virtualXPercent = (virtualXPercentWithOffset - totalImageOffsetX) / imageScale;

  let fieldX = Math.round(virtualXPercent * FIELD_VIRTUAL_WIDTH);
  let fieldY = Math.round((y / actualHeight) * FIELD_VIRTUAL_HEIGHT);

  // --- END OF THE FIX ---

  // The rest of this logic correctly un-applies the flips.
  let flipX = false;
  let flipY = false;

  // if (isScoringTableFar(perspective)) {
  //   fieldX = SCREEN_FIELD_VIRTUAL_WIDTH - fieldX;
  //   flipY = !flipY;
  // }
  if (isBlue) {
    flipX = !flipX;
    // flipY = !flipY;
  }

  if (flipX) {
    fieldX = FIELD_VIRTUAL_WIDTH - fieldX;
  }
  if (flipY) {
    fieldY = FIELD_VIRTUAL_HEIGHT - fieldY;
  }

  return { fieldX, fieldY };
};

// FieldLocalComponent remains unchanged, as its logic is correctly abstracted.
const FieldLocalComponent = ({
  fieldX, fieldY, fieldWidth, fieldHeight, perspective, sx, children, isDefending = false, flip = true, phase
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

  let { scaledX, scaledY, scaledWidth, scaledHeight } = scaleCoordinates(
    fieldX, fieldY, fieldWidth, fieldHeight,
    parentSize.width, parentSize.height, perspective, isBlue, isDefending, flip
  );

  scaledX += getDefenseButtonOffset(isBlue, isDefending, phase) * fieldWidth;

  return (
    <Box ref={localRef} sx={{ position: "absolute", left: scaledX, top: scaledY, width: scaledWidth, height: scaledHeight, ...sx }}>
      {children}
    </Box>
  );
};


// ===================================================================================
// HOW IT WORKS, PART 2: The Canvas Drawing Effect
// ===================================================================================
const FieldCanvas = forwardRef(
  ({ children, onClick, height, perspective, strokes, match }, ref) => {
    const initialSize = { width: height * FIELD_ASPECT_RATIO, height: height };
    const [canvasSize, setCanvasSize] = useState(initialSize);
    const [cursorCoordinates, setCursorCoordinates] = useState(null);
    const canvasRef = useRef(null);

    const isBlue = new URLSearchParams(window.location.search).get('station')?.startsWith('b');
    const isNear = new URLSearchParams(window.location.search).get('perspective')?.startsWith('n');

    useImperativeHandle(ref, () => ({
      scaleWidthToActual: (virtualWidth) => (virtualWidth * canvasSize.width) / FIELD_VIRTUAL_WIDTH,
      scaleHeightToActual: (virtualHeight) => (virtualHeight * canvasSize.height) / FIELD_VIRTUAL_HEIGHT,
    }));

    useLayoutEffect(() => { setCanvasSize({ width: height * FIELD_ASPECT_RATIO, height: height }); }, [height]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const image = new Image();
      image.src = fullField;

      // This logic is the "ground truth" we are matching.
      const defenseOffset = getDefenseOffset(isBlue, match?.isDefending());
      const totalImageOffsetX = imageOffsetXGlobal(isBlue) + defenseOffset;

      image.onload = () => {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (isScoringTableFar(perspective)) {
          ctx.translate(canvas.width * 0.62, canvas.height);
          ctx.scale(-1, -1);
        }

        ctx.drawImage(
          image,
          canvas.width * totalImageOffsetX, // Use the combined offset
          0,
          canvas.width * imageScaleGlobal,
          canvas.height
        );

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(canvas.width * totalImageOffsetX, 0, canvas.width * imageScaleGlobal, canvas.height);

        ctx.restore();

        if (strokes && strokes.length > 0) {
          // Stroke logic would go here.
        }
      };
    }, [canvasSize, perspective, strokes, isBlue, match?.isDefending()]);

    const handleMouseInteraction = (event, isClick = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Pass the defense state so coordinates can be calculated correctly.
      const coords = scaleToFieldCoordinates(x, y, canvas.width, canvas.height, perspective, isBlue, match?.isDefending());

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