import React, { useState } from "react";
import { postUpdatePassword } from "../../requests/AuthRequests.js"; 
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";

// Tertiary button styling
const TertiaryButton = styled(Button)({
  padding: "10px 20px",
  fontSize: "1rem",
  minHeight: "50px", // fix height to match other tertiary buttons
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#757575",
  color: "#fff",
  transition: "all 0.3s ease",
  "&:hover": {
    backgroundColor: "#9e9e9e",
    transform: "scale(1.05)",
    boxShadow: "0 4px 10px rgba(117,117,117,0.5)",
  },
});

// Modal styling
const ModalBox = styled(Box)({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  backgroundColor: "#1e1e1e",
  color: "#fff",
  boxShadow: 24,
  padding: "32px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  borderRadius: "10px",
});

// Styled text fields
const StyledTextField = styled(TextField)({
  "& label.Mui-focused": {
    color: "#03a9f4",
  },
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": {
      borderColor: "#555",
    },
    "&:hover fieldset": {
      borderColor: "#03a9f4",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#03a9f4",
    },
  },
});

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
    <>
      <TertiaryButton onClick={() => setOpen(true)}>Update Password</TertiaryButton>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalBox>
          <h2 style={{ margin: 0, textAlign: "center" }}>Update Password</h2>
          <StyledTextField
            type="password"
            label="Current Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <StyledTextField
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}
          {success && <p style={{ color: "green", margin: 0 }}>{success}</p>}
          <TertiaryButton onClick={handleUpdatePassword}>Update</TertiaryButton>
        </ModalBox>
      </Modal>
    </>
  );
};

export default UpdatePassword;
