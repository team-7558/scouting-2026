import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import CreateUserModal from "./CreateUserModal";

const AdminPage = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <h1>Admin Page</h1>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Create User
        </Button>
      </div>

      <CreateUserModal open={open} handleClose={handleClose} />
    </div>
  );
};

export default AdminPage;
