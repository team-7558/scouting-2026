import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { postSignIn } from "../requests/AuthRequests.js";

const SERVER_URL =
  process.env.NODE_ENV == "development"
    ? "http://localhost:3001/auth/signin"
    : "/auth/signin";

const SignInPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any previous error
    setError("");

    try {
      // Use Axios for the POST request
      const response = await postSignIn(username, password);

      // Store the JWT in localStorage or sessionStorage
      localStorage.setItem("token", response.data.token);

      // Redirect to the protected page after successful login
      navigate("/");
    } catch (err) {
      // Handle error (could be network or invalid credentials)
      if (err.response && err.response.status === 401) {
        setError("Invalid username or password");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div>
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit}>
        <center>
          <div>
            <label>Username:</label>
            <br></br>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        </center>
        <br></br>
        <center>
          <div>
            <label>Password:</label>
            <br></br>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </center>
        <br></br>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <center>
          <button className="button" type="submit">
            Sign In
          </button>
        </center>
      </form>
    </div>
  );
};

export default SignInPage;
