// client/src/requests/ApiRequests.js
import ApiClient from "./ApiClient";

import { getAuthHeaders } from "./AuthRequests.js";

const SERVER_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:3001/api" : "/api";

const api = new ApiClient("http://localhost:3001/api");

export const postImportMatches = async (event_code) => {
  return api.post(
    `${SERVER_URL}/matches`,
    { event_code },
    { headers: getAuthHeaders() }
  );
};

export const getScoutMatch = async ({ eventKey, station, matchCode }) => {
  return api.get(`${SERVER_URL}/getScoutMatch`, {
    params: { eventKey, station, matchCode },
    headers: getAuthHeaders(),
  });
};
