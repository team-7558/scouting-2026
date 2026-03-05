import { ThemeProvider } from "@mui/material/styles";
import * as React from "react";
import "./App.css";
import { lightTheme } from "./components/shared/AppTheme.js";

import CssBaseline from "@mui/material/CssBaseline";
import { Route, Routes } from "react-router-dom";

import AdminPage from "./components/Admin/Admin.js";
import ScoutRankings from "./components/Admin/ScoutRankings.js";
import HomePage from "./components/Home/HomePage.js";
import SignInPage from "./components/Home/SignInPage.js";
import ScanQR from "./components/ScoutMatch/ScanQR.js";
import ScoutMatch from "./components/ScoutMatch/ScoutMatch.js";
import AutoPathVisualizer from "./components/Strategy/AutoPaths.js";
import CategorySort from "./components/Strategy/CategorySort.js";
import MatchStrategy from "./components/Strategy/MatchStrategy.js";
import Overview from "./components/Strategy/Overview.js";
import ViewReports from "./components/Strategy/ViewReports.js";
import { ProtectedRoute } from "./services/auth/tokenService.js";

function App() {
  return (
    <React.Fragment>
      <ThemeProvider theme={lightTheme}>
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
              <ScoutMatch key={window.search} />
            }
          />
          <Route
            path="/matchStrategy"
            element={
              <ProtectedRoute>
                <MatchStrategy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/robots"
            element={
              <ProtectedRoute>
                <ViewReports requiredParamKeys={["eventKey", "robot"]} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <ViewReports requiredParamKeys={["eventKey", "matchKey"]} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/scoutRankings"
            element={
              <ProtectedRoute>
                <ScoutRankings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/overview"
            element={
              <ProtectedRoute>
                <Overview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categorySort"
            element={
              <ProtectedRoute>
                <CategorySort />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/autoPaths"
            element={
              <ProtectedRoute>
                <AutoPathVisualizer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute>
                <ScanQR />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ThemeProvider>
    </React.Fragment>
  );
};

export default App;
