// RobotPitScouting.js
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Box,
  Divider,
  Button,
  useTheme,
} from "@mui/material";

const RobotPitScouting = ({ pitScouting }) => {
  const theme = useTheme();
  const [showImage, setShowImage] = useState(true);

  if (!pitScouting) return null;

  const {
    team_number,
    team_name,
    tier,
    alg_descore,
    primary_role,
    auto_plans,
    picture,
    hp_pref,
    coral_pickup,
    endgame,
    driver_exp,
    drivetrain,
    algae_scoring,
    coral_scoring,
  } = pitScouting;

  const boolToYesNo = (value) =>
    typeof value === "boolean" ? (value ? "Yes" : "No") : "N/A";

  const renderListItem = (label, value) => (
    <ListItem
      disableGutters
      sx={{ py: 0.25, borderBottom: `1px solid ${theme.palette.divider}` }}
    >
      <ListItemText
        primary={
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: theme.palette.text.primary }}
          >
            {label}
          </Typography>
        }
        secondary={
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            {value || "N/A"}
          </Typography>
        }
      />
    </ListItem>
  );

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
        boxShadow: 3,
      }}
    >
      <Grid container alignItems="stretch">
        {picture && showImage && (
          <Grid item xs={12} sm={4} md={3}>
            <Box
              sx={{
                width: "100%",
                height: "100%",
                minHeight: { xs: 180, sm: 220 },
                overflow: "hidden",
              }}
            >
              <CardMedia
                component="img"
                image={picture}
                alt={`Robot ${team_number}`}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
          </Grid>
        )}
        <Grid
          item
          xs={12}
          sm={picture ? 8 : 12}
          md={picture ? 9 : 12}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  fontSize: { xs: "1.3rem", sm: "1.5rem" },
                }}
              >
                {team_name
                  ? `${team_name} (Robot ${team_number})`
                  : `Robot ${team_number}`}
              </Typography>
              {picture && (
                <Button
                  variant="text"
                  onClick={() => setShowImage((prev) => !prev)}
                >
                  {showImage ? "Hide Image" : "Show Image"}
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 1.5 }} />
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <List dense>
                  {renderListItem("Tier", tier)}
                  {renderListItem("Alg De-score", boolToYesNo(alg_descore))}
                  {renderListItem("Primary Role", primary_role)}
                  {renderListItem("Auto Plans", auto_plans)}
                  {renderListItem("HP Pref", hp_pref)}
                </List>
              </Grid>
              <Grid item xs={12} sm={6}>
                <List dense>
                  {renderListItem("Coral Pickup", coral_pickup)}
                  {renderListItem("Endgame", endgame)}
                  {renderListItem("Driver Exp.", driver_exp)}
                  {renderListItem("Drivetrain", drivetrain)}
                  {renderListItem("Algae Scoring", algae_scoring)}
                  {renderListItem("Coral Scoring", coral_scoring)}
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  );
};

export default RobotPitScouting;
