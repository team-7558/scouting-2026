// Admin.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import CreateUserModal from "./CreateUserModal";
import ImportEventModal from "./ImportEventModal";
import SetRobotRateModal from "./SetRobotRateModal"; // New import

const AdminPage = () => {
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [openImportEvent, setOpenImportEvent] = useState(false);
  const [openSetRobotRate, setOpenSetRobotRate] = useState(false);
  const navigate = useNavigate();

  const handleOpenCreateUser = () => setOpenCreateUser(true);
  const handleCloseCreateUser = () => setOpenCreateUser(false);

  const handleOpenImportEvent = () => setOpenImportEvent(true);
  const handleCloseImportEvent = () => setOpenImportEvent(false);

  const handleOpenRobotRate = () => setOpenSetRobotRate(true);
  const handleCloseRobotRate = () => setOpenSetRobotRate(false);

  return (
    <div>
      <h1 style={{color: "white", textAlign: "center"}}>Admin Page</h1>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/")}
        >
          Home
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenCreateUser}
        >
          Create User
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenImportEvent}
        >
          Import Matches
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenRobotRate}
        >
          Set Robot Rate
        </Button>
      </div>

      <CreateUserModal
        open={openCreateUser}
        handleClose={handleCloseCreateUser}
      />
      <ImportEventModal
        open={openImportEvent}
        handleClose={handleCloseImportEvent}
      />
      <SetRobotRateModal
        open={openSetRobotRate}
        handleClose={handleCloseRobotRate}
      />

    </div>
  );
};

export default AdminPage;
