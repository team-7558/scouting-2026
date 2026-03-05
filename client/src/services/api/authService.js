import axios from "axios";

const SERVER_URL =
  process.env.NODE_ENV == "development"
    ? "http://localhost:3001/auth"
    : process.env.REACT_APP_API_URL + "/auth";

const SIGN_IN_ROUTE = SERVER_URL + "/signin";
const CREATE_USER_ROUTE = SERVER_URL + "/createUser";
const UPDATE_PASSWORD_ROUTE = SERVER_URL + "/updatePassword"; // New API endpoint

// Function to get the token from localStorage
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { authorization: token } : {};
};

// Sign-in request
export const postSignIn = async (username, password) => {
  return axios.post(SIGN_IN_ROUTE, { username, password });
};

// Create user request (with auto-included token)
export const postCreateUser = async (username, password, role) => {
  return axios.post(
    CREATE_USER_ROUTE,
    { username, password, role },
    { headers: getAuthHeaders() } // Automatically include token
  );
};

// Update password request (with token authentication)
export const postUpdatePassword = async (oldPassword, newPassword) => {
  return axios.post(
    UPDATE_PASSWORD_ROUTE,
    { oldPassword, newPassword },
    { headers: getAuthHeaders() }
  );
};
