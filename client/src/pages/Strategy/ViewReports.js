import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Typography, Container, CircularProgress } from "@mui/material";
import RequiredParamsDialog from "../Common/RequiredParamsDialog";
import ReportsList from "./ReportsList";
import { getReports } from "../../requests/ApiRequests";

const ViewReports = ({ requiredParamKeys = ["eventKey", "robot"] }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [paramsProvided, setParamsProvided] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if all required params are present
  useEffect(() => {
    const allProvided = requiredParamKeys.every(
      (key) => searchParams.get(key) && searchParams.get(key).trim() !== ""
    );
    setParamsProvided(allProvided);
  }, [location.search, searchParams, requiredParamKeys]);

  // When parameters are provided, fetch reports from the API.
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");
      try {
        // Gather the query parameters for the API call.
        const params = {};
        requiredParamKeys.forEach((key) => {
          params[key] = searchParams.get(key);
        });
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

  const handleDialogSubmit = (values) => {
    const currentParams = {};
    for (const key of searchParams.keys()) {
      currentParams[key] = searchParams.get(key);
    }
    setSearchParams({ ...currentParams, ...values });
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        View Reports
      </Typography>
      {paramsProvided ? (
        <>
          <Typography variant="body1" gutterBottom>
            {requiredParamKeys.map((key) => (
              <span key={key}>
                {key}: {searchParams.get(key)}{" "}
              </span>
            ))}
          </Typography>
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
