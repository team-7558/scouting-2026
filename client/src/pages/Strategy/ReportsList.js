import React, { useState, useRef } from "react";

import PhaseAveragesTable from "./PhaseAveragesTable";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Grid,
  IconButton,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SpeedIcon from "@mui/icons-material/Speed";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PushPinIcon from "@mui/icons-material/PushPin";
import { Link, useSearchParams } from "react-router-dom";
import CyclesFieldCanvas from "./CyclesFieldCanvas"; // Your CyclesFieldCanvas component
import ScoreBarChart from "./ScoreBarChart"; // Reusable chart component

// ------------------- Shared Constants and Helpers -------------------

const groupColors = {
  movement: "#c7cf00",
  coral: "#7e57c2",
  algae: "#388e3c",
  hang: "#1976d2",
  defense: "#d32f2f",
  contact: "#f57c00",
};

const getStationColor = (station) => {
  if (!station) return "default";
  const s = station.toLowerCase();
  if (s.startsWith("r")) return "#d32f2f";
  if (s.startsWith("b")) return "#1976d2";
  return "default";
};

const flattenData = (obj) => {
  const flat = {};
  Object.keys(obj).forEach((group) => {
    const fields = obj[group];
    Object.keys(fields).forEach((field) => {
      flat[`${group}.${field}`] = Array.isArray(fields[field])
        ? fields[field][1]
        : fields[field];
    });
  });
  return flat;
};

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

const averageMetricMapping = {
  movementTime: {
    label: "Leave time",
    icon: <TrendingUpIcon fontSize="medium" color="action" />,
  },
  movementRate: {
    label: "Leave rate",
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
};

// ------------------- Helper: Render a Metric Chip -------------------
const renderMetricChip = (group, field, groupData, theme) => {
  const mapping = averageMetricMapping[field] || { label: field };
  const value =
    groupData[field] != null
      ? getFormattedValue(group, field, groupData[field])
      : "-";
  const lower = field.toLowerCase();
  let chipColor = theme.palette.primary.main;

  // Specific colors for "attained" and "scored"
  if (field === "attainedCount") {
    chipColor = theme.palette.warning.main;
  } else if (field === "scoredCount") {
    chipColor = theme.palette.secondary.main;
  }
  // Distinct colors for times and rates
  else if (lower.includes("time")) {
    chipColor = theme.palette.info.main;
  } else if (lower.includes("rate")) {
    chipColor = theme.palette.success.main;
  }

  return (
    <Chip
      key={`${group}.${field}`}
      size="small"
      label={`${mapping.label}: ${value}`}
      sx={{
        backgroundColor: chipColor,
        color: theme.palette.getContrastText(chipColor),
        fontWeight: "bold",
      }}
    />
  );
};

// ------------------- AveragesSummary Component -------------------
// The phase header is static (e.g., "Auto" or "Tele"). Each category is collapsible.
// When collapsed, the top three metrics are shown as colored chips.
// For "coral" and "algae", chips corresponding to the chartKeys are hidden.
const AveragesSummary = ({ phase, averages, showEverything = false }) => {
  const theme = useTheme();
  const [expandedGroups, setExpandedGroups] = useState({});
  // Only show these fields when not showing everything (and these fields do not include chartKeys)
  const visibleFieldsForCA = [
    "attainedCount",
    "scoredCount",
    "avgScoringCycleTime",
  ];
  const chartKeys = {
    coral: ["L1", "L2", "L3", "L4"],
    algae: [
      "scoredProcessorCount",
      "scoredNetCount",
      "scoredOpponentProcessorCount",
    ],
  };

  // Phase header: "Auto" or "Tele"
  const phaseHeader =
    phase === "auto" ? "AUTO" : phase === "tele" ? "TELE" : phase.toUpperCase();

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {phaseHeader}
      </Typography>
      {Object.keys(averages).map((group) => {
        const groupData = averages[group];
        let fieldsToDisplay;
        if ((group === "coral" || group === "algae") && !showEverything) {
          // When not showing everything for coral/algae, use a preset list.
          fieldsToDisplay = visibleFieldsForCA;
        } else {
          // Otherwise, use all keys, but filter out any that are rendered by the chart.
          fieldsToDisplay = Object.keys(groupData);
          if (group === "coral" || group === "algae") {
            const keysToHide = chartKeys[group] || [];
            fieldsToDisplay = fieldsToDisplay.filter(
              (key) => !keysToHide.includes(key)
            );
          }
        }
        // When collapsed, show top 3 metrics.
        const metricsToShow = expandedGroups[group]
          ? fieldsToDisplay
          : fieldsToDisplay.slice(0, 3);
        // Always show expand option for coral and algae, or if there are more than 3 metrics.
        const showExpandOption =
          group === "coral" || group === "algae" || fieldsToDisplay.length > 3;

        return (
          <Paper
            key={group}
            variant="outlined"
            sx={(theme) => ({
              p: 2,
              mb: 1,
              borderLeft: `6px solid ${
                groupColors[group] || theme.palette.text.primary
              }`,
              backgroundColor: theme.palette.background.paper,
            })}
          >
            {/* Category header with inline chips when collapsed */}
            <Box
              onClick={() =>
                setExpandedGroups((prev) => ({
                  ...prev,
                  [group]: !prev[group],
                }))
              }
              sx={{
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ color: groupColors[group] }}
              >
                {group.toUpperCase()}
              </Typography>
              {!expandedGroups[group] && (
                <Box
                  sx={(theme) => ({
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: { xs: "center", sm: "flex-start" },
                  })}
                >
                  {metricsToShow.map((field) =>
                    renderMetricChip(group, field, groupData, theme)
                  )}
                  {showExpandOption && (
                    <Typography
                      variant="subtitle2"
                      sx={(theme) => ({ color: theme.palette.text.secondary })}
                    >
                      ▼
                    </Typography>
                  )}
                </Box>
              )}
              {expandedGroups[group] && (
                <Typography
                  variant="subtitle2"
                  sx={(theme) => ({ color: theme.palette.text.secondary })}
                >
                  ▲
                </Typography>
              )}
            </Box>
            {/* Animated full content when expanded */}
            <Collapse in={!!expandedGroups[group]} timeout="auto" unmountOnExit>
              <Box
                sx={(theme) => ({
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  mb: 1,
                  justifyContent: { xs: "center", sm: "flex-start" },
                })}
              >
                {fieldsToDisplay.map((field) =>
                  renderMetricChip(group, field, groupData, theme)
                )}
              </Box>
              {showExpandOption && (
                <Button
                  onClick={() =>
                    setExpandedGroups((prev) => ({
                      ...prev,
                      [group]: false,
                    }))
                  }
                  sx={{ mt: 1 }}
                >
                  Show less
                </Button>
              )}
              {/* Show chart for coral/algae when expanded */}
              {expandedGroups[group] &&
                group === "coral" &&
                groupData.L1 != null && (
                  <Box sx={{ mt: 2, width: "100%" }}>
                    <Typography
                      variant="subtitle2"
                      sx={(theme) => ({
                        mb: 1,
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      })}
                    >
                      Coral Levels
                    </Typography>
                    <Box sx={{ width: "100%" }}>
                      <ScoreBarChart
                        scoreData={groupData}
                        chartKeys={chartKeys[group]}
                      />
                    </Box>
                  </Box>
                )}
              {expandedGroups[group] &&
                group === "algae" &&
                groupData.scoredProcessorCount != null && (
                  <Box sx={{ mt: 2, width: "100%" }}>
                    <Typography
                      variant="subtitle2"
                      sx={(theme) => ({
                        mb: 1,
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      })}
                    >
                      Algae Scored Breakdown
                    </Typography>
                    <Box sx={{ width: "100%" }}>
                      <ScoreBarChart
                        scoreData={groupData}
                        chartKeys={[
                          "scoredProcessorCount",
                          "scoredNetCount",
                          "scoredOpponentProcessorCount",
                        ]}
                      />
                    </Box>
                  </Box>
                )}
            </Collapse>
            {/* If collapsed and there are more than 3 metrics, show a "Show more" button */}
            {!expandedGroups[group] && showExpandOption && (
              <Button
                onClick={() =>
                  setExpandedGroups((prev) => ({
                    ...prev,
                    [group]: true,
                  }))
                }
                sx={{ mt: 1 }}
              >
                Show more
              </Button>
            )}
          </Paper>
        );
      })}
    </Box>
  );
};
// Helper functions for sorting
const descendingComparator = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
};

const getComparator = (order, orderBy) =>
  order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);

const stableSort = (array, comparator) => {
  const stabilized = array.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
};

// This component renders a table for a single category group.
const CategoryTable = ({ group, rows, metricKeys }) => {
  const theme = useTheme();
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("robot");

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Fixed header cells: Robot and Phase; then the dynamic ones from metricKeys.
  const headCells = [
    { id: "robot", label: "Robot" },
    { id: "phase", label: "Phase" },
    ...metricKeys.map((key) => ({ id: key, label: key })),
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Category header styled with the group color */}
      <Typography
        variant="h6"
        sx={{
          bgcolor: theme.palette[group] ? theme.palette[group].main : "#333",
          color: theme.palette.getContrastText(
            theme.palette[group] ? theme.palette[group].main : "#333"
          ),
          p: 1,
          borderRadius: 1,
          mb: 1,
        }}
      >
        {group.toUpperCase()}
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  sortDirection={orderBy === headCell.id ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : "asc"}
                    onClick={(event) => handleRequestSort(event, headCell.id)}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {stableSort(rows, getComparator(order, orderBy)).map(
              (row, index) => (
                <TableRow key={`${row.robot}-${row.phase}-${index}`}>
                  <TableCell>{row.robot}</TableCell>
                  <TableCell>{row.phase}</TableCell>
                  {metricKeys.map((key) => (
                    <TableCell key={key}>
                      {row[key] !== undefined
                        ? typeof row[key] === "object"
                          ? JSON.stringify(row[key])
                          : row[key]
                        : "-"}
                    </TableCell>
                  ))}
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// ------------------- AveragesTable Component -------------------
// This component groups the averages data (nested by robot and phase) by category (group)
// and renders one table per group. An optional metricFilter prop (function: (group, metricKey) => boolean)
// can be provided to limit which metrics are displayed.
const AveragesTable = ({ averages, metricFilter }) => {
  // categoryRows will map a category (group) to an array of rows.
  // Each row: { robot, phase, ...metrics } where metrics are from that group.
  const categoryRows = {};

  // Iterate over each robot and each phase ("auto", "tele", etc.)
  Object.keys(averages).forEach((robotId) => {
    const robotAverages = averages[robotId] || {};
    Object.keys(robotAverages).forEach((phase) => {
      const phaseData = robotAverages[phase] || {};
      // phaseData is an object keyed by category (e.g., "movement", "coral", etc.)
      Object.keys(phaseData).forEach((group) => {
        // Initialize the group array if needed.
        if (!categoryRows[group]) {
          categoryRows[group] = [];
        }
        // Create a row: add robot, phase (uppercase) and spread the metrics from this group.
        categoryRows[group].push({
          robot: robotId,
          phase: phase.toUpperCase(),
          ...phaseData[group],
        });
      });
    });
  });

  // Now, for each category, compute the dynamic headers (union of metric keys)
  const tables = Object.keys(categoryRows).map((group) => {
    const rows = categoryRows[group];

    // Build a set of metric keys across all rows in this group.
    const metricKeysSet = new Set();
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== "robot" && key !== "phase") {
          // If a filter is provided, only add keys that pass.
          if (typeof metricFilter === "function") {
            if (metricFilter(group, key)) {
              metricKeysSet.add(key);
            }
          } else {
            metricKeysSet.add(key);
          }
        }
      });
    });
    const dynamicHeaders = Array.from(metricKeysSet).sort();

    return (
      <CategoryTable
        key={group}
        group={group}
        rows={rows}
        metricKeys={dynamicHeaders}
      />
    );
  });

  return <>{tables}</>;
};

// ------------------- ReportCard Component -------------------
const ReportCard = ({ report, isMatchQuery, eventKey }) => {
  const flatData = flattenData(report.totals);
  flatData["matchKey"] = report.match_key;
  flatData["robot"] = report.robot;

  const groupedData = {};
  Object.keys(flatData).forEach((key) => {
    if (key === "matchKey" || key === "robot") return;
    const [group, metric] = key.split(".");
    if (!groupedData[group]) groupedData[group] = {};
    groupedData[group][metric] = flatData[key];
  });

  const stationColor = getStationColor(report.station);

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 2,
        mb: 2,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[2],
      })}
    >
      <Typography variant="caption" sx={{ display: "block", mb: 2 }}>
        {`Scouted by ${report.scout_name} at ${new Intl.DateTimeFormat(
          undefined,
          {
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "2-digit",
          }
        ).format(
          new Date(parseInt(report.match_start_time))
        )} , submitted at ${new Intl.DateTimeFormat(undefined, {
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "2-digit",
        }).format(new Date(parseInt(report.submission_time)))}`}
      </Typography>
      <Box
        component={Link}
        to={
          isMatchQuery
            ? `/robots?eventKey=${encodeURIComponent(
                eventKey
              )}&&robot=${encodeURIComponent(report.robot)}`
            : `/matches?eventKey=${encodeURIComponent(
                eventKey
              )}&&matchKey=${encodeURIComponent(report.match_key)}`
        }
        sx={(theme) => ({
          p: 1,
          mb: 2,
          backgroundColor: stationColor,
          borderRadius: theme.shape.borderRadius,
          textAlign: "center",
          textDecoration: "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        })}
      >
        <Typography
          variant="button"
          sx={(theme) => ({
            textTransform: "none",
            color: theme.palette.common.white,
            fontWeight: 700,
            fontSize: "1.2rem",
          })}
        >
          {`${report.robot} : ${report.match_key} data`}
        </Typography>
        <ArrowForwardIosIcon
          fontSize="small"
          sx={(theme) => ({ ml: 1, color: theme.palette.common.white })}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Cycles
        </Typography>
        <CyclesFieldCanvas report={report} />
      </Box>
      {["auto", "tele"].map(
        (phase) =>
          report.totals[phase] && (
            <AveragesSummary
              key={phase}
              phase={phase}
              averages={report.totals[phase]}
              showEverything={true}
            />
          )
      )}
      {report.comments}
    </Paper>
  );
};

// ------------------- ReportCarousel Component -------------------
const ReportCarousel = ({ reports, eventKey, isMatchQuery }) => {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);
  const touchStartX = useRef(null);

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + reports.length) % reports.length);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % reports.length);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setDragOffset(0);
  };

  const onTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - touchStartX.current;
    setDragOffset(delta);
  };

  const onTouchEnd = () => {
    const threshold = 50;
    if (dragOffset < -threshold) {
      handleNext();
    } else if (dragOffset > threshold) {
      handlePrev();
    }
    setDragOffset(0);
    touchStartX.current = null;
  };

  const renderNavBar = () => {
    const navTitle = isMatchQuery ? "Robots" : "Matches";
    return (
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{ mb: 1, textAlign: { xs: "center", sm: "left" } }}
        >
          {navTitle}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
          {reports.map((report, i) => {
            const header = `${report.robot} @ ${report.match_key}`;
            const stationColor = getStationColor(report.station);
            return (
              <Chip
                key={report.id}
                label={header}
                onClick={() => setIndex(i)}
                sx={(theme) => ({
                  backgroundColor: stationColor,
                  flexShrink: 0,
                  borderRadius: theme.shape.borderRadius,
                  color: theme.palette.common.white,
                  "&:hover": { opacity: 0.85 },
                })}
              />
            );
          })}
        </Box>
      </Box>
    );
  };

  if (reports.length === 0) return null;

  const cardWidthPercent = 90;
  const gapPercent = 10;
  const baseTranslate = -index * (cardWidthPercent + gapPercent);
  const dragTranslate = (dragOffset / window.innerWidth) * 100;
  const totalTranslate = baseTranslate + dragTranslate;

  return (
    <Box
      ref={containerRef}
      sx={{ position: "relative", overflow: "hidden" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {renderNavBar()}
      <Box
        sx={{
          display: "flex",
          transition: dragOffset === 0 ? "transform 0.3s ease-out" : "none",
          transform: `translateX(${totalTranslate}%)`,
        }}
      >
        {reports.map((report) => (
          <Box
            key={report.match_key}
            sx={{ width: 0, flex: "0 0 90%", mx: "5%" }}
          >
            <ReportCard
              report={report}
              eventKey={eventKey}
              isMatchQuery={isMatchQuery}
            />
          </Box>
        ))}
      </Box>
      <IconButton
        onClick={handlePrev}
        sx={(theme) => ({
          position: "absolute",
          top: "50%",
          left: 0,
          transform: "translateY(-50%)",
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          "&:hover": {
            backgroundColor: alpha(theme.palette.background.paper, 1),
          },
        })}
      >
        <ArrowBackIosIcon />
      </IconButton>
      <IconButton
        onClick={handleNext}
        sx={(theme) => ({
          position: "absolute",
          top: "50%",
          right: 0,
          transform: "translateY(-50%)",
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          "&:hover": {
            backgroundColor: alpha(theme.palette.background.paper, 1),
          },
        })}
      >
        <ArrowForwardIosIcon />
      </IconButton>
    </Box>
  );
};

const ReportsList = ({ data }) => {
  const { averages, reports } = data;
  const [searchParams] = useSearchParams();
  const eventKey = searchParams.get("eventKey") || "";
  const isMatchQuery = Boolean(searchParams.get("matchKey"));

  const metricFilter = (group, metric) => {
    const allowedMetrics = {
      movement: ["movementTime", "movementRate"],
      algae: [
        "attainedCount",
        "scoredProcessorCount",
        "scoredNetCount",
        "scoringRate",
      ],
      coral: ["attainedCount", "scoredCount", "scoringRate"],
      hang: ["cycleTime"],
      defense: ["totalTime"],
      contact: ["totalTime", "pinCount", "foulCount"],
    };

    return allowedMetrics[group]
      ? allowedMetrics[group].includes(metric)
      : false;
  };
  return (
    <Box sx={{ p: 2 }}>
      {averages != null && (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>
            AUTO Averages
          </Typography>
          <PhaseAveragesTable
            averages={averages}
            phase="auto"
            eventKey={eventKey}
            metricFilter={metricFilter}
          />
          <Typography variant="h6" sx={{ mb: 1, mt: 4 }}>
            TELE Averages
          </Typography>
          <PhaseAveragesTable
            averages={averages}
            phase="tele"
            eventKey={eventKey}
            metricFilter={metricFilter}
          />
        </>
      )}
      {reports && reports.length > 0 && (
        <ReportCarousel
          reports={reports}
          eventKey={eventKey}
          isMatchQuery={isMatchQuery}
        />
      )}
    </Box>
  );
};

export default ReportsList;
