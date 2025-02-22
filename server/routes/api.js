import express from "express";
import { storeMatches } from "../database/matches.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

// POST route to fetch and store match data based on event_code provided in the request body.
router.post("/matches", async (req, res) => {
  // Expecting { event_code: "your_event_code_here" } in the request body
  const { event_code } = req.body;

  // Validate the event_code to allow only alphanumeric characters and underscores
  if (!event_code || !/^[a-zA-Z0-9_]+$/.test(event_code)) {
    return res.status(400).json({ message: "Invalid or missing event code" });
  }

  // Build the URL for the TBA API match_simple endpoint.
  const tbaUrl = `https://www.thebluealliance.com/api/v3/event/${event_code}/matches/simple`;

  try {
    // Use global fetch (available in Node 18+; otherwise install and import node-fetch)
    const response = await fetch(tbaUrl, {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY, // Ensure your API key is set in your environment variables.
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return res.status(500).json({
        message: "Failed to fetch data from TBA API: " + res.message,
      });
    }

    const matches = await response.json();

    // Call the database module to store the matches in a table named matches_{event_code}
    await storeMatches(req, event_code, matches);

    res.json({ message: "Matches stored successfully", count: matches.length });
  } catch (error) {
    console.error("Error processing match data:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

export default router;
