// src/components/UpdatePassword.js

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { postUpdatePassword } from "../../services/api/authService.js";

// Modal styling
const ModalBox = styled(Box)({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  backgroundColor: "#212121", // Darker modal background
  color: "#fff",
  boxShadow: 24,
  padding: "32px",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  borderRadius: "10px",
  border: "1px solid #424242",
});

// Styled text fields for dark mode
const StyledTextField = styled(TextField)({
  "& label": {
    color: "#bdbdbd",
  },
  "& label.Mui-focused": {
    color: "#d32f2f", // Red focus color
  },
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": {
      borderColor: "#757575",
    },
    "&:hover fieldset": {
      borderColor: "#e0e0e0",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#d32f2f", // Red focus color
    },
  },
});

const UpdateButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  }
}));


const UpdatePassword = ({ open, onClose }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setOldPassword("");
      setNewPassword("");
      setError("");
      setSuccess("");
    }
  }, [open]);

  const handleUpdatePassword = async () => {
    try {
      const response = await postUpdatePassword(oldPassword, newPassword);
      setSuccess(response.data.message);
      setError("");
      setTimeout(() => {
        onClose(); // Close modal on success after a short delay
      }, 1500);
    } catch (err) {
      setSuccess("");
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalBox>
        <Typography variant="h5" component="h2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Update Password
        </Typography>
        <StyledTextField
          type="password"
          label="Current Password"
          variant="outlined"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <StyledTextField
          type="password"
          label="New Password"
          variant="outlined"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        {error && <Typography sx={{ color: "red", textAlign: "center" }}>{error}</Typography>}
        {success && <Typography sx={{ color: "green", textAlign: "center" }}>{success}</Typography>}
        <UpdateButton variant="contained" onClick={handleUpdatePassword}>Update</UpdateButton>
      </ModalBox>
    </Modal>
  );
};

export default UpdatePassword;