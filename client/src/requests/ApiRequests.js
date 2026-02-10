// client/src/requests/ApiRequests.js
import ApiClient from "./ApiClient";

import { getAuthHeaders } from "./AuthRequests.js";

const SERVER_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:3001/api" : process.env.REACT_APP_API_URL + "/api";

const api = new ApiClient(SERVER_URL);

export const postImportMatches = async (event_code) => {
  return api.post(`/matches`, { event_code }, { headers: getAuthHeaders() });
};

export const getScoutMatch = async ({ eventKey, station, matchKey }) => {
  return api.get(`/getScoutMatch`, {
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
  console.log("submitMatch", eventKey, matchKey, station, matchData, getAuthHeaders());
  return api.post(
    `/reports/submit`,
    { eventKey, matchKey, station, matchData },
    { headers: getAuthHeaders() }
  );
};

export const getReports = async ({ eventKey, matchKey, robot }) => {
  return api.get(`/reports/`, {
    params: { eventKey, matchKey, robot },
    headers: getAuthHeaders(),
  });
};
