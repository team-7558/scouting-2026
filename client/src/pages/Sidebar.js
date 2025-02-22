import React from "react";
import { Box, Button, Drawer } from "@mui/material";
import { DRIVER_STATIONS, PERSPECTIVE } from "./ScoutMatch/Constants.js";

const Sidebar = ({sidebarOpen, setSidebarOpen, scaleWidthToActual, scaleHeightToActual}) => {
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
                <center key="sidebarStation">
                    <h3 key="sidebarStationHeading">STATION</h3>
                </center>,
                createButtonsFromList({R1: DRIVER_STATIONS.R1, R2: DRIVER_STATIONS.R2, R3: DRIVER_STATIONS.R3}, 500, 'station', 'red'),
                createButtonsFromList({B1: DRIVER_STATIONS.B1, B2: DRIVER_STATIONS.B2, B3: DRIVER_STATIONS.B3}, 500, 'station', 'blue'),
            
                <center key="sidebarPerspective">
                    <h3 key="sidebarPerspectiveHeading">PRESPECTIVE</h3>
                </center>,

                createButtonsFromList(PERSPECTIVE, 750, 'perspective', 'blue'),
        ]}
        </Drawer>
    )
}

export default Sidebar;