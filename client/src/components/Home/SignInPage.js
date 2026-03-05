import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  createTheme,
  CssBaseline,
  Divider,
  Paper,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postSignIn } from "../../services/api/authService.js";

// Import your logo
import altf4Logo from "../../assets/field/2026/logo_white.png";

// --- THEME DEFINITION (Consistent with HomePage) ---
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
  },
});

// --- STYLED COMPONENTS ---
const FullPageContainer = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: darkTheme.palette.background.default,
});

const SignInPaper = styled(Paper)(({ theme }) => ({
  position: 'relative', // Needed for potential absolute positioning of loader
  padding: theme.spacing(4),
  textAlign: 'center',
  backgroundColor: theme.palette.background.paper,
  color: '#fff',
  border: '1px solid #424242',
}));

const StyledTextField = styled(TextField)({
  "& label": {
    color: "#bdbdbd",
  },
  "& label.Mui-focused": {
    color: "#d32f2f", // Red focus color
  },
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": {
      borderColor: "#757575",
    },
    "&:hover fieldset": {
      borderColor: "#e0e0e0",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#d32f2f", // Red focus color
    },
  },
});

const SubmitButton = styled(Button)(({ theme }) => ({
  padding: '10px 0',
  marginTop: theme.spacing(2),
  minHeight: '44px',
  transition: 'background-color 0.3s ease',
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  }
}));

const LogoImage = styled('img')({
  width: '80px',
  marginBottom: '16px',
});

const StyledDivider = styled(Divider)(({ theme }) => ({
  color: '#bdbdbd',
  margin: theme.spacing(3, 0),
  '&::before, &::after': {
    borderColor: '#757575',
  },
}));


// --- SIGN IN PAGE COMPONENT ---
const SignInPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // Start loading

    try {
      const response = await postSignIn(username, password);
      localStorage.setItem("token", response.data.token);

      const params = new URLSearchParams(window.location.search);
      const redirectUrl = decodeURIComponent(params.get("redirect"));

      if (redirectUrl && redirectUrl !== "null") {
        navigate(redirectUrl);
      } else {
        navigate("/");
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Invalid username or password");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <FullPageContainer>
        <Container maxWidth="xs">
          <SignInPaper elevation={10}>
            <LogoImage src={altf4Logo} alt="Team Logo" />
            <Typography variant="h4" component="h1" gutterBottom>
              Sign In
            </Typography>
            <form onSubmit={handleSubmit}>
              <Box mb={2}>
                <StyledTextField
                  fullWidth
                  label="Username"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading} // Disable when loading
                />
              </Box>
              <Box mb={2}>
                <StyledTextField
                  fullWidth
                  type="password"
                  label="Password"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading} // Disable when loading
                />
              </Box>
              {error && (
                <Box mb={2}>
                  <Alert severity="error">{error}</Alert>
                </Box>
              )}
              <SubmitButton
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading} // Disable when loading
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
              </SubmitButton>
            </form>

            <StyledDivider>OR</StyledDivider>

            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate("/scoutMatch")}
              fullWidth
              disabled={isLoading} // Disable when loading
              sx={{
                border: `0.2vw solid ${darkTheme.palette.primary.main}`
              }}
            >
              Scout Match
            </Button>
          </SignInPaper>
        </Container>
      </FullPageContainer>
    </ThemeProvider>
  );
};

export default SignInPage;