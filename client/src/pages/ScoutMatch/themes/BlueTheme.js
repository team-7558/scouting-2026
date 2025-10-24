import { createTheme } from "@mui/material/styles";

export const BlueTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#2196f3", // A vibrant blue for primary actions
    },
    secondary: {
      main: "#00bfa5", // A teal accent color
    },
    error: {
      main: "#f44336", // A clear red for errors
    },
    info: {
      main: "#64b5f6", // Lighter blue for informational elements
    },
    success: {
      main: "#4caf50",
    },
    warning: {
      main: "#ff9800",
    },
    cancel: {
      main: "#999", // A neutral grey for cancel actions
    },
    powerCell: {
      main: "#ffd600", // A strong, vibrant yellow for power cells
    },
    autoBackground: {
      main: "rgba(255, 214, 0, 0.15)", // A transparent yellow for the auto phase background
    },
    background: {
      default: "#121212", // Standard dark theme background
      paper: "#1e1e1e",   // Slightly lighter background for surfaces like sidebars
    },
  },
});