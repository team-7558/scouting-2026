import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  Box,
  Button,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Link, useSearchParams } from "react-router-dom";

// Helper: Flatten an object (used for report totals).
// It assumes each field is an array and takes the second element.
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

// Helper: Format numeric values.
// Always round to 2 decimals.
// If the field includes "time", convert ms to seconds and append "s".
const formatValue = (colKey, value) => {
  if (typeof value !== "number") return value;
  let num = value;
  const [, field] = colKey.split(".");
  if (field.toLowerCase().includes("time")) {
    num = num / 1000;
    return num.toFixed(2) + "s";
  }
  return num.toFixed(2);
};

// --- Icon mappings for report summary (for coral and algae) ---
const metricIcons = {
  attainedCount: <ThumbUpIcon fontSize="medium" />,
  scoredCount: <CheckCircleIcon fontSize="medium" />,
  avgScoringCycleTime: <AccessTimeIcon fontSize="medium" />,
};

// --- ReportAccordion Component ---
// Displays one report in an Accordion with a modern, card-like look.
const ReportAccordion = ({ report, isMatchQuery, eventKey }) => {
  // Flatten report totals and include top-level keys.
  const flatData = flattenData(report.totals);
  flatData["matchKey"] = report.match_key;
  flatData["robot"] = report.robot;

  // For summary, we display only metrics for coral and algae.
  const visibleGroups = ["coral", "algae"];
  const visibleFields = ["attainedCount", "scoredCount", "avgScoringCycleTime"];
  const summaryData = [];
  visibleGroups.forEach((group) => {
    visibleFields.forEach((field) => {
      const key = `${group}.${field}`;
      if (flatData[key] != null) {
        summaryData.push({ group, field, value: flatData[key] });
      }
    });
  });

  return (
    <Accordion
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: 2,
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: "rgba(0,0,0,0.03)",
          borderRadius: 2,
          px: 2,
          py: 1,
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
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
              }}
            >
              {isMatchQuery ? report.robot : report.match_key}
            </Button>
          </Grid>
          <Grid item>
            <Typography
              variant="subtitle1"
              sx={{ fontSize: "1.1rem", fontWeight: 600 }}
            >
              Summary:
            </Typography>
          </Grid>
          {summaryData.map(({ group, field, value }) => (
            <Grid item key={`${group}.${field}`}>
              <Typography
                variant="h6"
                display="flex"
                alignItems="center"
                sx={{ fontSize: "1.1rem" }}
              >
                {metricIcons[field] && <Box mr={0.5}>{metricIcons[field]}</Box>}
                <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                  {field}:
                </Box>
                {formatValue(`${group}.${field}`, value)}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          backgroundColor: "rgba(0,0,0,0.02)",
          borderTop: "1px solid rgba(0,0,0,0.1)",
          px: 2,
          py: 1,
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Additional Details:
          </Typography>
          <Grid container spacing={1}>
            {Object.keys(flatData)
              .filter((key) => key !== "matchKey" && key !== "robot")
              .map((key) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Typography variant="body1" sx={{ fontSize: "1rem" }}>
                    {key}:{" "}
                    {flatData[key] != null
                      ? formatValue(key, flatData[key])
                      : "-"}
                  </Typography>
                </Grid>
              ))}
          </Grid>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default ReportAccordion;
