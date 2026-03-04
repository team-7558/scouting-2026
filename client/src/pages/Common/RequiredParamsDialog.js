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
import { useNavigate } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';

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
    type: "select-text",
    options: ["qm"]
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
  scout: {
    label: "Scout Name",
    type: "text"
  }
  // You can add more fixed parameters here in the future.
};

const RequiredParamsDialog = ({
  open,
  onSubmit,
  searchParams, // e.g. a URLSearchParams instance
  searchParamsError,
  scoutData,
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
      initial[key] = searchParams.get(key) || scoutData?.[key] || "";
    });
    return initial;
  };

  const navigate = useNavigate();

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
      <DialogContent sx={{width: "90%", justifyContent: "center", alignSelf: "center"}}>
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
          if (param.type === "select-text") {
            // 1. Parse the combined value (e.g., "qm8") into its parts.
            // We use useMemo to avoid recalculating on every render.
            const { prefix, number } = (() => {
              const value = values[key] || "";
              const match = value.match(/^([a-zA-Z]*)(\d*)$/);
              if (match) {
                // match[1] is the letters part, match[2] is the number part
                return { prefix: match[1] || param.options[0], number: match[2] || "" };
              }
              return { prefix: param.options[0], number: "" };
            })()

            // 2. Create a handler for when the dropdown (prefix) changes.
            const handlePrefixChange = (e) => {
              const newPrefix = e.target.value;
              // Combine the new prefix with the existing number.
              handleChange(key, `${newPrefix}${number}`);
            };

            // 3. Create a handler for when the text field (number) changes.
            const handleNumberChange = (e) => {
              const newNumber = e.target.value;
              handleChange(key, `${prefix}${newNumber}`);
            };
            
            return (
              <FormControl fullWidth margin="normal" key={key}>
                <InputLabel shrink id={`${key}-label`}>{param.label}</InputLabel>
                <Box sx={{display: "flex", gap: 1, alignItems: "center", pt: 3}}>
                  <Select
                    labelId={`${key}-label`}
                    // The Select's value is now just the prefix part.
                    value={prefix}
                    // Use the custom handler.
                    onChange={handlePrefixChange}
                    sx={{width: "40%"}}
                  >
                    {param.options &&
                      param.options.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                  </Select>
                  <TextField
                    // The TextField's value is now just the number part.
                    value={number}
                    // Use the custom handler.
                    onChange={handleNumberChange}
                    helperText={param.helperText || ""}
                    sx={{width: "60%"}}
                  />
                </Box>
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
      <DialogActions sx={{display: "flex", justifyContent: "space-between"}}>
        <Button
          onClick={() => navigate("/")}
          variant="contained"
          sx={{backgroundColor: "#ddd", color: "#676767"}}
        >
          <HomeIcon/>
        </Button>

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
