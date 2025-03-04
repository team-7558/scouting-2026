import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getReports } from "../../requests/ApiRequests";

import RequiredParamsDialog from "../Common/RequiredParamsDialog";
import ReportsList from "./ReportsList";

import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
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
        CORAL_SCORED: "CORAL_SCORED",
        CORAL_CYCLE_TIME: "CORAL_CYCLE_TIME",
        CORAL_ACCURACY: "CORAL_ACCURACY",
        ALGAE_SCORED: "ALGAE_SCORED",
        ALGAE_CYCLE_TIME: "ALGAE_CYCLE_TIME",
        ALGAE_ACCURACY: "ALGAE_ACCURACY"
    };
    const [searchFilter, setSearchFilter] = useState(SEARCH_FILTERS.POINTS);
    const [teamsList, setTeamsList] = useState([]);

    const SEARCH_FILTER_VALUES = {
        POINTS: {
            function: (robot) => robot.points[0]/robot.points[1]
        },
        CORAL_SCORED: {
            function: (robot) => robot.coral.scoredCount[0]/robot.coral.scoredCount[1]
        },
        CORAL_CYCLE_TIME: {
            function: (robot) => (robot.coral.avgScoringCycleTime[0]/robot.coral.avgScoringCycleTime[1]) / 1000
        },
        CORAL_ACCURACY: {
            function: (robot) => ((robot.coral.scoredCount[0]/robot.coral.scoredCount[1]) / (robot.coral.attainedCount[0]/robot.coral.attainedCount[1]))*100
        },
        ALGAE_SCORED: {
            function: (robot) => robot.algae.scoredCount[0]/robot.algae.scoredCount[1]
        },
        ALGAE_CYCLE_TIME: {
            function: (robot) => (robot.algae.avgScoringCycleTime[0]/robot.algae.avgScoringCycleTime[1]) / 1000
        },
        ALGAE_ACCURACY: {
            function: (robot) => ((robot.algae.scoredCount[0]/robot.algae.scoredCount[1]) / (robot.algae.attainedCount[0]/robot.algae.attainedCount[1]))*100
        },
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
        report.cycles.forEach(cycle => {
            switch (cycle.type) {
                case CYCLE_TYPES.CORAL: {
                    let pointValues = {};
                    if (cycle.end_time <= AUTO_MAX_TIME) {
                        pointValues = { 
                          "L4": 7, "L3": 6, "L2": 4, "L1": 3
                        }; 
                    } else {
                        pointValues = { 
                            "L4":5, "L3": 4, "L2": 3, "L1": 2
                          }; 
                    }
                    if (cycle.deposit_location?.slice(-2)) {
                        totalPoints += pointValues[cycle.deposit_location.slice(-2)] || 0;
                    }
                    break;
                }

                case CYCLE_TYPES.ALGAE: {
                    if (cycle.deposit_location === GAME_LOCATIONS.NET) {
                        totalPoints += 4;
                    } else if (cycle.deposit_location === GAME_LOCATIONS.PROCESSOR) {
                        totalPoints += 6; 
                    }
                    break;
                }

                case CYCLE_TYPES.HANG: {
                    if (cycle.result === HANG_RESULTS.PARK) {
                        totalPoints += 2;
                    } else if (cycle.result === HANG_RESULTS.SHALLOW) {
                        totalPoints += 6;
                    } else if (cycle.result === HANG_RESULTS.DEEP) {
                        totalPoints += 12;
                    }
                        break;
                    }

                default: {
                     break;
                }
            }
        });
        return totalPoints;
    }

    //given a report and robot it adds report values to the robot
    function addReportTotalsToRobot(robot, report, points) {
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
        if (!robot.points){
            robot.points = [0, 0]
        }
        robot.points[0] += points;
        robot.points[1]++;
      
        return robot;
    }

    //calls calculatepoints and addreporttotalstorobot to parse the server data
    const parseData = (reports) => {
        let parsedData = {};

        reports.forEach(report => {
            const points = calculatePoints(report);
            if (!parsedData[report.robot]){
                parsedData[report.robot] = {}
            } 
            addReportTotalsToRobot(parsedData[report.robot], report, points);
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

    const StyledPaper = styled(Paper)(({ theme }) => ({
        padding: theme.spacing(2), // Increased padding
        marginBottom: theme.spacing(1), // Added spacing between items
        backgroundColor: theme.palette.grey[700], // Slightly lighter background for contrast
        borderRadius: theme.shape.borderRadius, // Rounded corners for a softer look
        transition: 'transform 0.2s ease-in-out', // Subtle hover effect
        '&:hover': {
          transform: 'scale(1.02)',
        },
      }));
    
    // const TeamCard = ({team, value}) => {
    //     return(
    //         <StyledPaper 
    //             variant="elevation"
    //             elevation={15}
    //             sx={{
    //                 marginTop: '2%',
    //                 height: '7vh',
    //                 display: 'flex',
    //                 alignItems: 'center',
    //                 width: '90vw',
    //                 marginLeft: '5vw'
    //             }}
    //         >
    //             <Typography variant="h4" component="h3" sx={{marginLeft: '2%'}}> 
    //                 <span style={{color: 'red'}}>{team}</span>: {value}
    //             </Typography>
    //         </StyledPaper>
    //     );
    // }
    
    if (robotData){ //main
        return (<>
            {/* search filters dropdown */}
            <FormControl sx={{width: '70%', marginTop: '2%', marginLeft: '15%'}}>
                <InputLabel sx={{
                    transform: 'translate(5px, -16px) scale(0.75)', // Adjust these values
                }}>
                    SEARCH FILTER
                </InputLabel>
                <Select
                    value={searchFilter}
                    label="Age"
                    onChange={(e) => setSearchFilter(e.target.value)}
                    sx={{
                        color: 'white', // Text color inside Select
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
                    <TableCell sx={{fontWeight: 900, fontSize: 40}}>Team</TableCell>
                    <TableCell sx={{fontWeight: 900, fontSize: 40}}>{searchFilter.replaceAll("_", " ")}</TableCell>
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
                                        '&:nth-of-type(even)': {  // Select even rows
                                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                        },
                                    }}
                                >
                                    <TableCell sx={{fontSize: 20}}>
                                        {value[0]}
                                    </TableCell>
                                    <TableCell sx={{fontSize: 20}}>
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