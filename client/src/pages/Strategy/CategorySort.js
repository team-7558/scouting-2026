import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import RequiredParamsDialog from "../Common/RequiredParamsDialog";
import { getReports } from "../../requests/ApiRequests";
import HomeIcon from "@mui/icons-material/Home";

const accentColor = "#1fdb25";

// ----------------- Helper Functions -----------------
const formatValue = (value, key) => {
  if (value === null || value === undefined) return "-";
  const v = Array.isArray(value) ? value[0] : value;

  if (typeof v === "number") {
    if (v === 0) return "-";
    if (key.toLowerCase().includes("time")) return (v / 1000).toFixed(1) + "s";
    if (key.toLowerCase().includes("rate") || key.toLowerCase().includes("accuracy"))
      return (v * 100).toFixed(1) + "%";
    return v.toFixed(1);
  }
  if (typeof v === "object") return JSON.stringify(v);
  return v;
};

const getRawValue = (item, key) => {
  const value = item[key];
  return Array.isArray(value) ? value[0] : value;
};

const descendingComparator = (a, b, orderBy) => {
  const aVal = getRawValue(a, orderBy);
  const bVal = getRawValue(b, orderBy);
  if (bVal < aVal) return -1;
  if (bVal > aVal) return 1;
  return 0;
};

const getComparator = (order, orderBy) =>
  order === "desc" ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);

const stableSort = (array, comparator) => {
  const stabilized = array.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
};

const camelCaseToWords = (str) => {
  let result = str.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// ----------------- CategoryTable -----------------
const CategoryTable = ({ group, rows, metricKeys, headingColor }) => {
  const theme = useTheme();
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("robot");

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  return (
    <TableContainer component={Paper} sx={{ bgcolor: "#111", margin: "2%", width: "96%" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {["robot", "phase", ...metricKeys].map((key) => (
              <TableCell
                key={key}
                sortDirection={orderBy === key ? order : false}
                sx={{
                  bgcolor: "#111",
                  color: headingColor || "#0ff",
                  fontWeight: "bold",
                  borderBottom: `2px solid ${headingColor || "#0ff"}`,
                  fontSize: "30px",
                }}
              >
                <TableSortLabel
                  active={orderBy === key}
                  direction={orderBy === key ? order : "asc"}
                  sx={{
                    color: headingColor, '&.Mui-active': {
                      color: "#fff",
                      fontSize: "40px"
                    }
                  }}
                  onClick={(e) => handleRequestSort(e, key)}
                >
                  {camelCaseToWords(key)}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {stableSort(rows, getComparator(order, orderBy)).map((row, index) => (
            <TableRow
              key={`${row.robot}-${row.phase}-${index}`}
              sx={{
                bgcolor: "#222",
                "&:hover": {
                  bgcolor: "#333",
                  boxShadow: `0 0 10px ${headingColor || "#0ff"} inset`,
                },
              }}
            >
              <TableCell sx={{ color: "#fff", fontSize: "30px", }}>{row.robot}</TableCell>
              <TableCell sx={{ color: "#fff", fontSize: "30px", }}>{row.phase}</TableCell>
              {metricKeys.map((key) => (
                <TableCell key={key} sx={{ color: "#fff", fontSize: "40px", }}>
                  {formatValue(row[key], key)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ----------------- AveragesTable -----------------
const AveragesTable = ({ averages, phaseFilter, headingColors }) => {
  const [openGroups, setOpenGroups] = useState({});

  console.log("avg", averages);

  const categoryRows = {};
  Object.keys(averages).forEach((robotId) => {
    const robotAverages = averages[robotId] || {};
    Object.keys(robotAverages).forEach((phase) => {
      if (phaseFilter !== "all" && phase.toLowerCase() !== phaseFilter) return;
      const phaseData = robotAverages[phase] || {};
      Object.keys(phaseData).forEach((group) => {
        if (!categoryRows[group]) categoryRows[group] = [];
        categoryRows[group].push({
          robot: robotId,
          phase: phase.toUpperCase(),
          ...phaseData[group],
        });
      });
    });
  });

  useEffect(() => {
    const defaults = {};
    Object.keys(categoryRows).forEach((group) => {
      defaults[group] = false;
    });
    setOpenGroups(defaults);
  }, [averages]);

  const toggleGroup = (group) => setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  return (
    <>
      {Object.keys(categoryRows).map((group) => {
        const rows = categoryRows[group];
        const metricKeys = Array.from(
          new Set(rows.flatMap((row) => Object.keys(row).filter((key) => key !== "robot" && key !== "phase")))
        );

        return (
          <Box key={group} sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                p: 1,
                bgcolor: "#111",
                color: headingColors?.[group] || "#0f0",
                cursor: "pointer",
                borderLeft: `4px solid ${headingColors?.[group] || "#0f0"}`,
                mb: 1,
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "#111",
                  boxShadow: `0 0 15px ${headingColors?.[group] || "#0f0"}`,
                },
                margin: "2vw 1vw",
              }}
              onClick={() => toggleGroup(group)}
            >
              <Typography variant="h3" sx={{ flexGrow: 1 }}>
                {camelCaseToWords(group)}
              </Typography>
              {openGroups[group] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            <Collapse in={openGroups[group]} timeout="auto" unmountOnExit>
              <CategoryTable group={group} rows={rows} metricKeys={metricKeys} headingColor={headingColors?.[group]} />
            </Collapse>
          </Box>
        );
      })}
    </>
  );
};

// ----------------- CategorySort -----------------
const CategorySort = ({ requiredParamKeys = ["eventKey"], headingColors = {
  fuel: "#fcec4e",
  hang: "#e06bfa",
  defense: "#FCA311",
  contact: "#00B4D8",
  movement: "#FCA311"
} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const cachedData = useMemo(() => {
    const stored = localStorage.getItem("averagesData");
    return stored ? JSON.parse(stored) : null;
  }, []);
  const [reportData, setReportData] = useState(cachedData);
  const [isSyncing, setIsSyncing] = useState(false);
  const [paramsProvided, setParamsProvided] = useState(false);

  const [matchKeySearchTerm, setMatchKeySearchTerm] = useState("");
  const [robotSearchTerm, setRobotSearchTerm] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    setMatchKeySearchTerm(searchParams.get("matchKey") || "");
    setRobotSearchTerm(searchParams.get("robot") || "");
  }, [searchParams]);

  useEffect(() => {
    const allProvided = requiredParamKeys.every((key) => searchParams.get(key) && searchParams.get(key).trim() !== "");
    setParamsProvided(allProvided);
  }, [location.search, searchParams, requiredParamKeys]);

  const loadData = async () => {
    setIsSyncing(true);
    try {
      const params = {};
      requiredParamKeys.forEach((key) => {
        params[key] = searchParams.get(key);
      });
      const res = await getReports(params);
      setReportData(res.data);
      console.log("data", res.data);
      localStorage.setItem("averagesData", JSON.stringify(res.data));
    } catch {
      console.error("Error loading reports");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (paramsProvided && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
    }
  }, [paramsProvided]);

  const handlePhaseFilter = (e, newPhase) => {
    if (newPhase !== null) setPhaseFilter(newPhase);
  };

  const handleSearchKeyDown = (type) => (e) => {
    if (e.key === "Enter") {
      const newParams = {};
      requiredParamKeys.forEach((key) => {
        if (key !== type) newParams[key] = searchParams.get(key);
      });
      newParams[type] = type === "matchKey" ? matchKeySearchTerm : robotSearchTerm;
      setSearchParams(newParams);
      navigate(`?${new URLSearchParams(newParams).toString()}`);
    }
  };

  const handleDialogSubmit = (values) => {
    const currentParams = {};
    for (const key of searchParams.keys()) currentParams[key] = searchParams.get(key);
    setSearchParams({ ...currentParams, ...values });
  };

  return (
    <div style={{ width: "100%", height: "100%", padding: "0", paddingBottom: "3vh", overflow: "auto" }}>
      <Paper sx={{ p: 2, mb: 3, bgcolor: "#111" }}>
        <HomeIcon
          sx={{ aspectRatio: "1/1", marginBottom: "-10%", zIndex: 5, cursor: "pointer", margin: "0px", fontSize: "30px", color: "white" }}
          onClick={() => {
            navigate("/");
          }}
        />
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h2" sx={{ mb: { xs: 2, sm: 0 }, color: accentColor }}>
            View Reports
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {requiredParamKeys.map((key) => <Chip key={key} label={`${key}: ${searchParams.get(key)}`} sx={{ bgcolor: "#222", color: accentColor }} />)}
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexDirection: "column", width: { xs: "100%", sm: "auto" } }}>
            <form onSubmit={(e) => {
              e.preventDefault();
              const url = new URL(window.location.href);
              url.pathname = "/matches";
              url.searchParams.set("matchKey", matchKeySearchTerm);
              window.history.replaceState({}, "", url.toString());
              window.location.href = window.location.href;
            }}>
              <TextField
                value={matchKeySearchTerm}
                onChange={(e) => setMatchKeySearchTerm(e.target.value.toLowerCase())}
                onKeyDown={handleSearchKeyDown("matchKey")}
                variant="outlined"
                size="small"
                placeholder="Search by match key"
                InputProps={{ endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment> }}
                sx={{ width: { xs: "100%", sm: 250 }, bgcolor: "#222", input: { color: "#fff" } }}
              />
            </form>
            <form onSubmit={(e) => {
              e.preventDefault();
              const url = new URL(window.location.href);
              url.pathname = "/robots";
              url.searchParams.set("robot", robotSearchTerm);
              window.history.replaceState({}, "", url.toString());
              window.location.href = window.location.href;
            }}>
              <TextField
                value={robotSearchTerm}
                onChange={(e) => {
                  setRobotSearchTerm(e.target.value);
                }}
                onKeyDown={handleSearchKeyDown("robot")}
                variant="outlined"
                size="small"
                placeholder="Search by robot"
                InputProps={{ endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment> }}
                sx={{ width: { xs: "100%", sm: 250 }, bgcolor: "#222", input: { color: "#fff" } }}
              />
            </form>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <ToggleButtonGroup
            value={phaseFilter}
            exclusive
            onChange={handlePhaseFilter}
            aria-label="phase filter"
          >
            <ToggleButton
              value="all"
              aria-label="all phases"
              sx={{
                color: accentColor,
                '&.Mui-selected': {
                  border: `2px solid ${accentColor}`,
                  color: accentColor,
                },
              }}
            >
              All Phases
            </ToggleButton>
            <ToggleButton
              value="auto"
              aria-label="auto phase"
              sx={{
                color: accentColor,
                '&.Mui-selected': {
                  border: `2px solid ${accentColor}`,
                  color: accentColor,
                },
              }}
            >
              AUTO
            </ToggleButton>
            <ToggleButton
              value="tele"
              aria-label="tele phase"
              sx={{
                color: accentColor,
                '&.Mui-selected': {
                  border: `2px solid ${accentColor}`,
                  color: accentColor,
                },
              }}
            >
              TELE
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" onClick={loadData} sx={{ color: accentColor, borderColor: accentColor }}>Reload</Button>
        </Box>
      </Paper>

      {paramsProvided ? (
        <>
          {isSyncing && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1, color: "#0ff" }} />
              <Typography variant="body2" sx={{ color: "#0ff" }}>Syncing data in background...</Typography>
            </Box>
          )}
          {reportData && reportData.averages ? (
            <AveragesTable averages={reportData.averages} phaseFilter={phaseFilter} headingColors={headingColors} />
          ) : (
            <Typography variant="body1" sx={{ color: "#0ff" }}>No data available.</Typography>
          )}
        </>
      ) : (
        <RequiredParamsDialog open={true} onSubmit={handleDialogSubmit} searchParams={searchParams} searchParamsError="" requiredParamKeys={requiredParamKeys} />
      )}
    </div>
  );
};

export default CategorySort;
