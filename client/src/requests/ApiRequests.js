// client/src/requests/ApiRequests.js
import ApiClient from "./ApiClient";

import { getAuthHeaders } from "./AuthRequests.js";

const SERVER_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:3001/api" : "/api";

const api = new ApiClient(SERVER_URL);

export const postImportMatches = async (event_code) => {
  return api.post(
    `${SERVER_URL}/matches`,
    { event_code },
    { headers: getAuthHeaders() }
  );
};

export const getScoutMatch = async ({ eventKey, station, matchKey }) => {
  return api.get(`${SERVER_URL}/getScoutMatch`, {
    params: { eventKey, station, matchKey },
    headers: getAuthHeaders(),
  });
};

export const submitMatch = async ({
  eventKey,
  matchKey,
  station,
  matchData,
}) => {
  return api.post(
    `${SERVER_URL}/reports/submit`,
    { eventKey, matchKey, station, matchData },
    { headers: getAuthHeaders() }
  );
};
