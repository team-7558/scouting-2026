import React from "react";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import StarIcon from "@mui/icons-material/Star";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SpeedIcon from "@mui/icons-material/Speed";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PushPinIcon from "@mui/icons-material/PushPin";

// Mapping of metric keys to labels and icons
export const averageMetricMapping = {
  movementTime: {
    label: "Leave Time",
    icon: <TrendingUpIcon fontSize="medium" color="action" />,
  },
  movementRate: {
    label: "Leave Rate",
    icon: <TrendingUpIcon fontSize="medium" color="action" />,
  },
  attainedCount: {
    label: "Attained",
    icon: <TrendingUpIcon fontSize="medium" color="action" />,
  },
  scoredCount: {
    label: "Scored",
    icon: <StarIcon fontSize="medium" color="action" />,
  },
  avgScoringCycleTime: {
    label: "Cycle Time",
    icon: <AccessTimeIcon fontSize="medium" color="action" />,
  },
  droppedCount: {
    label: "Dropped",
    icon: <RemoveCircleOutlineIcon fontSize="medium" color="action" />,
  },
  scoringRate: {
    label: "Scoring Rate",
    icon: <SpeedIcon fontSize="medium" color="action" />,
  },
  startTime: {
    label: "Start Time",
    icon: <AccessTimeIcon fontSize="medium" color="action" />,
  },
  cycleTime: {
    label: "Cycle Time",
    icon: <AccessTimeIcon fontSize="medium" color="action" />,
  },
  totalTime: {
    label: "Total Time",
    icon: <AccessTimeIcon fontSize="medium" color="action" />,
  },
  foulCount: {
    label: "Fouls",
    icon: <ReportProblemIcon fontSize="medium" color="action" />,
  },
  pinCount: {
    label: "Pins",
    icon: <PushPinIcon fontSize="medium" color="action" />,
  },
  scoredProcessorCount: {
    label: "Processor",
  },
  scoredNetCount: {
    label: "Net",
  },
};

// Category coloring – these colors will be used for group headers
export const groupColors = {
  coral: "#7e57c2",
  algae: "#388e3c",
  movement: "#c7cf00",
  hang: "#1976d2",
  defense: "#d32f2f",
  contact: "#f57c00",
};
