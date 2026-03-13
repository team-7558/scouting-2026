import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getReports } from "../../requests/ApiRequests";
import {
  LinearProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Collapse, Box, Typography,
  createTheme, ThemeProvider, CssBaseline, AppBar, Toolbar, IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import HomeIcon from '@mui/icons-material/Home';

// Import supporting components and assets
import RequiredParamsDialog from "../Common/RequiredParamsDialog";
import altf4Logo from "../../assets/scouting-2025/altf4_logo_white.png"; // Adjust path if needed

// --- THEME DEFINITION (Consistent with other pages) ---
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#d32f2f', // Core Red
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
  },
});

// --- STYLED COMPONENTS ---
const PageContainer = styled("div")({
  paddingTop: "80px", // Offset for AppBar
  paddingBottom: "40px",
  backgroundColor: darkTheme.palette.background.default,
  minHeight: "100vh",
});

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid #424242`,
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: '#333333', // Darker header for contrast
}));

const StyledTableRow = styled(TableRow)({
  '&:hover': {
    backgroundColor: '#303030',
  },
  '& > *': {
    borderBottom: '1px solid #424242',
  },
});

const CollapseBox = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: '#333333', // Inset background color
    borderTop: `1px solid ${theme.palette.primary.main}`,
}));

const LogoImage = styled('img')({
    height: '45px',
    marginRight: '16px',
});

// --- SCOUT RANKINGS COMPONENT ---
const ScoutRankings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paramsProvided, setParamsProvided] = useState(false);
  const [robotData, setRobotData] = useState(null);
  const [error, setError] = useState(null);
  const [openRow, setOpenRow] = useState(null);

  const eventKey = searchParams.get("eventKey");

  useEffect(() => {
    setParamsProvided(!!eventKey);
  }, [eventKey]);

  const handleDialogSubmit = (values) => {
    setSearchParams({ ...Object.fromEntries(searchParams), ...values });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!paramsProvided) return;
      try {
        setRobotData(null); // Reset data on new fetch
        const response = await getReports({ eventKey });
        setRobotData(response.data);
      } catch (error) {
        console.error("Error fetching robot data:", error);
        setError(error.message || "Failed to fetch data.");
      }
    };
    fetchData();
  }, [paramsProvided, eventKey]);

  const { numMatchesScouted, scoutComments } = React.useMemo(() => {
    const matches = {};
    const comments = {};
    if (robotData) {
      for (const report of robotData.reports) {
        matches[report.scout_name] = (matches[report.scout_name] || 0) + 1;
        if (!comments[report.scout_name]) {
          comments[report.scout_name] = [];
        }
        comments[report.scout_name].push({
          comment: report.comments,
          team: report.robot,
          match: report.match_key,
        });
      }
    }
    return { numMatchesScouted: matches, scoutComments: comments };
  }, [robotData]);

  const sortedScouts = Object.entries(numMatchesScouted).sort(
    ([, countA], [, countB]) => countB - countA
  );

  const renderContent = () => {
    if (!paramsProvided) {
      return (
        <RequiredParamsDialog
          open={true}
          onSubmit={handleDialogSubmit}
          searchParams={searchParams}
          searchParamsError=""
          requiredParamKeys={["eventKey"]}
        />
      );
    }
    if (error) {
      return (
        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Typography variant="h5" color="error">{error}</Typography>
        </Box>
      );
    }
    if (!robotData) {
      return <LinearProgress color="primary" sx={{ m: 5 }} />;
    }
    return (
      <StyledTableContainer component={Paper}>
        <Table stickyHeader>
          <StyledTableHead>
            <TableRow>
              <TableCell><b>SCOUT NAME</b></TableCell>
              <TableCell align="right"><b>MATCHES SCOUTED</b></TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {sortedScouts.map(([name, count]) => (
              <React.Fragment key={name}>
                <StyledTableRow
                  sx={{ cursor: "pointer" }}
                  onClick={() => setOpenRow(name === openRow ? null : name)}
                >
                  <TableCell component="th" scope="row">{name}</TableCell>
                  <TableCell align="right">{count}</TableCell>
                </StyledTableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={2}>
                    <Collapse in={openRow === name} timeout="auto" unmountOnExit>
                        <CollapseBox>
                            <Typography variant="h6" gutterBottom>Comments</Typography>
                            {scoutComments[name].sort((a, b) => {
                              const aNum = parseInt(a.match.match(/\d+/)?.[0] ?? 0, 10);
                              const bNum = parseInt(b.match.match(/\d+/)?.[0] ?? 0, 10);
                              return aNum - bNum;
                            }).map((obj, index) => (
                              <Box key={index} sx={{mb: 2}}>
                                  <Typography variant="subtitle1"><b>{`Team ${obj.team} - Match ${obj.match}`}</b></Typography>
                                  <Typography variant="body2" sx={{pl: 1}}>{obj.comment || "No comment."}</Typography>
                              </Box>
                            ))}
                        </CollapseBox>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <LogoImage src={altf4Logo} alt="Team Logo" />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Scout Rankings
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/')}>
            <HomeIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <PageContainer>
        <Box sx={{ maxWidth: '1000px', margin: 'auto', px: 2 }}>
            {renderContent()}
        </Box>
      </PageContainer>
    </ThemeProvider>
  );
};

export default ScoutRankings;