import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import AppAlert from "../Common/AppAlert.js";
import { ATTENDING_EVENTS, PRACTICE_EVENTS } from "../ScoutMatch/Constants.js";
import { setTeamShootingRate } from "../../requests/AdminRequests.js";

const SetRobotRateModal = ({ open, handleClose }) => {
    const [teamNumber, setTeamNumber] = useState("");
    const [bps, setBps] = useState("");
    const [event, setEvent] = useState("");
    const [error, setError] = useState("");
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [shouldClose, setShouldClose] = useState(false);

    const showAlert = (message) => {
        setAlertMessage(message);
        setAlertOpen(true);
    };

    // Reset form when modal is closed
    useEffect(() => {
        if (!open) {
            setTeamNumber("");
            setBps("");
            setError("");
        }
    }, [open]);

    useEffect(() => {
        if (!alertOpen && shouldClose){
            handleClose();
        }
    }, [alertOpen, shouldClose]);

    const handleSetRate = async () => {
        try {
            const response = await setTeamShootingRate(event, teamNumber, bps);
            console.log(response);
            showAlert(response.data.message);
            setShouldClose(true);
        } catch (err) {
          if (err) {
            const message = err.response.data?.message || "Unknown backend error";
            setError("Error: " + message);
          } else {
            setError("Error: " + err.message);
          }
        }
    };

    return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Set Shooting Rate</DialogTitle>
      <DialogContent>
        <TextField
            autoFocus
            margin="dense"
            label="Team Number"
            type="text"
            fullWidth
            value={teamNumber}
            onChange={(e) => setTeamNumber(e.target.value)}
        />
        <TextField
          margin="dense"
          label="BPS"
          type="text"
          fullWidth
          value={bps}
          onChange={(e) => setBps(e.target.value)}
        />
        <TextField
          select
          margin="dense"
          label="Event"
          fullWidth
          value={event}
          onChange={(e) => setEvent(e.target.value)}
        >
          {[...ATTENDING_EVENTS, ...PRACTICE_EVENTS].map(eventKey => 
            <MenuItem key={eventKey} value={eventKey}>{eventKey}</MenuItem>
          )}
        </TextField>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            handleClose();
            setTeamNumber("");
            setBps("");
            setError("");
          }}
          color="secondary"
        >
          Cancel
        </Button>
        <Button onClick={handleSetRate} color="primary">
          Add
        </Button>
      </DialogActions>
      <AppAlert
          open={alertOpen}
          message={alertMessage}
          onClose={() => setAlertOpen(false)}
      />
    </Dialog>
  );
};

export default SetRobotRateModal;
