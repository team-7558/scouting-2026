import React from "react";
import { jwtDecode } from "jwt-decode";
import { Navigate, useLocation } from "react-router-dom";

export const getSignedInUser = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }

  let decodedToken = jwtDecode(token);
  // console.log("Decoded Token", decodedToken);
  let currentDate = new Date();
  console.log(decodedToken);
  return decodedToken;
};

export const hasValidToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }

  let decodedToken = jwtDecode(token);
  // console.log("Decoded Token", decodedToken);
  let currentDate = new Date();
  return decodedToken.exp * 1000 > currentDate.getTime();
};
export const ProtectedRoute = ({ children }) => {
  // console.log(location);
  if (!hasValidToken()) {
    // Redirect to sign-in page, and pass the original location in state
    return (
      <Navigate
        to={`/signIn?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`}
      />
    );
  }
  return children;
};
