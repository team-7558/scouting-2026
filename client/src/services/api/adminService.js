import ApiClient from "./apiClient";
import { getAuthHeaders } from "./authService.js";

const SERVER_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/api/admin"
    : "/api/admin";

const api = new ApiClient(SERVER_URL);

export const postImportPitScouting = async ({ eventKey, databaseId }) => {
  return api.post(
    `/importNotionPitScouting`,
    { eventKey, databaseId },
    { headers: getAuthHeaders() }
  );
};
