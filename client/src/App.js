import * as React from "react";
import { lightTheme, darkTheme } from "./AppTheme.js";
import { ThemeProvider } from "@mui/material/styles";

import { Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";

import HomePage from "./pages/Home/HomePage.js";
import SignInPage from "./pages/SignInPage.js";
import ScoutMatch from "./pages/ScoutMatch/ScoutMatch.js";
import AdminPage from "./pages/Admin/Admin.js";
import { ProtectedRoute } from "./TokenUtils.js";
import MatchStrategy from "./pages/Strategy/MatchStrategy.js";
import ViewReports from "./pages/Strategy/ViewReports.js";
import Overview from "./pages/Strategy/Overview.js";
import ScoutAdmin from "./pages/ScoutLead/ScoutAdmin.js";
import CategorySort from "./pages/Strategy/CategorySort.js";

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
              <ProtectedRoute>
                <ScoutMatch />
              </ProtectedRoute>
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
            path="/scoutAdmin"
            element={
              <ProtectedRoute>
                <ScoutAdmin />
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
        </Routes>
      </ThemeProvider>
    </React.Fragment>
  );
};

export default App;
