import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import UpdatePassword from "./UpdatePassword"; // Import the new component

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <center>
        <h1>HOME PAGE</h1>
      </center>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <Button variant="contained" onClick={() => navigate("/admin")}>
          Admin
        </Button>
        <Button variant="contained" onClick={() => navigate("/scoutMatch")}>
          Scout Match
        </Button>
        <Button variant="contained" onClick={() => navigate("/viewData")}>
          View Data
        </Button>
        <Button variant="contained" onClick={() => navigate("/matchStrategy")}>
          Match Strategy
        </Button>
        <UpdatePassword />
      </div>
    </div>
  );
};

export default HomePage;
