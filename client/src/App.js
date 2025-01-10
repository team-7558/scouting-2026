import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage.js";
import SignInPage from "./pages/SignInPage.js";
import MatchScouting from "./pages/MatchScouting.js";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/scoutMatch" element={<MatchScouting />} />
      </Routes>
    </>
  );
};

export default App;
