import * as React from "react";
import { theme } from "./AppTheme.js";
import { ThemeProvider } from "@mui/material/styles";

import { Routes, Route, Navigate } from "react-router-dom";

import CssBaseline from "@mui/material/CssBaseline";

import HomePage from "./pages/HomePage.js";
import SignInPage from "./pages/SignInPage.js";
import ScoutMatch from "./pages/ScoutMatch/ScoutMatch2.js";
import ScoutMatch2 from "./pages/ScoutMatch/ScoutMatch.js"

const App = () => {
  return (
    <React.Fragment>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route
            path="/scoutMatch"
            element={
              <ScoutMatch
                driverStation="b1"
                teamNumber="7558"
                scoutPerspective="scoringTable"
              />
            }
          />
          <Route path="/scoutMatch2" element={<ScoutMatch2 />} />
        </Routes>
      </ThemeProvider>
    </React.Fragment>
  );
};

export default App;
