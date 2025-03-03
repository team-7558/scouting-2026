import React from "react";
import { FieldCanvas, FieldLocalComponent } from "../FieldCanvas";
import { SCOUTING_CONFIG } from "../ScoutMatch/ScoutingConfig";
import { ImageIcon } from "../ScoutMatch/CustomFieldComponents";
import CoralIcon from "../../assets/scouting-2025/coralIcon.png";
import AlgaeIcon from "../../assets/scouting-2025/algaeIcon.png";

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

const getPosition = (location) => {
  if (location && location.includes("REEF")) {
    location = getFirstTwoParts(location);
  }
  return positionsMapping[location];
};

/**
 * Converts a cycle into a stroke object.
 * Each stroke has a "points" array (with virtual field coordinates)
 * and a "color" based on the cycle type.
 */
const getCycleStroke = (cycle) => {
  // Determine attained and deposit coordinates.
  let attained = cycle.attained_location;
  let deposit = cycle.deposit_location;
  // Only draw completed cycles.
  if (!cycle.end_time) {
    return null;
  }

  console.log("getting stroke for", attained, deposit);
  if (!Array.isArray(attained)) {
    attained = getPosition(attained);
  }
  if (!Array.isArray(deposit)) {
    deposit = getPosition(deposit);
  }
  console.log(attained, deposit);
  // If we don't have both coordinates, skip drawing this cycle.
  if (!attained || !deposit) return null;

  // Define stroke color based on cycle type.
  let strokeColor = "#000";
  if (cycle.type === "CORAL") strokeColor = "#d32f2f";
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
 * Generates icon components for each completed cycle.
 * Icons are rendered at the attained location of the cycle.
 */
const getCycleIcons = (cycles) => {
  return cycles
    .map((cycle, index) => {
      if (!cycle.end_time) return null; // only process completed cycles
      let attained = cycle.attained_location;
      if (!Array.isArray(attained)) {
        attained = getPosition(attained);
      }
      if (!attained) return null;

      // Choose the icon based on cycle type.
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
          fieldWidth={100} // adjust width as needed
          fieldHeight={100} // adjust height as needed
          perspective="default"
        >
          {ImageIcon(iconSrc)}
        </FieldLocalComponent>
      );
    })
    .filter(Boolean);
};

/**
 * CyclesFieldCanvas takes in a report (with a cycles array) and draws strokes on the field.
 * It uses FieldCanvas (which already supports a strokes prop) to render the field.
 * In addition, it adds dynamic icons at the attained locations using custom field components.
 */
const CyclesFieldCanvas = ({ report, ...props }) => {
  console.log("cycles field canvas", report);
  const strokes = report.cycles
    .map(getCycleStroke)
    .filter((stroke) => stroke !== null);
  const icons = getCycleIcons(report.cycles);

  return (
    <FieldCanvas strokes={strokes} {...props}>
      {icons}
    </FieldCanvas>
  );
};

export default CyclesFieldCanvas;
