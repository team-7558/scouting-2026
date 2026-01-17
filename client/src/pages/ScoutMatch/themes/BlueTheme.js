import { createTheme } from "@mui/material/styles";

export const BlueTheme = createTheme({
  palette: {
    mode: "dark",
    intake: {
      main: "#ff5757", // A vibrant blue for primary actions
    },
    shoot: {
      main: "#ffde59", // A teal accent color
    },
    hangDefense: {
      main: "#63bbf4", // A clear red for errors
    },
    undo: {
      main: "#cb6ce6", // Lighter blue for informational elements
    },
    success: {
      main: "#00d68f",
    },
    fail: {
      main: "#ff5757",
    },
  },
});