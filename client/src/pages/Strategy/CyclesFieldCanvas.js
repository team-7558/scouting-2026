import React, { useState, useLayoutEffect, useEffect, useRef } from "react";
import { FieldCanvas, FieldLocalComponent } from "../FieldCanvas";
import { SCOUTING_CONFIG } from "../ScoutMatch/ScoutingConfig";
import { ImageIcon } from "../ScoutMatch/CustomFieldComponents";
import CoralIcon from "../../assets/scouting-2025/coralIcon.png";
import AlgaeIcon from "../../assets/scouting-2025/algaeIcon.png";
import CrossIcon from "../../assets/scouting-2025/crossIcon.webp";
import CheckIcon from "../../assets/scouting-2025/checkIcon.png";
import {
  FIELD_ASPECT_RATIO,
  FIELD_VIRTUAL_HEIGHT,
  FIELD_VIRTUAL_WIDTH,
} from "../ScoutMatch/Constants";

// Build a positions mapping from the SCOUTING_CONFIG positions.
const buildPositionsMapping = () => {
  const mapping = {};
  Object.keys(SCOUTING_CONFIG).forEach((configKey) => {
    const config = SCOUTING_CONFIG[configKey];
    if (config.positions) {
      Object.keys(config.positions).forEach((posKey) => {
        mapping[posKey] = config.positions[posKey];
      });
    }
  });
  console.log(mapping);
  return mapping;
};

const positionsMapping = buildPositionsMapping();

function getFirstTwoParts(inputString) {
  const parts = inputString.split("_");
  if (parts.length < 2) {
    return inputString;
  }
  return parts.slice(0, 2).join("_");
}

/**
 * CyclesFieldCanvas scales its height dynamically based on the parent container's width.
 * The FieldCanvas is forced to re-mount on canvasHeight change via a dynamic key.
 */
const CyclesFieldCanvas = ({ report, ...props }) => {
  const containerRef = useRef(null);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const isRed = () => report.station.includes("r");
  const updateHeight = () => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      const height = width / FIELD_ASPECT_RATIO;
      setCanvasHeight(height);
    }
  };

  // useLayoutEffect ensures initial measurement happens before painting.
  useLayoutEffect(() => {
    updateHeight();
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  const getPosition = (location) => {
    if (location && location.includes("REEF")) {
      location = getFirstTwoParts(location);
    }
    const position = positionsMapping[location];
    console.log(position);
    return isRed() && position != null
      ? [FIELD_VIRTUAL_WIDTH - position[0], FIELD_VIRTUAL_HEIGHT - position[1]]
      : position;
  };

  /**
   * Converts a cycle into a stroke object.
   */
  const getCycleStroke = (cycle) => {
    let attained = cycle.attained_location;
    let deposit = cycle.deposit_location;
    if (!cycle.end_time) return null;

    if (!Array.isArray(attained)) {
      attained = getPosition(attained);
    }
    if (!Array.isArray(deposit)) {
      deposit = getPosition(deposit);
    }
    if (!attained || !deposit) return null;

    let strokeColor = "#000";
    if (cycle.type === "CORAL") strokeColor = "#1976d2";
    else if (cycle.type === "ALGAE") strokeColor = "#388e3c";

    return {
      points: [
        { fieldX: attained[0], fieldY: attained[1] },
        { fieldX: deposit[0], fieldY: deposit[1] },
      ],
      color: strokeColor,
    };
  };

  /**
   * Renders icons at the attained locations.
   */
  const getCycleIcons = (cycles) => {
    return cycles
      .map((cycle, index) => {
        if (!cycle.end_time) return null;
        let attained = cycle.attained_location;
        if (!Array.isArray(attained)) {
          attained = getPosition(attained);
        }
        if (!attained) return null;

        const iconSrc =
          cycle.type === "CORAL"
            ? CoralIcon
            : cycle.type === "ALGAE"
            ? AlgaeIcon
            : null;
        if (!iconSrc) return null;

        return (
          <FieldLocalComponent
            key={`cycle-icon-${index}`}
            fieldX={attained[0]}
            fieldY={attained[1]}
            fieldWidth={100}
            fieldHeight={100}
            perspective="default"
          >
            {ImageIcon(iconSrc)}
          </FieldLocalComponent>
        );
      })
      .filter(Boolean);
  };

  /**
   * Renders icons at the deposit locations.
   */
  const getDepositIcons = (cycles) => {
    return cycles
      .map((cycle, index) => {
        if (!cycle.end_time) return null;
        let deposit = cycle.deposit_location;
        if (!Array.isArray(deposit)) {
          deposit = getPosition(deposit);
        }
        if (!deposit) return null;

        let depositIcon = null;
        if (cycle.deposit_type === "SCORE") {
          depositIcon = CheckIcon;
        } else if (cycle.deposit_type === "DROP") {
          depositIcon = CrossIcon;
        }
        if (!depositIcon) return null;

        return (
          <FieldLocalComponent
            key={`deposit-icon-${index}`}
            fieldX={deposit[0]}
            fieldY={deposit[1]}
            fieldWidth={100}
            fieldHeight={100}
            perspective="default"
          >
            {ImageIcon(depositIcon)}
          </FieldLocalComponent>
        );
      })
      .filter(Boolean);
  };

  const strokes = report.cycles
    .map(getCycleStroke)
    .filter((stroke) => stroke !== null);
  const attainedIcons = getCycleIcons(report.cycles);
  const depositIcons = getDepositIcons(report.cycles);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <FieldCanvas
        key={canvasHeight} // Force re-mount when canvasHeight changes
        strokes={strokes}
        height={canvasHeight}
        {...props}
      >
        {attainedIcons}
        {depositIcons}
      </FieldCanvas>
    </div>
  );
};

export default CyclesFieldCanvas;
