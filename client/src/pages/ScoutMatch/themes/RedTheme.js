import { createTheme } from "@mui/material/styles";

export const RedTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#e53935", // A strong red for primary actions
    },
    secondary: {
      main: "#ff4081", // A pink accent color
    },
    error: {
      main: "#f44336",
    },
    info: {
      main: "#ff8a80", // Lighter red for informational elements
    },
    success: {
      main: "#4caf50",
    },
    warning: {
      main: "#ff9800",
    },
    cancel: {
      main: "#999",
    },
    opponent: {
      main: "#2196f3", // The primary blue color for opponents
    },
    powerCell: {
      main: "#ffd600", // A strong, vibrant yellow for power cells
    },
    autoBackground: {
      main: "rgba(255, 214, 0, 0.15)",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
});