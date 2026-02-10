import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import {
  Typography,
  Container,
  CircularProgress,
  TextField,
  InputAdornment,
  Box,
  Paper,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Card,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CardHeader,
  CardContent,
  Grid,
  Autocomplete,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from '@mui/icons-material/Clear';
import RequiredParamsDialog from "../Common/RequiredParamsDialog";
import { getReports } from "../../requests/ApiRequests";
import { styled } from '@mui/material/styles';
import HomeIcon from "@mui/icons-material/Home";

import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const accentColor = "#1fdb25";

const blueTeamColor = "#3ad5fc";
const redTeamColor = "#fa1919";

// ================================
// CONFIG: group colors
// ================================
const GROUP_COLORS = {
  fuel: "#fcec4e",
  controlPanel: "#00B4D8",
  hang: "#e06bfa",
  defense: "#FCA311",
  contact: "#FCA311",
  movement: "#00B4D8"
};

// ================================
// UTILS
// ================================
const camelCaseToWords = (str) => {
  const result = str.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
};

const formatValue = (value, key, roundingCount) => {
  if (value === null || value === undefined) return "-";
  const v = Array.isArray(value) ? value[0] : value;

  if (typeof v === "number") {
    if (v === 0 && !key.toLowerCase().includes("count")) return "-";
    if (key.toLowerCase().includes("time")) return (v / 1000).toFixed(1) + "s";
    if (key.toLowerCase().includes("rate") || key.toLowerCase().includes("accuracy"))
      return (v * 100).toFixed(roundingCount) + "%";
    return v.toFixed(roundingCount);
  }
  if (typeof v === "object") return JSON.stringify(v);
  return v;
};

const ViewReportGraphs = ({ data, headingColors }) => {
  const [selectedPhase, setSelectedPhase] = useState("tele");

  const getAvailableMetrics = () => {
    if (!data?.reports?.[0]?.totals?.[selectedPhase]) {
      return [];
    }
    return Object.keys(data.reports[0].totals[selectedPhase]);
  };

  const [selectedMetric, setSelectedMetric] = useState(getAvailableMetrics()[0] || "");

  useEffect(() => {
    const availableMetrics = getAvailableMetrics();
    if (!availableMetrics.includes(selectedMetric)) {
      setSelectedMetric(availableMetrics[0] || "");
    }
  }, [selectedPhase, data]);


  const MetricsChart = ({ data, title }) => {
    let newData = [];
    const maxReportsCount = Math.max(...Object.values(data).map(arr => arr.length));

    for (let i = 0; i < maxReportsCount; i++) {
      let nextElement = { name: `Report ${i + 1}` };
      for (const key in data) {
        nextElement[key] = data[key][i] || 0;
      }
      newData.push(nextElement);
    }


    const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#008000", "#000080"];

    return (
      <Box sx={{ width: { xs: "90%", sm: "45%" }, aspectRatio: "16/9", mb: 4 }}>
        <Typography variant="h6" sx={{ textAlign: "center", color: "#ccc", height: "15%" }}>
          {camelCaseToWords(title)}
        </Typography>
        <Box sx={{ width: "100%", height: "85%" }}>
          <ResponsiveContainer>
            <LineChart data={newData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(data).map((robot, i) => {
                return (
                  <Line
                    key={robot.toString()}
                    type="monotone"
                    dataKey={robot.toString()}
                    stroke={colors[i % colors.length]}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    );
  };

  if (!data?.reports || data.reports.length === 0) {
    return null;
  }

  const availableMetrics = getAvailableMetrics();
  const submetrics = selectedMetric ? Object.keys(data.reports[0].totals[selectedPhase][selectedMetric] || {}) : [];
  return (
    <Paper sx={{ bgcolor: "#111", margin: "2%", width: "96%", padding: "2vh 2vw", boxShadow: `0px 0px 10px #aaa` }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <FormControl>
          <InputLabel id="phaseSelector-label" sx={{ color: "#ccc" }}>Phase</InputLabel>
          <Select
            labelId="phaseSelector-label"
            value={selectedPhase}
            label="Phase"
            onChange={(e) => setSelectedPhase(e.target.value)}
            sx={{ color: "#eee", border: `2px solid #ccc`, svg: { color: "#ccc" } }}
          >
            <MenuItem value={"auto"}>AUTO</MenuItem>
            <MenuItem value={"tele"}>TELE</MenuItem>
          </Select>
        </FormControl>

        {availableMetrics.length > 0 && (
          <FormControl>
            <InputLabel id="metricSelector-label" sx={{ color: "#ccc" }}>Metric</InputLabel>
            <Select
              labelId="metricSelector-label"
              value={selectedMetric}
              label="Metric"
              onChange={(e) => setSelectedMetric(e.target.value)}
              sx={{ color: "#eee", border: "2px solid #ccc", svg: { color: "#ccc" } }}
            >
              {availableMetrics.map(name => (
                <MenuItem key={name} value={name}>{camelCaseToWords(name)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-evenly" }}>
        {submetrics.map(submetricName => {
          let allData = {};
          data.reports.forEach(report => {
            if (!allData[report.robot]) {
              allData[report.robot] = [];
            }
            const value = report.totals[selectedPhase]?.[selectedMetric]?.[submetricName];
            allData[report.robot].push(Array.isArray(value) ? value[0] : value);
          });
          console.log("allData", allData);
          return <MetricsChart key={submetricName} data={allData} title={submetricName} />;
        })}
      </Box>
    </Paper>
  );
};

const ViewIndividualReports = ({ reports, headingColors }) => {
  const [currentReport, setCurrentReport] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState("tele");

  if (!reports || reports.length === 0) {
    return (
      <Paper sx={{ bgcolor: "#111", margin: "2%", width: "96%", padding: "2vh 2vw", boxShadow: `0px 0px 10px #aaa` }}>
        <Typography sx={{ color: "#888", textAlign: "center" }}>No individual reports available.</Typography>
      </Paper>
    );
  }

  const MetricTable = ({ metric, sx }) => {
    const data = reports[currentReport].totals[selectedPhase]?.[metric];

    if (!data) return null;

    return (
      <Table size="small" sx={{ ...sx, mt: 1 }}>
        <TableHead>
          <TableRow>
            {Object.keys(data).map(categoryKey => (
              <TableCell key={categoryKey} sx={{ color: GROUP_COLORS[metric] || '#fff', backgroundColor: "#444", border: `2px solid ${GROUP_COLORS[metric] || '#fff'}` }}>
                {camelCaseToWords(categoryKey)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            {Object.keys(data).map(categoryKey => (
              <TableCell key={`values-${categoryKey}-${metric}`} sx={{ color: GROUP_COLORS[metric] || '#fff', backgroundColor: "#444", border: `2px solid ${GROUP_COLORS[metric] || '#fff'}` }}>
                {formatValue(data[categoryKey], categoryKey, 1)}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    );
  };

  return (
    <Paper sx={{ bgcolor: "#111", margin: "2%", width: "96%", padding: "2vh 2vw", boxShadow: `0px 0px 10px #aaa` }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        {reports.map((report, index) => (
          <Chip
            key={report.id}
            label={`${report.robot}: ${report.match_key}`}
            sx={{
              backgroundColor: index === currentReport ? "#888" : (report.station?.startsWith("b") ? blueTeamColor : redTeamColor),
              color: "#000",
              cursor: "pointer",
              '&:hover': { backgroundColor: "#888" }
            }}
            onClick={() => setCurrentReport(index)}
          />
        ))}
      </Box>

      {currentReport >= 0 && (
        <>
          <Select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            sx={{ color: "#eee", border: `2px solid #ccc`, svg: { color: "#ccc" }, float: "right", height: "40px", mb: 2 }}
          >
            <MenuItem value={"auto"}>AUTO</MenuItem>
            <MenuItem value={"tele"}>TELE</MenuItem>
          </Select>

          <Box>
            {reports[currentReport].disabled === "Yes" && (
              <Typography variant="h4" sx={{ backgroundColor: accentColor, textAlign: "center", borderRadius: "1000px", my: 2 }}>
                DISABLED
              </Typography>
            )}
            <Box sx={{ display: "flex", gap: "3vw", flexDirection: { xs: "column", sm: "row" }, mt: 2, width: "100%" }}>
              <Typography sx={{ color: "#ccc", width: "80%", borderBottom: `2px solid ${blueTeamColor}` }}>
                {reports[currentReport].comments}
              </Typography>
              <Box sx={{ display: "flex", gap: "2vw", borderBottom: `2px solid ${blueTeamColor}`, justifyContent: "space-between" }}>
                <Typography sx={{ color: "#ccc" }}>Driver Skill: {reports[currentReport].driver_skill}</Typography>
                <Typography sx={{ color: "#ccc" }}>Defense Skill: {reports[currentReport].defense_skill}</Typography>
                <Typography sx={{ color: "#ccc" }}>Roles: {JSON.parse(reports[currentReport].roles).join(', ')}</Typography>
              </Box>
            </Box>

            {Object.keys(reports[currentReport].totals[selectedPhase] || {}).map(groupName => (
              <div key={groupName}>
                <Typography variant="h6" sx={{ color: GROUP_COLORS[groupName] || '#fff', mt: "1vh" }}>
                  {camelCaseToWords(groupName)}
                </Typography>
                <MetricTable metric={groupName} />
              </div>
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
};

// ================================
// Top Bar
// ================================
const RenderTopBar = ({
  matchKeySearchTerm,
  robotSearchTerm,
  setMatchKeySearchTerm,
  setRobotSearchTerm,
  handleSearchKeyDown,
  requiredParamKeys,
  searchParams
}) => {
  const navigate = useNavigate();
  return (
    <Paper
      sx={{
        zIndex: 2,
        p: 2,
        pb: 0,
        mb: 3,
        backgroundColor: "#121212",
        border: "1px solid #333",
        // boxShadow: `0px 0px 10px ${accentColor}`
        boxShadow: `0px 0px 10px #eee`
      }}
    >
      <HomeIcon
        sx={{ aspectRatio: "1/1", marginBottom: "-10%", zIndex: 5, cursor: "pointer", margin: "0px", fontSize: "30px", color: "white" }}
        onClick={() => {
          navigate("/");
        }}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <Typography variant="h2" sx={{ mb: { xs: 2, sm: 0 }, color: accentColor, textAlign: "center" }}>
            Team Reports
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-evenly" }}>
            {requiredParamKeys.map((key) => (
              <Chip
                key={key}
                label={`${key}: ${searchParams.get(key)}`}
                sx={{ backgroundColor: "#888", color: "#000" }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, alignItems: "center", height: "100%" }}>
          <Box sx={{ display: "flex", justifyContent: "space-evenly", height: "100%", flexDirection: { sm: "column", xs: "row" }, alignItems: "center" }}>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              size="large"
              sx={{
                borderRadius: "0.7vw",
                border: "2px solid " + accentColor,
                color: "#ddd",
                "&:hover": { backgroundColor: "#009933" },
                height: { xs: "50px", sm: "75px", md: "50px" },
                margin: { xs: "1vh 5vw", sm: "1vh 1vw" },
                width: { xs: "30vw", sm: "10vw" },
                fontSize: 'calc(0.5vw + 7px)'
              }}
            >
              RELOAD
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                window.location.pathname = "/categorySort"
              }}
              sx={{
                borderRadius: "0.7vw",
                border: `2px solid ${accentColor}`,
                color: "#ddd",
                "&:hover": { backgroundColor: "#009933" },
                height: { xs: "50px", sm: "75px", md: "50px" },
                margin: { xs: "1vh 5vw", sm: "1vh 1vw" },
                width: { xs: "30vw", sm: "10vw" },
                fontSize: 'calc(0.5vw + 7px)'
              }}
            >
              ALL DATA
            </Button>
          </Box>
          <Box sx={{ display: "flex", flexDirection: { xs: "row", sm: "column" }, justifyContent: "center", alignItems: "center" }}>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const url = new URL(window.location.href);
                url.pathname = "/matches";
                url.searchParams.set("matchKey", matchKeySearchTerm);
                window.history.replaceState({}, "", url.toString());
                window.location.href = window.location.href;
              }}
            >
              <TextField
                value={matchKeySearchTerm}
                onChange={(e) => setMatchKeySearchTerm(e.target.value.toLowerCase())}
                onKeyDown={handleSearchKeyDown("matchKey")}
                variant="outlined"
                size="large"
                placeholder="Search by match key"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon sx={{ color: accentColor }} />
                    </InputAdornment>
                  )
                }}
                sx={{ width: { xs: "100%", sm: "20vw" }, bgcolor: "#222", input: { color: "#fff", fontSize: 'calc(0.7vw + 10px)' }, borderRadius: "10000px" }}
              />
            </form>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const url = new URL(window.location.href);
                url.pathname = "/robots";
                setRobotSearchTerm(prevTerm => {
                  console.log("rst", prevTerm);
                  url.searchParams.set("robot", prevTerm.join(","));
                  console.log("here", url.href);
                  window.location.href = url.href;
                  return prevTerm;
                })
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
                  console.log("abc", newValue.filter(v => v));
                  setRobotSearchTerm(newValue.filter(Boolean));
                  const form = document.getElementById("robotsForm");
                  const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
                  form.dispatchEvent(submitEvent);
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
                    const { key, ...itemProps } = getItemProps({ index });
                    console.log("i", index);
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
      </Box>
    </Paper>
  );
}

// ================================
// Category Table
// ================================

const CategoryTable = ({ averages, headingColors = {} }) => {
  const importantMetrics = {
    fuel: ["attainedCount", "shotCount"],
    hang: ["attempts", "cycleTime", "lOneRate"],
    movement: ["bumps", "movementTime", "movements", "trenches"],
    contact: ["foulCount", "pinCount", "totalTime"],
    defense: ["totalTime"],
  };

  const renderTableForPhase = (phase) => {
    const robots = Object.keys(averages);
    if (robots.length === 0) {
      return <Typography sx={{ color: "#888", textAlign: "center", mt: 2 }}>No average data available.</Typography>;
    }

    const allMetricKeys = [...new Set(robots.flatMap(robot => Object.keys(averages[robot][phase] || {})))];

    return (
      <TableContainer component={Paper} sx={{ bgcolor: "#222", my: 2 }}>
        <Typography variant="h5" sx={{ color: "#ccc", p: 2 }}>{phase.toUpperCase()}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: "#fff", fontWeight: "bold", backgroundColor: "#444", border: "1px solid white" }}>Robot</TableCell>
              {allMetricKeys.map(metric => {
                const subMetrics = importantMetrics[metric] || [];
                return (
                  <TableCell key={metric} colSpan={subMetrics.length} sx={{
                    textAlign: "center",
                    fontWeight: "bold",
                    color: headingColors[metric] || "#fff",
                    backgroundColor: "#000",
                    border: `1px solid ${headingColors[metric] || "#fff"}`
                  }}>
                    {camelCaseToWords(metric)}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#fff", backgroundColor: "#444", border: "1px solid white" }}></TableCell>
              {allMetricKeys.flatMap(metric => {
                const subMetrics = importantMetrics[metric] || [];
                return subMetrics.map(subMetric => (
                  <TableCell key={`${metric}-${subMetric}`} sx={{
                    color: headingColors[metric] || "#fff",
                    backgroundColor: "#444",
                    border: `2px solid ${headingColors[metric] || "#fff"}`
                  }}>
                    {camelCaseToWords(subMetric)}
                  </TableCell>
                ));
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {robots.map(robot => (
              <TableRow key={robot}>
                <TableCell sx={{ color: "#fff", backgroundColor: "#444" }}>{robot}</TableCell>
                {allMetricKeys.flatMap(metric => {
                  const subMetrics = importantMetrics[metric] || [];
                  return subMetrics.map(subMetric => (
                    <TableCell key={`${robot}-${metric}-${subMetric}`} sx={{
                      color: headingColors[metric] || "#fff",
                      backgroundColor: "#444",
                      border: `2px solid ${headingColors[metric] || "#fff"}`
                    }}>
                      {formatValue(averages[robot]?.[phase]?.[metric]?.[subMetric], subMetric, 1)}
                    </TableCell>
                  ));
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Paper sx={{ bgcolor: "#111", margin: "2%", width: "96%", padding: "2vh 2vw", boxShadow: `0px 0px 10px #aaa` }}>
      {renderTableForPhase("auto")}
      {renderTableForPhase("tele")}
    </Paper>
  );
};
// ================================
// Main Component
// ================================
const ViewReports = ({ requiredParamKeys = ["eventKey"] }) => {
  const headingColors = {
    ...GROUP_COLORS
  }
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [paramsProvided, setParamsProvided] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [matchKeySearchTerm, setMatchKeySearchTerm] = useState("");
  const [robotSearchTerm, setRobotSearchTerm] = useState([]);

  useEffect(() => {
    if (window.location.pathname.startsWith("/robots")) {
      setMatchKeySearchTerm("");
      let url = new URL(window.location.href)
      url.searchParams.delete("matchKey");
      if (window.location.href !== url.href)
        window.location.href = url.href;
    } else if (window.location.pathname.startsWith("/matches")) {
      setRobotSearchTerm([]);
      let url = new URL(window.location.href)
      url.searchParams.delete("robot");
      if (window.location.href !== url.href)
        window.location.href = url.href;
    }
  }, [paramsProvided])

  // Initialize search fields from URL
  useEffect(() => {
    setMatchKeySearchTerm(searchParams.get("matchKey") || "");
    setRobotSearchTerm(searchParams.get("robot")?.split(",") || "");
  }, [searchParams]);

  // Check required params
  useEffect(() => {
    const allProvided = requiredParamKeys.every(
      (key) => searchParams.get(key) && searchParams.get(key).trim() !== ""
    );
    setParamsProvided(allProvided);
  }, [location.search, searchParams, requiredParamKeys]);

  // Fetch report data
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        requiredParamKeys.forEach((key) => {
          params[key] = searchParams.get(key);
        });

        const robotParam = searchParams.get("robot");
        // Split robots by comma if multiple
        const robots = robotParam ? robotParam.split(",").filter(Boolean) : [];

        let res;
        if (robots.length > 1) {
          // Multiple robots: Fetch each robot individually and await all responses
          const calls = robots.map((robot) => {
            const robotParams = { ...params, robot };
            const a = getReports(robotParams);
            return a;
          });
          const responses = await Promise.all(calls);
          // Aggregate or combine data as needed, here we combine all data arrays
          const combinedAverages = {}
          responses.flatMap(r => r.data.averages).forEach(r => {
            combinedAverages[Object.keys(r)[0]] = r[Object.keys(r)[0]];
          });
          const combinedReports = responses.flatMap(r => r.data.reports);
          setReportData({ averages: combinedAverages, reports: combinedReports });
        } else {
          // No robots or single robot: just fetch once with existing params
          res = await getReports(params);
          setReportData(res.data);
        }
        console.log("Report data:", res ? res.data : "Multiple robots fetched");
      } catch (err) {
        console.error(err);
        setError("Error loading reports");
      } finally {
        setLoading(false);
      }
    };

    if (paramsProvided) fetchReports();
    else (console.log("error not params provided"))
  }, [paramsProvided, searchParams, requiredParamKeys]);

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

  // Flatten data for CategoryTable
  const tableRows = [];
  if (reportData?.averages) {
    Object.keys(reportData.averages).forEach(robotId => {
      const robotData = reportData.averages[robotId];
      ["auto", "tele"].forEach(phase => {
        const phaseData = robotData[phase] || {};
        Object.keys(phaseData).forEach(group => {
          tableRows.push({
            robot: robotId,
            phase: phase.toUpperCase(),
            group,
            ...phaseData[group]
          });
        });
      });
    });
  }

  console.log(reportData);

  return (
    <div style={{ color: "#E0E0E0", width: "100%", backgroundColor: "#11181a" }}>
      <RenderTopBar
        matchKeySearchTerm={matchKeySearchTerm}
        robotSearchTerm={robotSearchTerm}
        setMatchKeySearchTerm={setMatchKeySearchTerm}
        setRobotSearchTerm={setRobotSearchTerm}
        handleSearchKeyDown={handleSearchKeyDown}
        requiredParamKeys={requiredParamKeys}
        searchParams={searchParams}
      />

      {paramsProvided ? (
        loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : tableRows.length ? (<>
          <CategoryTable averages={reportData.averages} headingColors={headingColors} />
          <ViewIndividualReports reports={reportData.reports} />
          {window.location.pathname.startsWith("/robots") && <ViewReportGraphs data={reportData} headingColors={headingColors} />}
        </>) : (
          <Typography sx={{ color: "#888" }}>No data available</Typography>
        )
      ) : (
        <RequiredParamsDialog
          open={true}
          onSubmit={handleDialogSubmit}
          searchParams={searchParams}
          searchParamsError=""
          requiredParamKeys={requiredParamKeys}
        />
      )}
    </div>
  );
};

export default ViewReports;
