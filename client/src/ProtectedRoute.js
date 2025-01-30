import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    // Redirect to sign-in page, and pass the original location in state
    return <Navigate to="/signIn" state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
