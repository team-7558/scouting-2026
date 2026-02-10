import { createTheme } from "@mui/material/styles";

export const RedTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#de5f70"
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
      main: "#cb6ce6", 
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