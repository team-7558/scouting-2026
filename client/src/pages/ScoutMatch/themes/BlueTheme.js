import { createTheme } from "@mui/material/styles";

export const BlueTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3f51b5",
    },
    error: {
      main: "#FF0000",
    },
    secondary: {
      main: "#00AA55",
    },
    transparent: {
      main: "rgba(0, 0, 0, 0)"
    }
  },
});
