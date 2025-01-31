import * as React from "react";
import { theme } from "./AppTheme.js";
import { ThemeProvider } from "@mui/material/styles";

import { Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";

import HomePage from "./pages/HomePage.js";
import SignInPage from "./pages/SignInPage.js";
import ScoutMatch from "./pages/ScoutMatch/ScoutMatch2.js";
import ProtectedRoute from "./ProtectedRoute.js";

const App = () => {
  return (
    <React.Fragment>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/signIn" element={<SignInPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scoutMatch"
            element={
              // <ProtectedRoute>
              <ScoutMatch
                driverStation="b1"
                teamNumber="7558"
                scoutPerspective="scoringTable"
              />
              // </ProtectedRoute>
            }
          />
          {/* <Route path="/scoutMatch2" element={<ScoutMatch2 />} /> */}
        </Routes>
      </ThemeProvider>
    </React.Fragment>
  );
};

export default App;
