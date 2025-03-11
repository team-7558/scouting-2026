import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { Box, Button, Drawer, TextField } from "@mui/material";
import { DRIVER_STATIONS, PERSPECTIVE } from "./ScoutMatch/Constants.js";
import { useNavigate } from "react-router-dom";

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  scaleWidthToActual,
  scaleHeightToActual,
}) => {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [matchKeyEntry, setMatchKeyEntry] = useState(
    searchParams.get("matchKey")
  );

  useEffect(() => {
    setMatchKeyEntry(searchParams.get("matchKey"));
  }, [searchParams]);
  const createButtonsFromList = (list, width, paramName, color, drawBorder) => {
    return (
      <Box key={JSON.stringify(list)}>
        {Object.keys(list)
          .slice(0, 3)
          .map((key) => {
            return (
              <Button
                key={list[key]}
                sx={{
                  width: scaleWidthToActual(width) + "px",
                  height: scaleHeightToActual(150) + "px",
                  color: color,
                  border: drawBorder(list, key) ? "5px solid " + color : "",
                }}
                onClick={() => {
                  setSearchParams({
                    eventKey: searchParams.get("eventKey"),
                    station: searchParams.get("station"),
                    matchKey: matchKeyEntry,
                    [paramName]: list[key],
                  });
                }}
              >
                {list[key]}
              </Button>
            );
          })}
      </Box>
    );
  };
  return (
    <Drawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
      {[
        <center key="sidebarNameHeader">
          <h3>NAME</h3>
        </center>,
        <center key="sidebarNameValue">
          <Button
            variant="contained"
            onClick={() => {
              const currentLocation = encodeURIComponent(
                window.location.pathname + window.location.search
              );
              // Redirect to /signIn with the redirect parameter
              window.location.href = `/signIn?redirect=${currentLocation}`;
            }}
          >
            SIGN OUT
          </Button>
        </center>,
        <center key="sidebarStation">
          <h3 key="sidebarStationHeading">STATION</h3>
        </center>,
        createButtonsFromList(
          {
            R1: DRIVER_STATIONS.R1,
            R2: DRIVER_STATIONS.R2,
            R3: DRIVER_STATIONS.R3,
          },
          500,
          "station",
          "red",
          (list, key) => {
            const urlParams = new URLSearchParams(window.location.search);
            const station = urlParams.get("station");
            return station == list[key];
          }
        ),
        createButtonsFromList(
          {
            B1: DRIVER_STATIONS.B1,
            B2: DRIVER_STATIONS.B2,
            B3: DRIVER_STATIONS.B3,
          },
          500,
          "station",
          "blue",
          (list, key) => {
            const urlParams = new URLSearchParams(window.location.search);
            const station = urlParams.get("station");
            return station == list[key];
          }
        ),

        // <center key="sidebarPerspective">
        //   <h3 key="sidebarPerspectiveHeading">PRESPECTIVE</h3>
        // </center>,

        // createButtonsFromList(
        //   PERSPECTIVE,
        //   750,
        //   "perspective",
        //   "blue",
        //   (list, key) => {
        //     const urlParams = new URLSearchParams(window.location.search);
        //     const perspective =
        //       urlParams.get("perspective") || PERSPECTIVE.SCORING_TABLE_NEAR;
        //     return perspective == list[key];
        //   }
        // ),

        <center>
          <h3>Match Key</h3>
        </center>,
        <center>
          <TextField
            onChange={(e) => setMatchKeyEntry(e.target.value)}
            value={matchKeyEntry}
            label="Match Key"
            variant="outlined"
          />
          <br />
          <br />
          <Button
            variant="contained"
            onClick={() => {
              setSearchParams({
                eventKey: searchParams.get("eventKey"),
                station: searchParams.get("station"),
                matchKey: matchKeyEntry,
              });
            }}
          >
            SUBMIT
          </Button>
          <br />
          <Button 
            variant="contained" 
            onClick={() => window.location.href = window.location.href}
            sx={{margin: '2vh'}}
          >RELOAD</Button>
        </center>,
      ]}
    </Drawer>
  );
};

export default Sidebar;
