import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
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

// ------------------- AveragesSummary Component -------------------
// Renders metrics by group. For the "coral" and "algae" groups, after the metrics
// grid it shows a ScoreBarChart using a custom set of keys.
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
            sx={{
              p: 2,
              mb: 1,
              borderLeft: `6px solid ${groupColors[group] || "#000"}`,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ color: groupColors[group] || "inherit", mb: 1 }}
            >
              {group.toUpperCase()}
            </Typography>
            <Grid container spacing={1}>
              {fieldsToDisplay.map((field) => {
                if (chartKeys[group] && chartKeys[group].includes(field)) {
                  return null;
                }
                const key = `${group}.${field}`;
                const mapping = averageMetricMapping[field] || {
                  label: field,
                  icon: null,
                };
                return (
                  <Grid item xs={12} sm={4} key={key}>
                    <Typography variant="h6" display="flex" alignItems="start">
                      {mapping.icon && <Box mr={0.5}>{mapping.icon}</Box>}
                      <span style={{ fontWeight: 600, marginRight: 4 }}>
                        {mapping.label}:
                      </span>{" "}
                      {groupData[field] != null
                        ? getFormattedValue(group, field, groupData[field])
                        : "-"}
                    </Typography>
                  </Grid>
                );
              })}
            </Grid>
            {/* For the coral group, show the custom ScoreBarChart using keys for coral levels */}
            {group === "coral" && groupData.L1 != null && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Coral Levels
                </Typography>
                <ScoreBarChart
                  scoreData={groupData}
                  chartKeys={chartKeys[group]}
                />
              </Box>
            )}
            {/* For the algae group, show a breakdown using the new scored keys */}
            {group === "algae" && groupData.scoredProcessorCount != null && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Algae Scored Breakdown
                </Typography>
                <ScoreBarChart
                  scoreData={groupData}
                  chartKeys={[
                    "scoredProcessorCount",
                    "scoredNetCount",
                    "scoredOpponentProcessorCount",
                  ]}
                />
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
      sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 2 }}
    >
      <Box sx={{ mb: 2, borderBottom: `2px solid ${stationColor}` }}>
        <Button
          variant="text"
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
          sx={{
            fontSize: "1.2rem",
            fontWeight: 700,
            textTransform: "none",
            color: stationColor,
          }}
        >
          {isMatchQuery ? report.robot : report.match_key}
        </Button>
        {`Scouted by ${report.scout_name} at ${formatTimestamp(
          report.match_start_time
        )}, submitted at ${formatTimestamp(report.submission_time)}`}
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
            sx={{
              backgroundColor: stationColor,
              flexShrink: 0,
              border: i === index ? "3px solid" : "none",
            }}
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
        sx={{
          position: "absolute",
          top: "50%",
          left: 0,
          transform: "translateY(-50%)",
          backgroundColor: "rgba(255,255,255,0.8)",
          "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
        }}
      >
        <ArrowBackIosIcon />
      </IconButton>
      <IconButton
        onClick={handleNext}
        sx={{
          position: "absolute",
          top: "50%",
          right: 0,
          transform: "translateY(-50%)",
          backgroundColor: "rgba(255,255,255,0.8)",
          "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
        }}
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
