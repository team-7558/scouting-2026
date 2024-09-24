import axios from "axios";

const SERVER_URL =
  process.env.NODE_ENV == "development"
    ? "http://localhost:3001/auth"
    : "/auth";

const SIGN_IN_ROUTE = SERVER_URL + "/signin";

//data will be the string we send from our server
export const postSignIn = async (username, password) => {
  return axios.post(SIGN_IN_ROUTE, {
    username,
    password,
  });
};
