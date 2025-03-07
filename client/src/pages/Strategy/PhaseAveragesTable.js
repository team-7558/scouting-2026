import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { groupColors, averageMetricMapping } from "./AveragesConfig";

// Helper functions (as used in AveragesSummary)
const formatValue = (colKey, value) => {
  if (typeof value !== "number") return value;
  let num = value;
  const [, field] = colKey.split(".");
  if (field.toLowerCase().includes("time")) {
    num = num / 1000;
    return num.toFixed(2) + "s";
  }
  if (field.toLowerCase().includes("rate")) {
    num = num * 100;
    return num.toFixed(2) + "%";
  }
  return num.toFixed(2);
};

const getFormattedValue = (group, field, value) => {
  const v = Array.isArray(value) ? value[1] : value;
  return formatValue(`${group}.${field}`, v);
};

// PhaseAveragesTable Component
// Props:
// - averages: the averages map (robotId -> { auto, tele, ... })
// - phase: string ("auto" or "tele")
// - eventKey: string (used for navigation when clicking a row)
// - metricFilter (optional): function (group, metricKey) => boolean to filter metric columns.
const PhaseAveragesTable = ({ averages, phase, eventKey, metricFilter }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Build union of groups and their metric keys for the given phase.
  // groupMetrics: { group: Set(metricKey) }
  const groupMetrics = {};
  Object.keys(averages).forEach((robotId) => {
    const robotPhaseData = averages[robotId] && averages[robotId][phase];
    if (robotPhaseData) {
      Object.keys(robotPhaseData).forEach((group) => {
        if (!groupMetrics[group]) groupMetrics[group] = new Set();
        const metrics = robotPhaseData[group];
        Object.keys(metrics).forEach((metric) => {
          if (metricFilter) {
            if (metricFilter(group, metric)) {
              groupMetrics[group].add(metric);
            }
          } else {
            groupMetrics[group].add(metric);
          }
        });
      });
    }
  });

  // Respect the order of groups as defined in groupColors.
  const groupsFromData = Object.keys(groupMetrics);
  const groupOrder = Object.keys(groupColors);
  const sortedGroups = groupOrder
    .filter((g) => groupsFromData.includes(g))
    .concat(groupsFromData.filter((g) => !groupOrder.includes(g)).sort());

  // For each group, sort the metric keys and convert to an array.
  const groupMetricKeys = {};
  sortedGroups.forEach((group) => {
    groupMetricKeys[group] = Array.from(groupMetrics[group]).sort();
  });

  // Build table header:
  // First header row: fixed "Robot" cell (rowSpan=2) then each category header cell with colSpan equal to the number of metrics.
  // Second header row: for each group, list each metric using labels from averageMetricMapping.
  const headerFirstRow = (
    <TableRow>
      <TableCell rowSpan={2}>Robot</TableCell>
      {sortedGroups.map((group) => (
        <TableCell
          key={group}
          align="center"
          colSpan={groupMetricKeys[group].length}
          sx={{
            bgcolor: groupColors[group] || "grey.300",
            color: theme.palette.getContrastText(
              groupColors[group] || "grey.300"
            ),
            fontWeight: "bold",
          }}
        >
          {group.toUpperCase()}
        </TableCell>
      ))}
    </TableRow>
  );

  const headerSecondRow = (
    <TableRow>
      {sortedGroups.map((group) =>
        groupMetricKeys[group].map((metric) => (
          <TableCell key={`${group}.${metric}`} align="center">
            {averageMetricMapping[metric]
              ? averageMetricMapping[metric].label
              : metric}
          </TableCell>
        ))
      )}
    </TableRow>
  );

  // Build data rows: each row corresponds to a robot that has data for the given phase.
  // Make the entire row clickable to navigate to robot details.
  const rows = [];
  Object.keys(averages).forEach((robotId) => {
    const robotPhaseData = averages[robotId] && averages[robotId][phase];
    if (robotPhaseData) {
      const row = { robot: robotId };
      sortedGroups.forEach((group) => {
        const metrics = groupMetricKeys[group];
        metrics.forEach((metric) => {
          const groupData = robotPhaseData[group] || {};
          row[`${group}.${metric}`] =
            groupData[metric] !== undefined
              ? getFormattedValue(group, metric, groupData[metric])
              : "-";
        });
      });
      rows.push(row);
    }
  });

  // Build dynamic column list: each column id is `${group}.${metric}`.
  const columns = [];
  sortedGroups.forEach((group) => {
    groupMetricKeys[group].forEach((metric) => {
      columns.push({ id: `${group}.${metric}`, group, metric });
    });
  });

  return (
    <TableContainer component={Paper} sx={{ mb: 4 }}>
      <Table size="small">
        <TableHead>
          {headerFirstRow}
          {headerSecondRow}
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={`${row.robot}-${index}`}
              hover
              sx={{ cursor: "pointer" }}
              onClick={() =>
                navigate(`/robots?eventKey=${eventKey}&robot=${row.robot}`)
              }
            >
              <TableCell>{row.robot}</TableCell>
              {columns.map((col) => (
                <TableCell key={col.id} align="center">
                  {row[col.id] !== undefined ? row[col.id] : "-"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PhaseAveragesTable;
