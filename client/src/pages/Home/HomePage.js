// src/components/HomePage.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Container, Box, Button, Grid, Card,
  CardActionArea, CardContent, IconButton, Menu, MenuItem, Accordion,
  AccordionSummary, AccordionDetails, createTheme, ThemeProvider, CssBaseline
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AccountCircle from "@mui/icons-material/AccountCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EventIcon from "@mui/icons-material/Event";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

// Import your components and assets
import UpdatePassword from "./UpdatePassword"; // Adjust path if needed
import altf4Logo from "../../assets/scouting-2025/altf4_logo_white.png"; // Adjust path if needed

// --- THEME DEFINITION ---
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#d32f2f', // Core Red
    },
    background: {
      default: '#121212', // Deep Black
      paper: '#1e1e1e',   // Slightly Lighter Surfaces
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
    h2: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
});

// --- STYLED COMPONENTS ---
const HomeContainer = styled("div")({
  minHeight: "100vh",
  paddingTop: "80px", // Increased padding for AppBar
  paddingBottom: "40px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: darkTheme.palette.background.default,
});

const ScoutMatchButton = styled(Button)(({ theme }) => ({
  padding: "20px 60px",
  fontSize: "1.8rem",
  fontWeight: "bold",
  backgroundColor: theme.palette.primary.main,
  color: "#fff",
  margin: "30px 0 50px 0",
  transition: "transform 0.2s, box-shadow 0.3s",
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
    transform: "scale(1.05)",
    boxShadow: `0 8px 25px ${theme.palette.primary.dark}`,
  },
}));

const NavCard = styled(Card)(({ theme }) => ({
  textAlign: "center",
  backgroundColor: theme.palette.background.paper,
  color: "#fff",
  transition: "transform 0.2s",
  "&:hover": {
    backgroundColor: '#333333',
    transform: "translateY(-5px)",
  },
}));

const AdminAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: '#424242', // Lighter grey for admin dashboard
  color: "#fff",
  width: '100%',
  marginTop: '40px'
}));

const LogoImage = styled('img')({
    height: '45px',
    marginRight: '16px',
    // mixBlendMode: 'multiply', // This CSS property helps "chroma key" the white background
    // filter: "saturate(20)"
});


// --- HOME PAGE COMPONENT ---
const HomePage = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [updatePasswordOpen, setUpdatePasswordOpen] = useState(false);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleOpenUpdatePassword = () => {
    setUpdatePasswordOpen(true);
    handleCloseMenu();
  };
  const handleCloseUpdatePassword = () => setUpdatePasswordOpen(false);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <LogoImage src={altf4Logo} alt="Team Logo" />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ALT-F4 Scouting
          </Typography>
          <div>
            <IconButton size="large" onClick={handleMenu} color="inherit">
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleOpenUpdatePassword}>Update Password</MenuItem>
              <MenuItem onClick={() => {
                localStorage.setItem("token", "");
                navigate("/signIn");
                }}>Log Out</MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>

      <HomeContainer>
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", my: 4 }}>
            <Typography variant="h2" component="h1" gutterBottom color="white">
              Scouting App
            </Typography>
            <ScoutMatchButton onClick={() => navigate("/scoutMatch")}>
              Scout Match
            </ScoutMatchButton>
          </Box>

          <Grid container spacing={4}>
            {/* Navigation Cards */}
            {[
              { label: 'Overview', icon: <AssessmentIcon sx={{ fontSize: 60 }} />, path: '/categorysort' },
              { label: 'Matches', icon: <EventIcon sx={{ fontSize: 60 }} />, path: '/matches' },
              { label: 'Robots', icon: <SmartToyIcon sx={{ fontSize: 60 }} />, path: '/robots' },
            ].map((item) => (
              <Grid item xs={12} sm={4} key={item.label}>
                <NavCard onClick={() => navigate(item.path)}>
                  <CardActionArea sx={{ p: 3 }}>
                    {item.icon}
                    <CardContent>
                      <Typography gutterBottom variant="h5" component="div">
                        {item.label}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </NavCard>
              </Grid>
            ))}
          </Grid>

          <AdminAccordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color: "#fff"}}/>}>
              <Typography sx={{fontWeight: 'bold'}}>Admin Dashboard</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button variant="contained" fullWidth startIcon={<AdminPanelSettingsIcon />} onClick={() => navigate("/admin")}>Admin</Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button variant="contained" fullWidth startIcon={<QrCodeScannerIcon />} onClick={() => navigate("/scan")}>Scan QR</Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button variant="contained" fullWidth startIcon={<LeaderboardIcon />} onClick={() => navigate("/scoutAdmin")}>Scout Rankings</Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </AdminAccordion>
        </Container>
      </HomeContainer>

      {/* Render the UpdatePassword Modal */}
      <UpdatePassword open={updatePasswordOpen} onClose={handleCloseUpdatePassword} />
    </ThemeProvider>
  );
};

export default HomePage;