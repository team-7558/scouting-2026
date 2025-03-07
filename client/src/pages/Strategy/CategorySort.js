import React, { useState, useRef, useEffect } from "react";
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
  Container,
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Link,
  useLocation,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SpeedIcon from "@mui/icons-material/Speed";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PushPinIcon from "@mui/icons-material/PushPin";
import SearchIcon from "@mui/icons-material/Search";

import CyclesFieldCanvas from "./CyclesFieldCanvas"; // Your CyclesFieldCanvas component
import ScoreBarChart from "./ScoreBarChart"; // Reusable chart component
import RequiredParamsDialog from "../Common/RequiredParamsDialog";
import ReportsList from "./ReportsList";
import { getReports } from "../../requests/ApiRequests";
// Import metric mapping and group colors so that we can reuse the labels and color styling.
import { averageMetricMapping, groupColors } from "./AveragesConfig";

// Formatting functions copied from PhaseAveragesTable.
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
    ...metricKeys.map((key) => ({
      id: key,
      label: averageMetricMapping[key] ? averageMetricMapping[key].label : key,
    })),
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Category header styled with the group color from AveragesConfig */}
      <Typography
        variant="h6"
        sx={{
          bgcolor: groupColors[group] || "grey.300",
          color: theme.palette.getContrastText(
            groupColors[group] || "grey.300"
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
                        ? getFormattedValue(group, key, row[key])
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

const CategorySort = ({ requiredParamKeys = ["eventKey"] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [paramsProvided, setParamsProvided] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fixed search bars for "matchKey" and "robot"
  const [matchKeySearchTerm, setMatchKeySearchTerm] = useState("");
  const [robotSearchTerm, setRobotSearchTerm] = useState("");

  // Prepopulate search terms.
  useEffect(() => {
    setMatchKeySearchTerm(searchParams.get("matchKey") || "");
    setRobotSearchTerm(searchParams.get("robot") || "");
  }, [searchParams]);

  // Check if all required params are provided.
  useEffect(() => {
    const allProvided = requiredParamKeys.every(
      (key) => searchParams.get(key) && searchParams.get(key).trim() !== ""
    );
    setParamsProvided(allProvided);
  }, [location.search, searchParams, requiredParamKeys]);

  // In your CategorySort component, replace the effect dependency for searchParams with a stable value:
  const spString = searchParams.toString();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        requiredParamKeys.forEach((key) => {
          params[key] = searchParams.get(key);
        });
        console.log("params: ", params);
        const res = await getReports(params);
        setReportData(res.data);
      } catch (err) {
        setError("Error loading reports");
      } finally {
        setLoading(false);
      }
    };

    if (paramsProvided) {
      fetchReports();
    }
  }, [paramsProvided, spString]); // now using spString instead of searchParams

  // When Enter is pressed in the matchKey search bar:
  // - Remove the robot parameter, update matchKey, and navigate to /matches.
  const handleMatchKeySearchKeyDown = (e) => {
    if (e.key === "Enter") {
      const newParams = {};
      requiredParamKeys.forEach((key) => {
        if (key !== "robot") {
          newParams[key] = searchParams.get(key);
        }
      });
      newParams["matchKey"] = matchKeySearchTerm;
      setSearchParams(newParams);
      navigate(`/matches?${new URLSearchParams(newParams).toString()}`);
    }
  };

  // When Enter is pressed in the robot search bar:
  // - Remove the matchKey parameter, update robot, and navigate to /robots.
  const handleRobotSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      const newParams = {};
      requiredParamKeys.forEach((key) => {
        if (key !== "matchKey") {
          newParams[key] = searchParams.get(key);
        }
      });
      newParams["robot"] = robotSearchTerm;
      setSearchParams(newParams);
      navigate(`/robots?${new URLSearchParams(newParams).toString()}`);
    }
  };

  const handleDialogSubmit = (values) => {
    const currentParams = {};
    for (const key of searchParams.keys()) {
      currentParams[key] = searchParams.get(key);
    }
    setSearchParams({ ...currentParams, ...values });
  };

  return (
    <Container>
      <Paper sx={{ p: 2, mb: 3 }}>
        {/* Top header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h4" sx={{ mb: { xs: 2, sm: 0 } }}>
            View Reports
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <TextField
              value={matchKeySearchTerm}
              onChange={(e) =>
                setMatchKeySearchTerm(e.target.value.toLowerCase())
              }
              onKeyDown={handleMatchKeySearchKeyDown}
              variant="outlined"
              size="small"
              placeholder="Search by match key"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: "100%", sm: 250 } }}
            />
            <TextField
              value={robotSearchTerm}
              onChange={(e) => setRobotSearchTerm(e.target.value.toLowerCase())}
              onKeyDown={handleRobotSearchKeyDown}
              variant="outlined"
              size="small"
              placeholder="Search by robot"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: "100%", sm: 250 } }}
            />
          </Box>
        </Box>
        {/* Show current required parameters as chips */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {requiredParamKeys.map((key) => (
            <Chip key={key} label={`${key}: ${searchParams.get(key)}`} />
          ))}
        </Box>
      </Paper>
      {paramsProvided ? (
        <>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          ) : reportData ? (
            <AveragesTable averages={reportData.averages} />
          ) : (
            <Typography variant="body1">No data available.</Typography>
          )}
        </>
      ) : (
        <RequiredParamsDialog
          open={true}
          onSubmit={handleDialogSubmit}
          searchParams={searchParams}
          searchParamsError=""
          requiredParamKeys={requiredParamKeys}
        />
      )}
    </Container>
  );
};

export default CategorySort;
