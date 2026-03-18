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
  Autocomplete,
} from "@mui/material";
import ClearIcon from '@mui/icons-material/Clear';
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import RequiredParamsDialog from "../Common/RequiredParamsDialog";
import { getReports } from "../../requests/ApiRequests";
import HomeIcon from "@mui/icons-material/Home";

import { accentColor, importantMetrics, calculatedMetrics } from "./Config";

// ----------------- Helper Functions -----------------
const formatValue = (value, key) => {
  if (value === null || value === undefined) return "-";
  const v = Array.isArray(value) ? value[0] : value;

  if (typeof v === "number") {
    if (v === 0) return "-";
    if (key.toLowerCase().includes("time")) return (v / 1000).toFixed(1) + "s";
    if (key.toLowerCase().includes("rate"))
      return (v * 100).toFixed(1) + "%";
    if (key.toLowerCase().includes("accuracy"))
      return v.toFixed(1) + "%"
    return v.toFixed(1);
  }
  if (typeof v === "object") return JSON.stringify(v);
  return v;
};

const getRawValue = (item, key) => {
  if (!item) return null; // Guard against undefined items
  const value = item[key];
  if (value === null || value === undefined) return null;
  return Array.isArray(value) ? value[0] : value;
};


const descendingComparator = (a, b, orderBy) => {
  // Use getRawValue which now safely handles potentially missing keys
  const aVal = getRawValue(a, orderBy);
  const bVal = getRawValue(b, orderBy);

  // Treat null or non-numeric values as lower than numbers
  if (bVal === null || typeof bVal !== 'number') return -1;
  if (aVal === null || typeof aVal !== 'number') return 1;

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

// ----------------- CategoryTable (Corrected for Sorting) -----------------
const CategoryTable = ({ data, group, rows, metricKeys, headingColor }) => {
  const theme = useTheme();
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("robot");

  console.log("averages", data, group, rows, metricKeys, headingColor);

  const processedRows = useMemo(() => {
    // Create a new array of rows that includes the calculated values as properties.
    return rows.map(row => {
      const newRow = { ...row };

      metricKeys.forEach(key => {
        let rawValue;
        if (calculatedMetrics[group]?.[key]) {
          // This metric is calculated on the fly.
          const calculatedResult = calculatedMetrics[group][key](data[row.robot], row.phase);
          // Convert the result (which might be a string like "-") to a number for sorting.
          // parseFloat will correctly handle numbers-as-strings ("25.1") and return NaN for "-".
          rawValue = parseFloat(calculatedResult);
        } else {
          // This metric exists on the row object; just get its raw value.
          rawValue = getRawValue(row, key);
        }

        // Add the purely numerical value to our new row object.
        // If rawValue is NaN or null, default to a low number like -1 so sorting remains stable.
        newRow[key] = (typeof rawValue === 'number' && !isNaN(rawValue)) ? rawValue : -1;
      });
      return newRow;
    });
  }, [rows, group, metricKeys]); // This memoization is key for performance

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
          {/* VITAL CHANGE: Use the new `processedRows` for sorting and mapping */}
          {stableSort(processedRows, getComparator(order, orderBy)).map((row, index) => (
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
                  {/* The display logic remains the same, as it will re-calculate for presentation */}
                  {calculatedMetrics[group]?.[key] 
                    ? calculatedMetrics[group]?.[key](data[row.robot], row.phase) 
                    : formatValue(row[key], key)}
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

  const categoryRows = useMemo(() => {
    const newCategoryRows = {};
    Object.keys(averages).forEach((robotId) => {
      const robotAverages = averages[robotId] || {};
      Object.keys(robotAverages).forEach((phase) => {
        if (phaseFilter !== "all" && phase.toLowerCase() !== phaseFilter) return;
        const phaseData = robotAverages[phase] || {};
        Object.keys(phaseData).forEach((group) => {
          if (!newCategoryRows[group]) newCategoryRows[group] = [];
          newCategoryRows[group].push({
            robot: robotId,
            phase: phase.toUpperCase(),
            ...phaseData[group],
          });
        });
      });
    });
    return newCategoryRows;
  }, [averages, phaseFilter]);

  useEffect(() => {
    const defaults = {};
    Object.keys(categoryRows).forEach((group) => {
      defaults[group] = false;
    });
    setOpenGroups(defaults);
  }, [averages, phaseFilter]); // Rerun when categoryRows keys might change

  const toggleGroup = (group) => setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  return (
    <>
      {Object.keys(categoryRows).map((group) => {
        const rows = categoryRows[group];
        // Handle phase filter change correctly for metricKeys
        const currentPhaseForMetrics = phaseFilter === 'all' ? 'tele' : phaseFilter;
        const metricKeys = importantMetrics[currentPhaseForMetrics]?.[group] || [];

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
              <CategoryTable data={averages} group={group} rows={rows} metricKeys={metricKeys} headingColor={headingColors?.[group]} />
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
  const [robotSearchTerm, setRobotSearchTerm] = useState([]);
  const [phaseFilter, setPhaseFilter] = useState("all");
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    setMatchKeySearchTerm(searchParams.get("matchKey") || "");
    const robotsFromUrl = searchParams.get("robot")?.split(',') || [];
    setRobotSearchTerm(robotsFromUrl.filter(Boolean));
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

  const handleDialogSubmit = (values) => {
    const currentParams = {};
    for (const key of searchParams.keys()) currentParams[key] = searchParams.get(key);
    setSearchParams({ ...currentParams, ...values });
  };

  return (
    <div style={{ width: "100%", height: "100%", padding: "0", paddingBottom: "3vh", overflow: "auto", backgroundColor: "#000" }}>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const url = new URL(window.location.href);
                    const urlParams = url.searchParams;

                    navigate(`/matches?eventKey=${urlParams.get("eventKey")}&matchKey=${matchKeySearchTerm}`);
                  }
                }}
                variant="outlined"
                size="small"
                placeholder="Search by match key"
                InputProps={{ endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment> }}
                sx={{ width: { xs: "100%", sm: 250 }, bgcolor: "#222", input: { color: "#fff" } }}
              />
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              id="robotsForm"
            >
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={Array.isArray(robotSearchTerm)
                  ? robotSearchTerm
                  : [robotSearchTerm]
                }
                onChange={(event, newValue) => {
                  setRobotSearchTerm(newValue.filter(Boolean));

                  const robotParam = newValue.join(",");

                  const urlObj = new URL(window.location.href);
                  const urlParams = urlObj.searchParams;

                  navigate(
                    `/robots?eventKey=${urlParams.get("eventKey")}&robot=${encodeURIComponent(robotParam)}`
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="large"
                    placeholder="Search by robots"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon sx={{ color: accentColor }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: { xs: "100%", sm: "20vw" },
                      bgcolor: "#222",
                      input: { color: "#fff" },
                      mt: { sm: "1vh", xs: 0 },
                      borderRadius: "500px",
                      fontSize: 'calc(0.7vw + 10px)'
                    }}
                  />
                )}
                renderTags={(value, getItemProps) =>
                  value.map((option, index) => {
                    if (!option) return null;
                    const { key, ...itemProps } = getItemProps({ index });
                    return (
                      <Chip
                        variant="outlined"
                        label={option}
                        key={key}
                        size="large"
                        sx={{ color: "#bbb", fontSize: 'calc(0.5vw + 7px)' }}
                        {...itemProps}
                        deleteIcon={<ClearIcon style={{ color: '#aaa', fontSize: '2vw' }}
                        />}
                      />
                    );
                  })
                }
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