import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { postImportMatches } from "../../requests/ApiRequests.js";

const ImportEventModal = ({ open, handleClose }) => {
  const [eventCode, setEventCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setEventCode("");
      setError("");
    }
  }, [open]);

  const handleImport = async () => {
    try {
      const response = await postImportMatches(eventCode);
      alert("Matches imported successfully: " + JSON.stringify(response.data));
      handleClose();
    } catch (err) {
      setError(
        "Error importing matches: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Import Matches by Event Code</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Event Code"
          type="text"
          fullWidth
          value={eventCode}
          onChange={(e) => setEventCode(e.target.value)}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            handleClose();
            setEventCode("");
            setError("");
          }}
          color="secondary"
        >
          Cancel
        </Button>
        <Button onClick={handleImport} color="primary">
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportEventModal;
