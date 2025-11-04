import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import UpdatePassword from "./UpdatePassword";
import { styled } from "@mui/material/styles";

const HomeContainer = styled("div")({
  // backgroundColor: "#121212", // dark background
  minHeight: "80vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontFamily: "'Roboto', sans-serif",
});

const Title = styled("h1")({
  fontSize: "3rem",
  marginBottom: "40px",
  color: "#00bcd4", // bright accent for header
  textShadow: "2px 2px 5px rgba(0,0,0,0.5)",
});

const ButtonGrid = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "20px",
});

const MainButton = styled(Button)({
  padding: "20px 40px",
  fontSize: "1.5rem",
  backgroundColor: "#ff5722",
  color: "#fff",
  transition: "all 0.3s ease",
  "&:hover": {
    backgroundColor: "#ff784e",
    transform: "scale(1.05)",
    boxShadow: "0 8px 20px rgba(255,87,34,0.6)",
  },
});

const SecondaryButton = styled(Button)({
  padding: "15px 30px",
  fontSize: "1.2rem",
  backgroundColor: "#03a9f4",
  color: "#fff",
  transition: "all 0.3s ease",
  "&:hover": {
    backgroundColor: "#29b6f6",
    transform: "scale(1.05)",
    boxShadow: "0 6px 15px rgba(3,169,244,0.5)",
  },
});

const TertiaryButton = styled(Button)({
  padding: "10px 20px",
  fontSize: "1rem",
  backgroundColor: "#757575",
  color: "#fff",
  transition: "all 0.3s ease",
  "&:hover": {
    backgroundColor: "#9e9e9e",
    transform: "scale(1.05)",
    boxShadow: "0 4px 10px rgba(117,117,117,0.5)",
  },
});

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <HomeContainer>
      <Title>Home Page</Title>
      <ButtonGrid>
        {/* Strategy Actions */}
        <SecondaryButton onClick={() => navigate("/categorysort")}>Overview</SecondaryButton>
        <SecondaryButton onClick={() => navigate("/matches")}>Matches</SecondaryButton>
        <SecondaryButton onClick={() => navigate("/robots")}>Robots</SecondaryButton>

        {/* Main Action */}
        <MainButton onClick={() => navigate("/scoutMatch")}>Scout Match</MainButton>

        {/* Less Important Actions */}
        <TertiaryButton onClick={() => navigate("/signIn")}>Log Out</TertiaryButton>
        <TertiaryButton onClick={() => navigate("/admin")}>Admin</TertiaryButton>

        <UpdatePassword />
      </ButtonGrid>
    </HomeContainer>
  );
};

export default HomePage;
