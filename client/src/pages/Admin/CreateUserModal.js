import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import { postCreateUser } from "../../requests/AuthRequests.js";

const CreateUserModal = ({ open, handleClose }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      setUsername("");
      setPassword("");
      setRole("user");
      setError("");
    }
  }, [open]);

  const handleCreateUser = async () => {
    try {
      const response = await postCreateUser(username, password, role);
      alert("User created successfully: " + JSON.stringify(response.data));
      handleClose(); // Close modal after successful creation
    } catch (err) {
      setError(
        "Error creating user: " + (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Create User</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Username"
          type="text"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Password"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          select
          margin="dense"
          label="Role"
          fullWidth
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <MenuItem value="user">User</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </TextField>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            handleClose();
            setUsername("");
            setPassword("");
            setRole("user");
            setError("");
          }}
          color="secondary"
        >
          Cancel
        </Button>
        <Button onClick={handleCreateUser} color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateUserModal;
