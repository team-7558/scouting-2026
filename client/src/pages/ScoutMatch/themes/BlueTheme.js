import { createTheme } from "@mui/material/styles";

export const BlueTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#5f90de"
    },
    intake: {
      main: "#ff5757", 
    },
    shoot: {
      main: "#ffde59", 
    },
    hangDefense: {
      main: "#00d68f", 
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
    info: {
      main: "#999798"
    }
  },
});