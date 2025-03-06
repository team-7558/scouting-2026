import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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

// ------------------- New MetricRow Component -------------------
// Each metric row now shows a left-aligned label (with an icon) and a right-aligned value.
const MetricRow = ({ icon, label, value }) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    p={1}
    mb={1}
    sx={(theme) => ({
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[1],
    })}
  >
    <Box display="flex" alignItems="center">
      {icon && <Box mr={0.5}>{icon}</Box>}
      <Typography
        variant="body1"
        sx={{
          fontWeight: "bold",
          color: (theme) => theme.palette.text.primary,
        }}
      >
        {label}
      </Typography>
    </Box>
    <Typography
      variant="body1"
      sx={{ color: (theme) => theme.palette.text.secondary }}
    >
      {value}
    </Typography>
  </Box>
);

// ------------------- AveragesSummary Component -------------------
// Renders metrics by group with the new MetricRow. Also displays custom charts for coral and algae.
const AveragesSummary = ({ phase, averages, showEverything = false }) => {
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
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h7" gutterBottom>
        {phase && phase.toUpperCase()}
      </Typography>
      {Object.keys(averages).map((group) => {
        const groupData = averages[group];
        const fieldsToDisplay =
          (group === "coral" || group === "algae") && !showEverything
            ? visibleFieldsForCA
            : Object.keys(groupData);
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
            <Typography
              variant="subtitle1"
              sx={(theme) => ({
                color: groupColors[group] || theme.palette.text.primary,
                mb: 1,
              })}
            >
              {group.toUpperCase()}
            </Typography>
            <Grid container spacing={1}>
              {fieldsToDisplay.map((field) => {
                if (chartKeys[group] && chartKeys[group].includes(field)) {
                  return null;
                }
                const mapping = averageMetricMapping[field] || {
                  label: field,
                  icon: null,
                };
                return (
                  <Grid item xs={12} key={`${group}.${field}`}>
                    <MetricRow
                      icon={mapping.icon}
                      label={mapping.label}
                      value={
                        groupData[field] != null
                          ? getFormattedValue(group, field, groupData[field])
                          : "-"
                      }
                    />
                  </Grid>
                );
              })}
            </Grid>
            {group === "coral" && groupData.L1 != null && (
              <Box sx={{ mt: 2, width: "100%" }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
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
            {group === "algae" && groupData.scoredProcessorCount != null && (
              <Box sx={{ mt: 2, width: "100%" }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
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
          </Paper>
        );
      })}
    </Box>
  );
};

const formatTimestamp = (timestamp) =>
  new Intl.DateTimeFormat(undefined, {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "2-digit",
  }).format(new Date(parseInt(timestamp)));

// ------------------- ReportCard Component -------------------
// The header now uses a full-width clickable area with an added "go to" icon.
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
          {isMatchQuery ? report.robot : report.match_key}
        </Typography>
        <ArrowForwardIosIcon
          fontSize="small"
          sx={{ ml: 1, color: (theme) => theme.palette.common.white }}
        />
      </Box>
      <Typography variant="caption" sx={{ display: "block", mb: 2 }}>
        {`Scouted by ${report.scout_name} at ${formatTimestamp(
          report.match_start_time
        )}, submitted at ${formatTimestamp(report.submission_time)}`}
      </Typography>
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
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Cycles
        </Typography>
        <CyclesFieldCanvas report={report} />
      </Box>
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

  const renderNavBar = () => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2, pb: 1 }}>
      {reports.map((report, i) => {
        const header = isMatchQuery ? report.robot : report.match_key;
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
  );

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

// ------------------- ReportsList Component -------------------
const ReportsList = ({ data }) => {
  const { averages, reports } = data;
  const [searchParams] = useSearchParams();
  const eventKey = searchParams.get("eventKey") || "";
  const isMatchQuery = Boolean(searchParams.get("matchKey"));

  return (
    <Box sx={{ p: 2 }}>
      {averages != null &&
        ["auto", "tele"].map(
          (phase) =>
            averages[phase] && (
              <Box key={phase}>
                <AveragesSummary phase={phase} averages={averages[phase]} />
              </Box>
            )
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
