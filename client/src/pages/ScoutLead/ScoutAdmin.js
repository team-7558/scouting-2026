import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getReports } from "../../requests/ApiRequests";

import RequiredParamsDialog from "../Common/RequiredParamsDialog";

import { LinearProgress } from "@mui/material";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

const ScoutAdmin = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [paramsProvided, setParamsProvided] = useState(false);
    const eventKey = searchParams.get("eventKey");
    const [robotData, setRobotData] = useState(null);
    const [error, setError] = useState(null);

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
    const numMatchesScouted = {}
    if (robotData){
      for (const report of robotData.reports){
        if (!numMatchesScouted[report.scout_name]){
          numMatchesScouted[report.scout_name] = 1;
        } else{
          numMatchesScouted[report.scout_name]++;
        }
      }
    }
    return numMatchesScouted || {};
  }

  const sortedNumMatchesScouted = Object.entries(getNumMatchesScouted()).sort(([, valueA], [, valueB]) => valueB - valueA);

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
  } else if (error){
    return (
        <center style={{marginTop: "5vh"}}>
            <h1 style={{color: "red"}}>{error}</h1>
        </center>
    )
  } else if (robotData){
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
                  NAME
                </TableCell>
                <TableCell>
                  NUMBER OF MATCHES
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedNumMatchesScouted.map(([key, value]) => (
                <TableRow key={key} sx={{height: '5vh'}}>
                  <TableCell sx={{paddingLeft: '2vw'}}>
                    {key}
                  </TableCell>
                  <TableCell sx={{paddingLeft: '2vw'}}>
                    {value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      <ol>
        
      </ol>
    </div>
    )
  }
  return (
    <LinearProgress sx={{
        marginTop: "5vh",
        marginLeft: "5vh",
        marginRight: "5vh",
    }}
    />
  );
};

export default ScoutAdmin;
