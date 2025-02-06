import React, { useState } from "react";
import { postUpdatePassword } from "../../requests/AuthRequests.js"; // Import API request
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";

const UpdatePassword = () => {
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdatePassword = async () => {
    try {
      const response = await postUpdatePassword(oldPassword, newPassword);
      setSuccess(response.data.message);
      setError("");
      setOldPassword("");
      setNewPassword("");
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Update Password
      </Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <h2>Update Password</h2>
          <TextField
            type="password"
            label="Current Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <TextField
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
          <Button variant="contained" onClick={handleUpdatePassword}>
            Update
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

export default UpdatePassword;
