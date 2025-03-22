// Admin.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import CreateUserModal from "./CreateUserModal";
import ImportEventModal from "./ImportEventModal";
import ImportPitScoutingModal from "./ImportPitScoutingModal"; // New import

const AdminPage = () => {
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [openImportEvent, setOpenImportEvent] = useState(false);
  const [openImportPitScouting, setOpenImportPitScouting] = useState(false);
  const navigate = useNavigate();

  const handleOpenCreateUser = () => setOpenCreateUser(true);
  const handleCloseCreateUser = () => setOpenCreateUser(false);

  const handleOpenImportEvent = () => setOpenImportEvent(true);
  const handleCloseImportEvent = () => setOpenImportEvent(false);

  const handleOpenImportPitScouting = () => setOpenImportPitScouting(true);
  const handleCloseImportPitScouting = () => setOpenImportPitScouting(false);

  return (
    <div>
      <h1>Admin Page</h1>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
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
          onClick={handleOpenImportPitScouting}
        >
          Import Pit Scouting
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
      <ImportPitScoutingModal
        open={openImportPitScouting}
        handleClose={handleCloseImportPitScouting}
      />
    </div>
  );
};

export default AdminPage;
