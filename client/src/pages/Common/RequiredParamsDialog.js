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
  Box,
  ButtonGroup
} from "@mui/material";
import { ATTENDING_EVENTS, PRACTICE_EVENTS } from "../ScoutMatch/Constants";

// Constant configuration for all supported parameters.
// These values are fixed and cannot be changed externally.
export const SUPPORTED_PARAMS = {
  eventKey: {
    label: "Event Key",
    type: "select",
    // Options for event keys; these are fixed.
    options: [...ATTENDING_EVENTS, ...PRACTICE_EVENTS],
  },
  matchKey: {
    label: "Match Key",
    type: "text",
    helperText:
      "Format: [COMP_LEVEL]m[MATCH_NUMBER]. COMP_LEVEL is one of (qm, ef, qf, sf, f).",
  },
  robot: {
    label: "Robot",
    type: "text",
    helperText:
      "Please confirm the robot number is exactly right"
  },
  station: {
    label: "Station",
    type: "select",
    options: ["r1", "r2", "r3", "b1", "b2", "b3"],
  },
  // You can add more fixed parameters here in the future.
};

const RequiredParamsDialog = ({
  open,
  onSubmit,
  searchParams, // e.g. a URLSearchParams instance
  searchParamsError,
  // Array of parameter keys that are required in this dialog.
  // e.g. ["eventKey", "matchKey", "robot"]
  offlineOption = false,
  offlineRequiredParamKeys = [],
  requiredParamKeys = ["eventKey"],
}) => {
  // Build a configuration array from the keys.
  const requiredParams = requiredParamKeys
    .map((key) => SUPPORTED_PARAMS[key])
    .filter(Boolean); // Filter out any keys that are not defined

  // Build initial state from searchParams for only the required params.
  const getInitialValues = () => {
    const initial = {};
    Object.keys(SUPPORTED_PARAMS).forEach(key => {
      initial[key] = "";
    })
    requiredParamKeys.forEach((key) => {
      initial[key] = searchParams.get(key) || "";
    });
    return initial;
  };

  const [values, setValues] = useState(getInitialValues());
  const [networkMode, setNetworkMode] = useState(true);

  // Update local state when searchParams change.
  useEffect(() => {
    setValues(getInitialValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleChange = (key, newValue) => {
    setValues((prev) => ({
      ...prev,
      [key]: newValue,
    }));
  };

  const handleSubmit = () => {
    // Check that all required fields have a value.
    const allPresent = requiredParamKeys.every(
      (key) => values[key] && values[key].trim() !== ""
    );
    if (allPresent) {
      onSubmit(values, networkMode);
    }
  };

  return (
    <Dialog open={open}>
      <DialogTitle>Enter Required Information</DialogTitle>
      <Box sx={{width: "90%", justifyContent: "center", display: "flex", alignSelf: "center"}}>
        {offlineOption && <ButtonGroup variant="contained" sx={{width: "100%", display: "flex"}}>
          <Button 
            sx={{color: "#222", bgcolor: networkMode ? "#999" : "#777", width: "100%"}}
            onClick={() => setNetworkMode(true)}
          >ONLINE</Button>
          <Button 
            sx={{color: "#222", bgcolor: !networkMode ? "#999" : "#777", width: "100%"}}
            onClick={() => setNetworkMode(false)}
          >OFFLINE</Button>
        </ButtonGroup>}
      </Box>
      <DialogContent>
        {searchParamsError && (
          <Typography variant="body2" color="error">
            {searchParamsError}
          </Typography>
        )}
        {(networkMode ? requiredParamKeys : offlineRequiredParamKeys).map((key) => {
          const param = SUPPORTED_PARAMS[key];
          if (!param) return null;
          if (param.type === "select") {
            return (
              <FormControl fullWidth margin="normal" key={key}>
                <InputLabel id={`${key}-label`}>{param.label}</InputLabel>
                <Select
                  labelId={`${key}-label`}
                  value={values[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  label={param.label}
                >
                  {param.options &&
                    param.options.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option.toUpperCase()}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            );
          }
          // Default to text field.
          return (
            <TextField
              key={key}
              label={param.label}
              value={values[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              fullWidth
              margin="normal"
              helperText={param.helperText || ""}
            />
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={
            !requiredParamKeys.every(
              (key) => values[key] && values[key].trim() !== ""
            )
          }
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequiredParamsDialog;
