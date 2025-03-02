// webhook.js
import express from "express";
import { fetchMatches } from "../services/tba.js";
import {
  storeOrUpdateMatches,
  storeOrUpdateMatchesInternal,
} from "../database/matches.js";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log(req.body);
  const { message_type, message_data } = req.body;

  if (!message_type || !message_data) {
    return res.status(400).json({ message: "Missing required data" });
  }

  // Process only specific message types (adjust as needed)
  if (message_type !== "schedule_updated") {
    return res.status(200).json({ message: "Event ignored" });
  }

  const { event_key } = message_data;
  if (!event_key || !/^[a-zA-Z0-9_]+$/.test(event_key)) {
    return res.status(400).json({ message: "Invalid or missing event_key" });
  }

  try {
    // Fetch all matches for the event and update the database.
    const matches = await fetchMatches(event_key);
    await storeOrUpdateMatchesInternal(event_key, matches);
    res.json({
      message: "Matches updated successfully",
      count: matches.length,
    });
  } catch (error) {
    console.error("Error processing webhook data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
