// import "./HomePage.css";
import "../assets/generated-css/stylesheet.css";
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";

const HomePage = () => {
  const [token, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  return (
    <div>
      <h1>HOME PAGE</h1>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <Button variant="contained" onClick={() => navigate("/addTournament")}>
          Add Tournament
        </Button>
        <Button variant="contained" onClick={() => navigate("/scoutMatch")}>
          Scout Match
        </Button>
        <Button variant="contained" onClick={() => navigate("/viewData")}>
          View Data
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
