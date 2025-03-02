// services/tbaMatches.js
export const fetchMatches = async (event_code) => {
  const tbaUrl = `https://www.thebluealliance.com/api/v3/event/${event_code}/matches/simple`;
  const response = await fetch(tbaUrl, {
    headers: {
      "X-TBA-Auth-Key": process.env.TBA_API_KEY,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch data from TBA API");
  }
  return await response.json();
};
