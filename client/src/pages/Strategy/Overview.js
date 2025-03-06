import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getReports } from "../../requests/ApiRequests";

import RequiredParamsDialog from "../Common/RequiredParamsDialog";
import ReportsList from "./ReportsList";

import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Select
  } from '@mui/material';
import { Input, Menu } from "@mui/material";
import { styled } from '@mui/system';

import {
    GAME_PIECES,
    CYCLE_TYPES,
    HANG_RESULTS,
    DEPOSIT_TYPE,
    AUTO_MAX_TIME,
    GAME_LOCATIONS
  } from "./../ScoutMatch/Constants.js";

const Overview = () => {
    const [robotData, setRobotData] = useState(null);
    const [paramsProvided, setParamsProvided] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [parsedData, setParsedData] = useState({});
    const SEARCH_FILTERS = {
        POINTS: "POINTS", 
        AUTO_POINTS: "AUTO_POINTS",
        TELE_POINTS: "TELE_POINTS",
        HANG: "HANG",
        CORAL_POINTS: "CORAL_POINTS",
        ALGAE_POINTS: "ALGAE_POINTS",
        HANG_POINTS: "HANG_POINTS",
        CORAL_ACCURACY: "CORAL_ACCURACY",
        ALGAE_ACCURACY: "ALGAE_ACCURACY",
        DEFENSE_TIME: "DEFENSE_TIME",
        FOUL_COUNT: "FOUL_COUNT",
        PIN_COUNT: "PIN_COUNT"
    };
    const [searchFilter, setSearchFilter] = useState(SEARCH_FILTERS.POINTS);
    const [teamsList, setTeamsList] = useState([]);

    const getAvg = (val) => {
        return val[0]/val[1]
    }

    const SEARCH_FILTER_VALUES = {
        POINTS: {
            function: (robot) => getAvg(robot.totalPoints)
        },
        AUTO_POINTS: {
            function: (robot) => getAvg(robot.auto.totalPoints)
        },
        TELE_POINTS: {
            function: (robot) => getAvg(robot.tele.totalPoints)
        },
        HANG: {
            function: (robot) => (robot.tele.hang.deepHangs[0]>0) ? 2 : (robot.tele.hang.shallowHangs[0]>0) ? 1 : 0
        },
        CORAL_POINTS: {
            function: (robot) => getAvg(robot.auto.coral.totalPoints) + getAvg(robot.tele.coral.totalPoints)
        },
        ALGAE_POINTS: {
            function: (robot) => getAvg(robot.auto.algae.totalPoints) + getAvg(robot.tele.algae.totalPoints)
        },
        HANG_POINTS: {
            function: (robot) => getAvg(robot.tele.hang.totalPoints)
        },
        CORAL_ACCURACY: {
            function: (robot) => ((getAvg(robot.auto.coral.scoredCount)/getAvg(robot.auto.coral.attainedCount)) + (getAvg(robot.tele.coral.scoredCount)/getAvg(robot.tele.coral.attainedCount)))*50
        },
        ALGAE_ACCURACY: {
            function: (robot) => ((getAvg(robot.auto.algae.scoredCount)/getAvg(robot.auto.algae.attainedCount)) + (getAvg(robot.tele.algae.scoredCount)/getAvg(robot.tele.algae.attainedCount)))*50
        },
        DEFENSE_TIME: {
            function: (robot) => getAvg(robot.tele.defense.totalTime)/1000
        },
        FOUL_COUNT: {
            function: (robot) => getAvg(robot.tele.contact.foulCount)
        },
        PIN_COUNT: {
            function: (robot) => getAvg(robot.tele.contact.pinCount)
        }
    }

    const eventKey = searchParams.get('eventKey');

    //update paramsprovided based on params
    useEffect(() => {
        const eventKey = searchParams.get('eventKey');
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
            }
          };
          if (paramsProvided){
            fetchData();
          }
    }, [paramsProvided]);

    //calculate points given one report
    const calculatePoints = (report) => {
        let totalPoints = 0;
        let autoPoints = 0;
        let telePoints = 0;
        let autoCoralPoints = 0;
        let autoAlgaePoints = 0;
        let teleCoralPoints = 0;
        let teleAlgaePoints = 0;
        let hangPoints = 0;
        let deepCage = false;
        let shallowCage = false;

        report.cycles.forEach(cycle => {
            switch (cycle.type) {
                case CYCLE_TYPES.CORAL: {
                    let pointValues = {};
                    if (cycle.end_time <= AUTO_MAX_TIME) {
                        pointValues = {"L4": 7, "L3": 6, "L2": 4, "L1": 3}; 
                        if (cycle.deposit_location?.slice(-2)) {
                            totalPoints += pointValues[cycle.deposit_location.slice(-2)] || 0;
                            autoPoints += pointValues[cycle.deposit_location.slice(-2)] || 0;
                            autoCoralPoints += pointValues[cycle.deposit_location.slice(-2)] || 0;
                        }
                    } else {
                        pointValues = {"L4":5, "L3": 4, "L2": 3, "L1": 2}; 
                          if (cycle.deposit_location?.slice(-2)) {
                            totalPoints += pointValues[cycle.deposit_location.slice(-2)] || 0;
                            telePoints += pointValues[cycle.deposit_location.slice(-2)] || 0;
                            teleCoralPoints += pointValues[cycle.deposit_location.slice(-2)] || 0;
                        }
                    }
                    
                    break;
                }

                case CYCLE_TYPES.ALGAE: {
                    let points = 0;
                    if (cycle.deposit_location === GAME_LOCATIONS.NET) {
                        points = 4;
                    } else if (cycle.deposit_location === GAME_LOCATIONS.PROCESSOR) {
                        points = 6;
                    }
                    totalPoints += points;
                    if (cycle.end_time <= AUTO_MAX_TIME){
                        autoPoints += points;
                        autoAlgaePoints += points;
                    } else{
                        telePoints += points;
                        teleAlgaePoints += points;
                    }
                    break;
                }

                case CYCLE_TYPES.HANG: {
                    if (cycle.result === HANG_RESULTS.PARK) {
                        totalPoints += 2;
                        hangPoints += 2;
                    } else if (cycle.result === HANG_RESULTS.SHALLOW) {
                        totalPoints += 6;
                        hangPoints += 6;
                        shallowCage = true;
                    } else if (cycle.result === HANG_RESULTS.DEEP) {
                        totalPoints += 12;
                        hangPoints += 12;
                        deepCage = true;
                    }
                        break;
                    }

                default: {
                    break;
                }
            }
        });
        return {totalPoints, autoPoints, telePoints, autoCoralPoints, autoAlgaePoints, teleCoralPoints, teleAlgaePoints, hangPoints, shallowCage, deepCage};
    }

    //given a report and robot it adds report values to the robot
    function addReportTotalsToRobot(robot, report, {
        totalPoints, 
        autoPoints, 
        telePoints, 
        coralPoints, 
        algaePoints, 
        hangPoints, 
        shallowCage, 
        deepCage
    }) {
        // Ensure that robot.algae, robot.contact, robot.coral, robot.defense, and robot.hang exist as objects
        // Create or initialize groups on the robot object if they don't exist
        if (!robot.algae) {
          robot.algae = {};
        }
        if (!robot.contact) {
          robot.contact = {};
        }
        if (!robot.coral) {
          robot.coral = {};
        }
        if (!robot.defense) {
          robot.defense = {};
        }
        if (!robot.hang) {
          robot.hang = {};
        }
        // Loop through each group in the report totals
        for (const group in report.totals) {
          if (report.totals.hasOwnProperty(group)) {  // Ensure the property belongs to the object itself
            const groupData = report.totals[group];
      
            // Loop through each metric within the group
            for (const metric in groupData) {
              if (groupData.hasOwnProperty(metric)) {  // Ensure the property belongs to the object itself
                const value = groupData[metric];
      
                // Ensure that the robot object has this specific metric initialized
                if (!robot[group][metric]) {
                  robot[group][metric] = [0, 0];  // Initialize as [total, count]
                }
                // Only adds to the total if the value exists.
                if (value != null) {
                  robot[group][metric][0] += value;
                  robot[group][metric][1]++;
                }
              }
            }
          }
        }

        const addValueToRobot = (robot, update, value, value2) => {
            if (value2){
                if (!robot[value][value2]){
                    robot[value][value2] = [0, 0]
                }
                robot[value][value2][0] += update;
                robot[value][value2][1]++;
            } else {
                if (!robot[value]){
                    robot[value] = [0, 0]
                }
                robot[value][0] += update;
                robot[value][1]++;
            }
        }

        addValueToRobot(robot, totalPoints, "totalPoints");
        addValueToRobot(robot, autoPoints, "autoPoints");

      
        return robot;
    }

    function addTotalsToRobot(totals, robot) {
        for (let key in robot) {
            if (typeof robot[key] === 'object' && robot[key] !== null && !Array.isArray(robot[key])) {
                totals[key] = totals[key] || {};
                addTotalsToRobot(totals[key], robot[key]);
        } else {
            if (!totals[key] || !Array.isArray(totals[key])) {
                totals[key] = [0, 0];
            }
            if (typeof robot[key] === 'number') {
                totals[key][0] += robot[key];
                totals[key][1]++;
            }
          }
        }
        return totals;
      }
      
      

    //calls calculatepoints and addtotalstorobot to parse the server data
    const parseData = (reports) => {
        let parsedData = {};

        reports.forEach(report => {
            const {totalPoints, 
                autoPoints, 
                telePoints, 
                autoCoralPoints, 
                autoAlgaePoints, 
                teleCoralPoints, 
                teleAlgaePoints, 
                hangPoints, 
                shallowCage, 
                deepCage
            } = calculatePoints(report);
            if (!parsedData[report.robot]){
                parsedData[report.robot] = {}
            } 
            function updateValue(path, value) {
                const keys = path.split('.');
                let current = parsedData[report.robot];
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) current[keys[i]] = {};
                    current = current[keys[i]];
                }
                const lastKey = keys[keys.length - 1];
                if (!Array.isArray(current[lastKey]) || current[lastKey].length !== 2) {
                    current[lastKey] = [0, 0];
                }
                current[lastKey][0] += value;
                current[lastKey][1]++;
            }
            
            parsedData[report.robot] = addTotalsToRobot(parsedData[report.robot], report.totals);
            
            updateValue('totalPoints', totalPoints);
            updateValue('tele.totalPoints', telePoints);
            updateValue('auto.totalPoints', autoPoints);
            updateValue('tele.coral.totalPoints', teleCoralPoints);
            updateValue('auto.coral.totalPoints', autoCoralPoints);
            updateValue( 'tele.algae.totalPoints', teleAlgaePoints);
            updateValue('auto.algae.totalPoints', autoAlgaePoints);
            updateValue('tele.hang.totalPoints', hangPoints);
            
            // For boolean values, we'll set the first element to 1 if true, 0 if false
            updateValue('tele.hang.shallowHangs', shallowCage ? 1 : 0);
            updateValue( 'tele.hang.deepHangs', deepCage ? 1 : 0);
            

        });
        return parsedData;
    }

    //call parseData when server data changes
    useEffect(() => {
        if (!robotData) return;
        setParsedData(parseData(robotData.reports));
    }, [robotData]);

    //when data or searchfilter changes, re-filter the teams
    useEffect(() => {
        console.log("parsedData: ", parsedData);
        if (parsedData){
            const newTeamsList = {}
            for (let team in parsedData){
                if (SEARCH_FILTER_VALUES[searchFilter]){
                    newTeamsList[team] = SEARCH_FILTER_VALUES[searchFilter].function(parsedData[team]);
                }else{
                    console.log(searchFilter, " not found");
                }
                
            }
            console.log("newTeamsList: ", newTeamsList);
            setTeamsList(newTeamsList);
        }
    }, [searchFilter, parsedData]);
    
    if (robotData){ //main
        return (<>
            {/* search filters dropdown */}
            <FormControl sx={{width: '70%', marginTop: '2%', marginLeft: '15%'}}>
                <Select
                    value={searchFilter}
                    label="Age"
                    onChange={(e) => setSearchFilter(e.target.value)}
                    sx={{
                        color: 'white',
                        fontSize: 30, // Text color inside Select
                        '.MuiOutlinedInput-notchedOutline': {
                          borderColor: 'white', // Border color of the Select
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'lightgray', // Border color on hover
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'white', // Border color when focused
                        },
                      }}
                >
                    {Object.keys(SEARCH_FILTERS).map((key) => (
                        <MenuItem key={key} value={SEARCH_FILTERS[key]}>{SEARCH_FILTERS[key].replaceAll("_", " ")}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Table aria-label="basic table" sx={{
                width: '90vw',
                marginLeft: '5vw',
                marginTop: '4vw'
            }}>
                <TableHead>
                <TableRow>
                    <TableCell sx={{fontWeight: 700, fontSize: 40}}>TEAM</TableCell>
                    <TableCell sx={{fontWeight: 700, fontSize: 40}}>{searchFilter.replaceAll("_", " ")}</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                    {Object.entries(teamsList).sort((a, b) => {
                        return b[1] - a[1]
                            }).map((value) => (
                                <TableRow 
                                    key={value[0]}
                                    sx={{
                                        backgroundColor: 'rgba(138, 138, 138, 0.05)',
                                        '&:nth-of-type(even)': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                        },
                                    }}
                                >
                                    <TableCell sx={{fontSize: 30}}>
                                        {value[0]}
                                    </TableCell>
                                    <TableCell sx={{fontSize: 30}}>
                                        {Math.round(value[1]*10)/10}
                                    </TableCell>
                                </TableRow>
                            ))}
                </TableBody>
            </Table>
        </>);
    } else if (!paramsProvided){ //params not provided dialog
        return(
            <RequiredParamsDialog
                open={true}
                onSubmit={handleDialogSubmit}
                searchParams={searchParams}
                searchParamsError=""
                requiredParamKeys={["eventKey"]}
            />
        );
    }
    return ( //loading dialog
        <p>STILL LOADING</p>
    )
    
}

export default Overview;