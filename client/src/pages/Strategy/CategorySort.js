import React, { useState, useRef, useEffect, useMemo } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

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

// Helper functions for sorting: extract the raw value if it's an array.
const getRawValue = (item, key) => {
  const value = item[key];
  return Array.isArray(value) ? value[1] : value;
};

const descendingComparator = (a, b, orderBy) => {
  const aValue = getRawValue(a, orderBy);
  const bValue = getRawValue(b, orderBy);
  if (bValue < aValue) return -1;
  if (bValue > aValue) return 1;
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

// ------------------- CategoryTable Component -------------------
// Renders a table for a single category group.
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
          {stableSort(rows, getComparator(order, orderBy)).map((row, index) => (
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ------------------- AveragesTable Component -------------------
// Groups the averages data (nested by robot and phase) by category (group)
// and renders one collapsible table per group. The table is collapsed by default
// except for the "epa" group. A phaseFilter prop can limit the data to "auto" or "tele".
const AveragesTable = ({ averages, phaseFilter }) => {
  // Build rows grouped by category.
  const categoryRows = {};

  Object.keys(averages).forEach((robotId) => {
    const robotAverages = averages[robotId] || {};
    Object.keys(robotAverages).forEach((phase) => {
      // Apply phase filter if set (phase keys are assumed to be lower-case).
      if (phaseFilter !== "all" && phase.toLowerCase() !== phaseFilter) return;
      const phaseData = robotAverages[phase] || {};
      Object.keys(phaseData).forEach((group) => {
        if (!categoryRows[group]) {
          categoryRows[group] = [];
        }
        categoryRows[group].push({
          robot: robotId,
          phase: phase.toUpperCase(),
          ...phaseData[group],
        });
      });
    });
  });

  // Manage open/closed state for each group.
  const [openGroups, setOpenGroups] = useState({});

  // Set default open state on first render.
  useEffect(() => {
    const defaults = {};
    Object.keys(categoryRows).forEach((group) => {
      defaults[group] = group.toLowerCase() === "epa"; // open only if group === "epa"
    });
    setOpenGroups(defaults);
  }, [averages]);

  const toggleGroup = (group) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <>
      {Object.keys(categoryRows).map((group) => {
        const rows = categoryRows[group];
        // Collect unique metric keys from rows.
        const metricKeysSet = new Set();
        rows.forEach((row) => {
          Object.keys(row).forEach((key) => {
            if (key !== "robot" && key !== "phase") {
              metricKeysSet.add(key);
            }
          });
        });
        const dynamicHeaders = Array.from(metricKeysSet);
        return (
          <Box key={group} sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: groupColors[group] || "#333",
                color: (theme) =>
                  theme.palette.getContrastText(groupColors[group] || "#333"),
                p: 1,
                borderRadius: 1,
                mb: 1,
                cursor: "pointer",
              }}
              onClick={() => toggleGroup(group)}
            >
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {group.toUpperCase()}
              </Typography>
              {openGroups[group] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            <Collapse in={openGroups[group]} timeout="auto" unmountOnExit>
              <CategoryTable
                group={group}
                rows={rows}
                metricKeys={dynamicHeaders}
              />
            </Collapse>
          </Box>
        );
      })}
    </>
  );
};

// ------------------- CategorySort Component -------------------
const CategorySort = ({ requiredParamKeys = ["eventKey"] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Use cached data from localStorage if available.
  const cachedData = useMemo(() => {
    const stored = localStorage.getItem("averagesData");
    return stored ? JSON.parse(stored) : null;
  }, []);
  const [reportData, setReportData] = useState(cachedData);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState("");

  // Fixed search bars for "matchKey" and "robot"
  const [matchKeySearchTerm, setMatchKeySearchTerm] = useState("");
  const [robotSearchTerm, setRobotSearchTerm] = useState("");
  // Phase filter: "all", "auto", or "tele"
  const [phaseFilter, setPhaseFilter] = useState("all");

  // Ref to ensure we only auto-load once per reload.
  const hasLoadedRef = useRef(false);

  // Prepopulate search terms.
  useEffect(() => {
    setMatchKeySearchTerm(searchParams.get("matchKey") || "");
    setRobotSearchTerm(searchParams.get("robot") || "");
  }, [searchParams]);

  // Check if all required params are provided.
  const [paramsProvided, setParamsProvided] = useState(false);
  useEffect(() => {
    const allProvided = requiredParamKeys.every(
      (key) => searchParams.get(key) && searchParams.get(key).trim() !== ""
    );
    setParamsProvided(allProvided);
  }, [location.search, searchParams, requiredParamKeys]);

  // Function to load data from API.
  const loadData = async () => {
    setIsSyncing(true);
    setError("");
    try {
      const params = {};
      requiredParamKeys.forEach((key) => {
        params[key] = searchParams.get(key);
      });
      console.log("params: ", params);
      const res = await getReports(params);
      setReportData(res.data);
      localStorage.setItem("averagesData", JSON.stringify(res.data));
    } catch (err) {
      setError("Error loading reports");
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-load data once when params are provided.
  useEffect(() => {
    if (paramsProvided && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
    }
  }, [paramsProvided]);

  // When Enter is pressed in the matchKey search bar.
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

  // When Enter is pressed in the robot search bar.
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

  // Handle phase filter change.
  const handlePhaseFilter = (e, newPhase) => {
    if (newPhase !== null) {
      setPhaseFilter(newPhase);
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
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {requiredParamKeys.map((key) => (
            <Chip key={key} label={`${key}: ${searchParams.get(key)}`} />
          ))}
        </Box>
        {/* Phase filter */}
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <ToggleButtonGroup
            value={phaseFilter}
            exclusive
            onChange={handlePhaseFilter}
            aria-label="phase filter"
          >
            <ToggleButton value="all" aria-label="all phases">
              All Phases
            </ToggleButton>
            <ToggleButton value="auto" aria-label="auto phase">
              AUTO
            </ToggleButton>
            <ToggleButton value="tele" aria-label="tele phase">
              TELE
            </ToggleButton>
          </ToggleButtonGroup>
          {/* Physical Reload Button */}
          <Button variant="outlined" onClick={loadData}>
            Reload
          </Button>
        </Box>
      </Paper>
      {paramsProvided ? (
        <>
          {/* Sync indicator */}
          {isSyncing && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">
                Syncing data in background...
              </Typography>
            </Box>
          )}
          {reportData && reportData.averages ? (
            <AveragesTable
              averages={reportData.averages}
              phaseFilter={phaseFilter}
            />
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
