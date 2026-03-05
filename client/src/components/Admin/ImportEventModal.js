import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";
import { postImportMatches } from "../../services/api/matchService.js";
import AppAlert from "../shared/AppAlert.js";

const ImportEventModal = ({ open, handleClose }) => {
  const [eventCode, setEventCode] = useState("");
  const [error, setError] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (message) => {
    setAlertMessage(message);
    setAlertOpen(true);
  };

  useEffect(() => {
    if (!open) {
      setEventCode("");
      setError("");
    }
  }, [open]);

  const handleImport = async () => {
    try {
      const response = await postImportMatches(eventCode);
      showAlert("Matches imported successfully: " + JSON.stringify(response.data));
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
      <AppAlert
        open={alertOpen}
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />
    </Dialog>
  );
};

export default ImportEventModal;
