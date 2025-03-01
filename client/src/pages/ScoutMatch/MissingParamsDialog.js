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

const eventOptions = ["2025week0"]; // example options
const stationOptions = ["r1", "r2", "r3", "b1", "b2", "b3"];

const MissingParamsDialog = ({
  open,
  onSubmit,
  searchParams,
  searchParamsError,
}) => {
  const initialEventKey = searchParams.get("eventKey") || "";
  const initialmatchKey = searchParams.get("matchKey") || "";
  const initialStation = searchParams.get("station") || "";

  const [eventKey, setEventKey] = useState(initialEventKey);
  const [matchKey, setmatchKey] = useState(initialmatchKey);
  const [station, setStation] = useState(initialStation);

  // Update local state when searchParams change.
  useEffect(() => {
    setEventKey(initialEventKey);
    setmatchKey(initialmatchKey);
    setStation(initialStation);
  }, [initialEventKey, initialmatchKey, initialStation]);

  const handleSubmit = () => {
    if (eventKey && matchKey && station) {
      onSubmit({ eventKey, matchKey, station });
    }
  };

  return (
    <Dialog open={open}>
      <DialogTitle>Enter Match Information</DialogTitle>
      <DialogContent>
        {searchParamsError && (
          <Typography variant="body2" color="error">
            {searchParamsError}
          </Typography>
        )}
        <FormControl fullWidth margin="normal">
          <InputLabel id="event-key-label">Event Key</InputLabel>
          <Select
            labelId="event-key-label"
            value={eventKey}
            onChange={(e) => setEventKey(e.target.value)}
            label="Event Key"
          >
            {eventOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Match Key"
          value={matchKey}
          onChange={(e) => setmatchKey(e.target.value)}
          fullWidth
          margin="normal"
          helperText="Format: [COMP_LEVEL]m[MATCH_NUMBER]. COMP_LEVEL is one of (qm, ef, qf, sf, f). Append a set number if required."
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="station-label">Station</InputLabel>
          <Select
            labelId="station-label"
            value={station}
            onChange={(e) => setStation(e.target.value)}
            label="Station"
          >
            {stationOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MissingParamsDialog;
