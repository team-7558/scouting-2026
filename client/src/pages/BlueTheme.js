import { createTheme } from "@mui/material/styles";

export const BlueTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3f51b5",
    },
    error: {
      main: "#FF0000",
    },
    secondary: {
      main: "#00AA55",
    },
    disabled: {
      main: "#AAAAAA",
      contrastText: "#555555",
    },
  },
});
