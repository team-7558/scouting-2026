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

import {
  accentColor,
  blueTeamColor,
  redTeamColor,
  GROUP_COLORS,
  calculatedMetrics,
  importantMetrics,
  visibleMetrics
} from "./Config";

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
    if (key.toLowerCase().includes("rate"))
      return (v * 100).toFixed(roundingCount) + "%";
    if (key.toLowerCase().includes("accuracy"))
      return v.toFixed(roundingCount) + "%"
    return v.toFixed(roundingCount);
  }
  if (typeof v === "object") return JSON.stringify(v);
  return v;
};

const ViewIndividualReports = ({ reports, averages, headingColors }) => {
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

    const dataKeys = visibleMetrics[selectedPhase][metric];

    return (
      <TableContainer sx={{ maxWidth: "100%", overflowX: "auto", mt: 1, ...sx }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {dataKeys.map(categoryKey => (
                <TableCell key={categoryKey} sx={{ color: GROUP_COLORS[metric] || '#fff', backgroundColor: "#444", border: `2px solid ${GROUP_COLORS[metric] || '#fff'}` }}>
                  {camelCaseToWords(categoryKey)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {dataKeys.map(categoryKey => {
                return (
                  <TableCell key={`values-${categoryKey}-${metric}`} sx={{ color: GROUP_COLORS[metric] || '#fff', backgroundColor: "#444", border: `2px solid ${GROUP_COLORS[metric] || '#fff'}` }}>
                    {calculatedMetrics[metric]?.[categoryKey] 
                      ? calculatedMetrics[metric][categoryKey]({
                        ...reports[currentReport].totals,
                        avgShotRate: averages[reports[currentReport].robot].avgShotRate,
                      }, selectedPhase) 
                      : formatValue(data[categoryKey], categoryKey, 1)}
                  </TableCell>
                )
              })}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const matchStartTime = new Date(Number(reports[currentReport].match_start_time));
  console.log("matchSTartTime", matchStartTime, reports[currentReport].match_start_time);
  const matchStartTimeStr = matchStartTime.toLocaleTimeString('en-US', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

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

            <Box sx={{ display: "flex", gap: "2vw", justifyContent: "space-between" }}>
              <Typography sx={{ color: "#ccc" }}>Scouted by {reports[currentReport].scout_name}</Typography>
              <Typography sx={{ color: "#ccc" }}>Time: {matchStartTimeStr}</Typography>
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
  handleMatchKeyDown,
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
              onClick={() => {
                navigate(`/categorySort?eventKey=${searchParams.get("eventKey")}`);
              }}
              sx={{
                borderRadius: "0.7vw",
                border: `2px solid ${accentColor}`,
                color: "#ddd",
                "&:hover": { backgroundColor: accentColor },
                height: { xs: "50px", sm: "75px", md: "50px" },
                margin: { xs: "1vh 5vw", sm: "1vh 1vw" },
                width: { xs: "30vw", sm: "10vw" },
                fontSize: 'calc(0.5vw + 7px)'
              }}
            >
              SUMMARY
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                window.location.href = window.location.href;
              }}
              sx={{
                borderRadius: "0.7vw",
                border: `2px solid ${accentColor}`,
                color: "#ddd",
                "&:hover": { backgroundColor: accentColor },
                height: { xs: "50px", sm: "75px", md: "50px" },
                margin: { xs: "1vh 5vw", sm: "1vh 1vw" },
                width: { xs: "30vw", sm: "10vw" },
                fontSize: 'calc(0.5vw + 7px)'
              }}
            >
              RELOAD
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
                onKeyDown={handleMatchKeyDown("matchKey")}
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
      </Box>
    </Paper>
  );
}

// ================================
// Category Table
// ================================

const CategoryTable = ({ averages, headingColors = {} }) => {
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
                const subMetrics = importantMetrics[phase][metric] || [];
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
                const subMetrics = importantMetrics[phase][metric] || [];
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
                  const subMetrics = importantMetrics[phase][metric] || [];
                  return subMetrics.map(subMetric => {
                    const value = averages[robot]?.[phase]?.[metric]?.[subMetric];
                    const metricValue = averages[robot]?.[phase]?.[metric];
                    return (
                      <TableCell key={`${robot}-${metric}-${subMetric}`} sx={{
                        color: headingColors[metric] || "#fff",
                        backgroundColor: "#444",
                        border: `2px solid ${headingColors[metric] || "#fff"}`
                      }}>
                        {calculatedMetrics[metric]?.[subMetric] ? calculatedMetrics[metric][subMetric](averages[robot], phase) : formatValue(value, subMetric, 1)}
                      </TableCell>
                    )
                  });
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
          const calls = robots.map(async (robot) => {
          const robotParams = { ...params, robot };
          const res = await getReports(robotParams); // axios response
          if (res.status === 200) {
            return res.data;        // just the data
          } else {
            setError(`Could not find data for team ${robot}`);
            return null;            // or throw, depending on your needs
          }
        });

        // Wait for all requests to finish
        const results = await Promise.all(calls);

        // Filter out nulls / failures
        const responses = results.filter(Boolean); // array of data objects

        // Now combine
        const combinedAverages = {};
        responses
          .flatMap(r => r.averages)     // because each r already is data
          .forEach(r => {
            const key = Object.keys(r)[0];
            combinedAverages[key] = r[key];
          });

        const combinedReports = responses.flatMap(r => r.reports);

        console.log("combined", combinedAverages, combinedReports);
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

  const handleMatchKeyDown = (type) => (e) => {
    if (e.key === "Enter") {
      const url = new URL(window.location.href);
      const urlParams = url.searchParams;

      navigate(`/matches?eventKey=${urlParams.get("eventKey")}&matchKey=${matchKeySearchTerm}`);
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
  };

  return (
    <div style={{ color: "#E0E0E0", width: "100%", backgroundColor: "#11181a" }}>
      <RenderTopBar
        matchKeySearchTerm={matchKeySearchTerm}
        robotSearchTerm={robotSearchTerm}
        setMatchKeySearchTerm={setMatchKeySearchTerm}
        setRobotSearchTerm={setRobotSearchTerm}
        handleMatchKeyDown={handleMatchKeyDown}
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
          <ViewIndividualReports reports={reportData.reports} averages={reportData.averages}/>
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
