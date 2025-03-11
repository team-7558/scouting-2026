import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getReports } from "../../requests/ApiRequests";

import RequiredParamsDialog from "../Common/RequiredParamsDialog";
import ReportsList from "./ReportsList";

import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Select,
  LinearProgress,
  formLabelClasses,
} from "@mui/material";
import { Input, Menu } from "@mui/material";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

const Overview = () => {
    const [robotData, setRobotData] = useState(null);
    const [paramsProvided, setParamsProvided] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [error, setError] = useState(null);
    const [formula, setFormula] = useState("");
    const SEARCH_FILTERS = {
        AUTO_POINTS: "AUTO_POINTS",
        TELE_POINTS: "TELE_POINTS",
        // HANG: "HANG",
        // CORAL_POINTS: "CORAL_POINTS",
        // ALGAE_POINTS: "ALGAE_POINTS",
        // HANG_POINTS: "HANG_POINTS",
        // CORAL_ACCURACY: "CORAL_ACCURACY",
        // ALGAE_ACCURACY: "ALGAE_ACCURACY",
        DEFENSE_TIME: "DEFENSE_TIME",
        // FOUL_COUNT: "FOUL_COUNT",
        // PIN_COUNT: "PIN_COUNT"
    };
    const [searchFilter, setSearchFilter] = useState(SEARCH_FILTERS.AUTO_POINTS);
    const [teamsList, setTeamsList] = useState([]);
    const [helpOpen, setHelpOpen] = useState(false);

    const SEARCH_FILTER_VALUES = {
        AUTO_POINTS: {
            function: (robot) => {
              return (
                ['L1', 'L2', 'L3', 'L4'].reduce((prevValue, level, index) => prevValue + robot.auto.coral[level][1]*[3, 4, 6, 7][index], 0) + 
                ['scoredNetCount', 'scoredProcessorCount'].reduce((prevValue, level, index) => prevValue + robot.auto.algae[level][1]*[4, 6][index], 0)
              )
            }
        },
        TELE_POINTS: {
            function: (robot) => {
              return (
                ['L1', 'L2', 'L3', 'L4'].reduce((prevValue, level, index) => prevValue + robot.tele.coral[level][1]*[2, 3, 4, 5][index], 0) + 
                ['scoredNetCount', 'scoredProcessorCount'].reduce((prevValue, level, index) => prevValue + robot.tele.algae[level][1]*[4, 6][index], 0)
              )
            }
        },
        // HANG: {
        //     function: (robot) => (robot.tele.hang.deepHangs[0]>0) ? 2 : (robot.tele.hang.shallowHangs[0]>0) ? 1 : 0
        // },
        // CORAL_POINTS: {
        //     function: (robot) => getAvg(robot.auto.coral.totalPoints) + getAvg(robot.tele.coral.totalPoints)
        // },
        // ALGAE_POINTS: {
        //     function: (robot) => getAvg(robot.auto.algae.totalPoints) + getAvg(robot.tele.algae.totalPoints)
        // },
        // HANG_POINTS: {
        //     function: (robot) => getAvg(robot.tele.hang.totalPoints)
        // },
        // CORAL_ACCURACY: {
        //     function: (robot) => ((getAvg(robot.auto.coral.scoredCount)/getAvg(robot.auto.coral.attainedCount)) + (getAvg(robot.tele.coral.scoredCount)/getAvg(robot.tele.coral.attainedCount)))*50
        // },
        // ALGAE_ACCURACY: {
        //     function: (robot) => ((getAvg(robot.auto.algae.scoredCount)/getAvg(robot.auto.algae.attainedCount)) + (getAvg(robot.tele.algae.scoredCount)/getAvg(robot.tele.algae.attainedCount)))*50
        // },
        DEFENSE_TIME: {
            function: (robot) => robot.tele.contact.totalTime[1]/1000
        },
        // FOUL_COUNT: {
        //     function: (robot) => getAvg(robot.tele.contact.foulCount)
        // },
        // PIN_COUNT: {
        //     function: (robot) => getAvg(robot.tele.contact.pinCount)
        // }
    }

    const eventKey = searchParams.get("eventKey");

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
        setRobotData(response.data.averages); // Store fetched data in state
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

  //when data or searchfilter changes, re-filter the teams
  useEffect(() => {
    if (robotData) {
      if (SEARCH_FILTER_VALUES[searchFilter]){
        const newTeamsList = {};
        for (let team in robotData) {
          if (SEARCH_FILTER_VALUES[searchFilter]) {
            newTeamsList[team] = SEARCH_FILTER_VALUES[searchFilter].function(
              robotData[team]
            );
          } else {
            console.log(searchFilter, " not found");
          }
        }
        console.log("newTeamsList: ", newTeamsList);
        setTeamsList(newTeamsList);
      } else{
        const newTeamsList = {};
        function evaluateExpression(robot, formula) {
          return new Function('robot', 'return ' + formula)(robot);
         }

        for (let team in robotData) {
          try{
            newTeamsList[team] = evaluateExpression(robotData[team], searchFilter);
          } catch (error){
            setError(error.message);
            break;
          }
        }
        console.log("newTeamsList: ", newTeamsList);
        setTeamsList(newTeamsList);
      }
    }
  }, [searchFilter, robotData]);

  if (robotData && !error && paramsProvided) {
    //main
    return (
      <>
        <center>
          <h3>CUSTOM FILTER</h3>
        </center>
        <center>
          <TextField
            onChange={(e) => setFormula(e.target.value)}
            sx={{
              marginBottom: '1vh',
              width: '80vw',
            }}
          >
          </TextField>
        </center>
        <center>
          <Button onClick={() => setSearchFilter(formula)} variant="contained" sx={{margin: '1vw'}}>
            ENTER
          </Button>
          <Button onClick={() => setHelpOpen(!helpOpen)} variant="contained">
            HELP
          </Button>
        </center>

        <Drawer open={helpOpen} onClose={() => setHelpOpen(false)}>
          <>
          <div style={{fontFamily: 'Roboto, sans-serif', padding: '3vw', backgroundColor: '#f5f5f5'}}>
            <Typography variant="h4" style={{marginBottom: '12px'}}>Data Structure Reference</Typography>

            <Paper elevation={3} style={{marginBottom: '3vw', padding: '2vw', borderRadius: '1vw'}}>
              <Typography variant="h5">Top-Level</Typography>
              <ul style={{listStyleType: 'disc', paddingLeft: '20px', marginTop: '0', marginBottom: '0'}}>
                {['defense_skill', 'disabled', 'driver_skill'].map(value => (
                  <li key={value}>{value}</li>))}
              </ul>
              <Typography variant="h5">Game Phase Data</Typography>
              {[['algae - auto, tele', ['attainedCount', 'avgScoringCycleTime', 'droppedCount', 'scoredCount', 'scoredNetCount', 'scoredOpponentProcessorCount', 'scoredProcessorCount', 'scoringRate']],
                ['coral - auto, tele', ['L1', 'L2', 'L3', 'L4', 'attainedCount', 'avgScoringCycleTime', 'droppedCount', 'scoredCount', 'scoringRate']],
                ['movement - auto', ['movementRate', 'movementTime']],
                ['contact - tele', ['foulCount', 'pinCount', 'totalTime']],
                ['defense - tele', ['totalTime']],
                ['hang - tele', ['cycleTime', 'deepHangs', 'parks', 'shallowHangs', 'startTime']]].map(([category, items]) => (
                <div key={category} style={{marginLeft: '1vw'}}>
                  <Typography variant="h6">{category}</Typography>
                  <ul style={{listStyleType: 'circle', paddingLeft: '3vw', marginTop: '0', marginBottom: '0'}}>
                    {items.map(item => (<li key={item}>{item}</li>))}
                  </ul>
                </div>))}
            </Paper>
          </div>
        </>
        </Drawer>
        
        {/* search filters dropdown */}
        <FormControl sx={{ width: "70%", marginTop: "2%", marginLeft: "15%" }}>
          <Select
            value={searchFilter}
            label="Age"
            onChange={(e) => setSearchFilter(e.target.value)}
            sx={{
              color: "black",
              fontSize: 30, // Text color inside Select
              ".MuiOutlinedInput-notchedOutline": {
                borderColor: "black", // Border color of the Select
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "darkgrey", // Border color on hover
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "darkgrey", // Border color when focused
              },
            }}
          >
            {Object.keys(SEARCH_FILTERS).map((key) => (
              <MenuItem key={key} value={SEARCH_FILTERS[key]}>
                {SEARCH_FILTERS[key].replaceAll("_", " ")}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Table
          aria-label="basic table"
          sx={{
            width: "90vw",
            marginLeft: "5vw",
            marginTop: "4vw",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: 40 }}>TEAM</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 40 }}>
                {searchFilter.replaceAll("_", " ")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(teamsList)
              .sort((a, b) => {
                return b[1] - a[1];
              })
              .map((value) => (
                <TableRow
                  key={value[0]}
                  sx={{
                    backgroundColor: "rgba(138, 138, 138, 0.05)",
                    "&:nth-of-type(even)": {
                      backgroundColor: "rgba(0, 0, 0, 0.05)",
                    },
                  }}
                >
                  <TableCell sx={{ fontSize: 30 }}>{value[0]}</TableCell>
                  <TableCell sx={{ fontSize: 30 }}>
                    {Math.round(value[1] * 10) / 10}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </>
    );
  } else if (!paramsProvided) {
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
    return (<>
        <center style={{marginTop: "5vh"}}>
            <h1 style={{color: "red"}}>{error}</h1>
        </center>
        <center>
          <Button variant="contained" onClick={() => setError(null)}>CLEAR ERROR</Button>
        </center>
    </>)
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

export default Overview;
