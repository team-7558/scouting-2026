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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RequiredParamsDialog from "../Common/RequiredParamsDialog";
import ReportsList from "./ReportsList";
import { getReports } from "../../requests/ApiRequests";

const ViewReports = ({
  requiredParamKeys = ["eventKey", "robot", "matchKey"],
}) => {
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

  // Fetch reports when parameters are provided.
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
  }, [paramsProvided, searchParams, requiredParamKeys]);

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
            <ReportsList data={reportData} />
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

export default ViewReports;
