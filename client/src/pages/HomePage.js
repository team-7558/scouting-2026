import "./HomePage.css";
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [token, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const redirect = (path) => {
    navigate(path)
  }

  return(
    <div>
      <h1>HOME PAGE</h1>
      <span>
        <button className="button" onClick={() => redirect("/addTournament")}>Add Tournament</button>
        <button className="button" onClick={() => redirect("/scoutMatch")}>Scout Match</button>
        <button className="button" onClick={() => redirect("/viewData")}>View Data</button>
      </span>
    </div>
  );
};

export default HomePage;
