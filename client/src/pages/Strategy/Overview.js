import React, { useState, useEffect } from "react";
import { getReports } from "../../requests/ApiRequests";

import { Box, Typography, Grid, Icon } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; //Example Icons
import StarIcon from '@mui/icons-material/Star';

import {
    GAME_PIECES,
    CYCLE_TYPES,
    HANG_RESULTS,
    DEPOSIT_TYPE,
    AUTO_MAX_TIME,
    GAME_LOCATIONS
  } from "./../ScoutMatch/Constants.js";

console.log("overview loaded");

const Overview = () => {
    const [robotData, setRobotData] = useState(null);

    console.log("here");
    
    useEffect(() => {
        const fetchData = async () => {
            try {
              const response = await getReports({ eventKey: "2025week0" });
              setRobotData(response.data); // Store fetched data in state
              console.log(response.data);
              
            } catch (error) {
              console.error("Error fetching robot data:", error);
            }
          };
      
          fetchData();
    }, []);

    const calculateAverageTeamPoints = (reports) => {                
          
        const teamPoints = {};
    
        if (!reports || !Array.isArray(reports)) {
            return {};
        }
    
        reports.forEach(report => {
            if (!report || typeof report !== 'object' || !report.robot || typeof report.robot !== 'string') {
                return;
            }
    
            const teamNumber = report.robot;
            let totalPoints = 0;
    
            if (report.cycles && Array.isArray(report.cycles)) {
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
            }
    
            if (teamPoints[teamNumber]) {
                teamPoints[teamNumber].total += totalPoints;
                teamPoints[teamNumber].count += 1;
            } else {
                teamPoints[teamNumber] = { total: totalPoints, count: 1 };
            }
        });
    
        const averageTeamPoints = {};
        for (const team in teamPoints) {
            averageTeamPoints[team] = teamPoints[team].total / teamPoints[team].count;
        }
    
        return averageTeamPoints;
    };
    
    
    if (robotData){
        return (
            <ol>
              {Object.entries(calculateAverageTeamPoints(robotData.reports)).sort((a, b) => b[1]-a[1]).map(([key, value]) => (
                <li key={key}>{key}: {Math.round(value*10)/10}</li>
              ))}
            </ol>
          );
    }
    return (
        <p>STILL LOADING</p>
    )
    
}

export default Overview;