// ImportPitScoutingModal.js
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import { ATTENDING_EVENTS, PRACTICE_EVENTS } from "../ScoutMatch/Constants"; // Adjust the import path as needed
import { postImportPitScouting } from "../../requests/AdminRequests.js";

const eventOptions = [...ATTENDING_EVENTS, ...PRACTICE_EVENTS];

const ImportPitScoutingModal = ({ open, handleClose }) => {
  const [eventKey, setEventKey] = useState("");
  const [notionUrl, setNotionUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setEventKey("");
      setNotionUrl("");
      setError("");
    }
  }, [open]);

  const handleImport = async () => {
    try {
      // Extract the databaseId from the provided URL.
      // URL format: https://www.notion.so/<databaseId>?v=<view_hash>
      const regex = /notion\.so\/([^?]+)/;
      const match = notionUrl.match(regex);
      if (!match) {
        throw new Error("Invalid Notion URL format.");
      }
      const databaseId = match[1];
      const response = await postImportPitScouting({ eventKey, databaseId });
      alert(
        "Pit scouting data imported successfully: " +
          JSON.stringify(response.data)
      );
      handleClose();
    } catch (err) {
      setError(
        "Error importing pit scouting: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Import Pit Scouting Data</DialogTitle>
      <DialogContent>
        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
        <FormControl fullWidth margin="normal">
          <InputLabel id="eventKey-label">Event Key</InputLabel>
          <Select
            labelId="eventKey-label"
            value={eventKey}
            onChange={(e) => setEventKey(e.target.value)}
            label="Event Key"
          >
            {eventOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          margin="normal"
          label="Notion URL"
          type="text"
          fullWidth
          value={notionUrl}
          onChange={(e) => setNotionUrl(e.target.value)}
          placeholder="https://www.notion.so/<databaseId>?v=<view_hash>"
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            handleClose();
            setEventKey("");
            setNotionUrl("");
            setError("");
          }}
          color="secondary"
        >
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          color="primary"
          disabled={!eventKey || !notionUrl}
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportPitScoutingModal;
