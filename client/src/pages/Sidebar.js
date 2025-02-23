import React, { useState } from "react";
import { Box, Button, Drawer, TextField } from "@mui/material";
import { DRIVER_STATIONS, PERSPECTIVE } from "./ScoutMatch/Constants.js";
import { useNavigate } from "react-router-dom";

const Sidebar = ({sidebarOpen, setSidebarOpen, scaleWidthToActual, scaleHeightToActual}) => {
    const navigate = useNavigate();
    const [teamNumber, setTeamNumber] = useState(0);
    const createButtonsFromList = (list, width, paramName, color) => {
        return (
            <Box key={JSON.stringify(list)}>
                {Object.keys(list).slice(0, 3).map((key) => {
                    return(
                        <Button 
                            key={list[key]}
                            sx={{
                                width: scaleWidthToActual(width) + "px", 
                                height: scaleHeightToActual(150) + "px",
                                color: color,
                            }}
                            onClick={() => {
                                let url = new URL(window.location);
                                url.searchParams.set(paramName, list[key]);
                                window.location = url;
                            }}
                        >
                            {list[key]}
                        </Button>
                    )
                })}
            </Box>
        )
    }
    return (
        <Drawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
            {[
                <center key="sidebarNameHeader">
                    <h3>NAME</h3>
                </center>,
                <center key="sidebarNameValue">
                    <Button variant="contained" onClick={() => navigate("/signIn")}>SIGN OUT</Button>
                </center>,
                <center key="sidebarStation">
                    <h3 key="sidebarStationHeading">STATION</h3>
                </center>,
                createButtonsFromList({R1: DRIVER_STATIONS.R1, R2: DRIVER_STATIONS.R2, R3: DRIVER_STATIONS.R3}, 500, 'station', 'red'),
                createButtonsFromList({B1: DRIVER_STATIONS.B1, B2: DRIVER_STATIONS.B2, B3: DRIVER_STATIONS.B3}, 500, 'station', 'blue'),
            
                <center key="sidebarPerspective">
                    <h3 key="sidebarPerspectiveHeading">PRESPECTIVE</h3>
                </center>,

                createButtonsFromList(PERSPECTIVE, 750, 'perspective', 'blue'),

                <center key="teamNumber">
                    <h3 key="teamNumberHeading">TEAM NUMBER</h3>
                </center>,
                <center key="sidebarTeamNumberCenter">
                    <TextField 
                        onChange={(e) => setTeamNumber(e.target.value)} 
                        label="Team Number" 
                        variant="outlined" 
                    />
                    <br />
                    <br />
                    <Button 
                        variant="contained" 
                        onClick={() => {
                            let url = new URL(window.location);
                            url.searchParams.set("teamNumber", teamNumber);
                            window.location = url;
                        }}
                    >
                        SUBMIT
                    </Button>
                </center>
        ]}
        </Drawer>
    )
}

export default Sidebar;