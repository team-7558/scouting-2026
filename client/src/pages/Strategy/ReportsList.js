import React, { useEffect, useRef } from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";

// TODO: Replace this with your actual SCOUTING_CONFIG path
import { SCOUTING_CONFIG } from "../ScoutMatch/ScoutingConfig";

const getDynamicPosition = (key) => {
  if (!key) return null;
  if (Array.isArray(key)) return [key, true];
  for (const config of Object.values(SCOUTING_CONFIG)) {
    for (const positionKey of Object.keys(config.positions)) {
      if (positionKey === key) {
        return [config.positions[positionKey], false];
      }
    }
  }
  return null;
};

const drawAutoPath = (ctx, report) => {
  const autoActions = (report.actions || []).filter((a) => a.phase === "auto");
  autoActions.sort((a, b) => a.timestamp - b.timestamp);

  ctx.strokeStyle = "#00FF88";
  ctx.lineWidth = 3;
  ctx.beginPath();

  let lastPos = null;
  autoActions.forEach((a) => {
    const start = getDynamicPosition(a.attainedLocation);
    const end = getDynamicPosition(a.depositLocation);
    if (start && !lastPos) lastPos = start[0];
    if (end) {
      ctx.moveTo(lastPos[0], lastPos[1]);
      ctx.lineTo(end[0], end[1]);
      lastPos = end[0];
    }
  });

  ctx.stroke();
};



const ReportsList = ({ data, headingColors }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.reports) return;

    const ctx = canvas.getContext("2d");
    const fieldImg = new Image();
    fieldImg.src = "/assets/frc_field.png"; // Replace with your actual FRC field image path
    fieldImg.onload = () => {
      ctx.drawImage(fieldImg, 0, 0, canvas.width, canvas.height);
      data.reports.forEach((report) => drawAutoPath(ctx, report));
    };
  }, [data]);

  const formatValue = (val, key) => {
    if (Array.isArray(val)) val = val[0];
    if (typeof val === "number") {
      if (key.includes("Rate") || key.includes("Accuracy")) return `${(val * 100).toFixed(1)}%`;
      if (key.includes("Time")) return `${(val / 1000).toFixed(1)}s`;
      return val.toFixed(1);
    }
    return val ?? "—";
  };

  const groupedStats = {
    powerCell: ["scoringAccuracy", "shotsAttempted", "shotsMade"],
    controlPanel: ["rotations", "colorMatches"],
    hang: ["hangTime", "successfulHangs"],
    defense: ["blocks", "defensiveRating"],
    contact: ["contactsMade", "penalties"],
    movement: ["movementTime", "movementRate"],
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper
        sx={{
          p: 2,
          backgroundColor: "#181818",
          border: "1px solid #333",
          boxShadow: "0 0 10px #00FF88",
        }}
      >
        <Typography variant="h5" sx={{ color: "#00FF88", mb: 1 }}>
          Autonomous Path Overview
        </Typography>
        <canvas ref={canvasRef} width={800} height={400} style={{ width: "100%", borderRadius: 10 }} />
      </Paper>

      {Object.entries(groupedStats).map(([category, stats]) => (
        <Paper
          key={category}
          sx={{
            p: 2,
            backgroundColor: "#121212",
            border: `1px solid ${headingColors[category]}`,
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "scale(1.02)",
              boxShadow: `0px 0px 15px ${headingColors[category]}`,
            },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 1,
              color: headingColors[category],
              textShadow: `0 0 10px ${headingColors[category]}`,
            }}
          >
            {category.toUpperCase()}
          </Typography>
          <Divider sx={{ mb: 1, borderColor: headingColors[category] }} />

          {data.reports.map((report, idx) => (
            <Box key={idx} sx={{ mb: 1, pl: 1 }}>
              {stats.map((key) => (
                <Typography key={key} sx={{ color: "#E0E0E0" }}>
                  <b>{key}:</b> {formatValue(report[key], key)}
                </Typography>
              ))}
              <Divider sx={{ mt: 1, mb: 1, borderColor: "#333" }} />
            </Box>
          ))}
        </Paper>
      ))}
    </Box>
  );
};

export default ReportsList;
