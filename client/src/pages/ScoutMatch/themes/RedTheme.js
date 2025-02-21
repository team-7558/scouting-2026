import { createTheme } from "@mui/material/styles";

export const RedTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#b30202",
    },
    error: {
      main: "#FF0000",
    },
    secondary: {
      main: "#AA0055",
    },
    info: {
      main: "#FF7799"
    },
    coralPickup: {
      main: "#64B5F6",
    },
    coralDropoff: {
      main: "#1E88E5",
    },
    algaePickup: {
      main: "#81C784",
    },
    algaeDropoff: {
      main: "#388E3C",
    },
    cancel: {
      main: "#9E9E9E",
    },
  },
});
