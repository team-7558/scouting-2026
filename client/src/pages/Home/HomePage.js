import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import UpdatePassword from "./UpdatePassword";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <center>
        <h1>HOME PAGE</h1>
      </center>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
          margin: "20px 0",
        }}
      >
        {/* This route is not protected so it may be useful for testing */}
        <Button variant="contained" onClick={() => navigate("/signIn")}>
          Sign In
        </Button>
        <Button variant="contained" onClick={() => navigate("/admin")}>
          Admin
        </Button>
        <Button variant="contained" onClick={() => navigate("/scoutMatch")}>
          Scout Match
        </Button>
        <Button variant="contained" onClick={() => navigate("/matchStrategy")}>
          Match Strategy
        </Button>
        <Button variant="contained" onClick={() => navigate("/robots")}>
          Robots
        </Button>
        <Button variant="contained" onClick={() => navigate("/matches")}>
          Matches
        </Button>
        <Button variant="contained" onClick={() => navigate("/overview")}>
          Overview
        </Button>
        <Button variant="contained" onClick={() => navigate("/categorySort")}>
          Category Sort
        </Button>
        <UpdatePassword />
      </div>
    </div>
  );
};

export default HomePage;
