import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getReports } from "../../requests/ApiRequests";

import RequiredParamsDialog from "../Common/RequiredParamsDialog";

import { LinearProgress } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Collapse from "@mui/material/Collapse";

const ScoutAdmin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [paramsProvided, setParamsProvided] = useState(false);
  const eventKey = searchParams.get("eventKey");
  const [robotData, setRobotData] = useState(null);
  const [error, setError] = useState(null);
  const [openRow, setOpenRow] = useState(null);

  //update paramsprovided based on params
  useEffect(() => {
    const eventKey = searchParams.get("eventKey");
    if (eventKey) {
      setParamsProvided(true);
    } else {
      setParamsProvided(false);
    }
  }, [eventKey]);

  const handleDialogSubmit = (values) => {
    const currentParams = {};
    for (const key of searchParams.keys()) {
      currentParams[key] = searchParams.get(key);
    }
    setSearchParams({ ...currentParams, ...values });
  };

  //fetch the data from server when params change
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("fetching raw data");
        const response = await getReports({ eventKey: eventKey });
        setRobotData(response.data); // Store fetched data in state
        console.log("raw data", response.data);
      } catch (error) {
        console.error("Error fetching robot data:", error);
        setError(error.message);
      }
    };
    if (paramsProvided) {
      fetchData();
    }
  }, [paramsProvided]);

  const getNumMatchesScouted = () => {
    const numMatchesScouted = {};
    const scoutComments = {};
    if (robotData) {
      for (const report of robotData.reports) {
        if (!numMatchesScouted[report.scout_name]) {
          numMatchesScouted[report.scout_name] = 1;
        } else {
          numMatchesScouted[report.scout_name]++;
        }
        if (!scoutComments[report.scout_name]) {
          scoutComments[report.scout_name] = [];
        }
        scoutComments[report.scout_name].push({
          comment: report.comments,
          team: report.robot,
          match: report.match_key,
        });
      }
    }
    return { numMatchesScouted, scoutComments };
  };

  const { numMatchesScouted, scoutComments } = getNumMatchesScouted();
  let sortedNumMatchesScouted = [];
  console.log("nummatchesscouted", numMatchesScouted);
  if (numMatchesScouted) {
    sortedNumMatchesScouted = Object.entries(numMatchesScouted).sort(
      ([, valueA], [, valueB]) => valueB - valueA
    );
  }

  if (!paramsProvided) {
    //params not provided dialog
    return (
      <RequiredParamsDialog
        open={true}
        onSubmit={handleDialogSubmit}
        searchParams={searchParams}
        searchParamsError=""
        requiredParamKeys={["eventKey"]}
      />
    );
  } else if (error) {
    return (
      <center style={{ marginTop: "5vh" }}>
        <h1 style={{ color: "red" }}>{error}</h1>
      </center>
    );
  } else if (robotData && sortedNumMatchesScouted) {
    return (
      <div>
        <center>
          <h1>Scouts</h1>
        </center>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>NAME</b>
                </TableCell>
                <TableCell>
                  <b>NUMBER OF MATCHES</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {console.log("sortednummatchesscouted", sortedNumMatchesScouted)}
              {sortedNumMatchesScouted.map(([key, value]) => (
                <>
                  <TableRow
                    key={key}
                    sx={{ height: "5vh", cursor: "pointer" }}
                    onClick={() => setOpenRow(key === openRow ? null : key)}
                  >
                    <TableCell sx={{ paddingLeft: "2vw" }}>{key}</TableCell>
                    <TableCell sx={{ paddingLeft: "2vw" }}>{value}</TableCell>
                  </TableRow>
                  <Collapse in={openRow === key} timeout="auto" unmountOnExit>
                    {scoutComments[key].map((obj, index) => {
                      return (
                        <>
                          <center>
                            <h3>
                              {obj.team}: {obj.match}
                            </h3>
                          </center>
                          <p style={{ margin: "0vw 2vw" }}>{obj.comment}</p>
                          <br />
                        </>
                      );
                    })}
                  </Collapse>
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <ol></ol>
      </div>
    );
  }
  return (
    <LinearProgress
      sx={{
        marginTop: "5vh",
        marginLeft: "5vh",
        marginRight: "5vh",
      }}
    />
  );
};

export default ScoutAdmin;
