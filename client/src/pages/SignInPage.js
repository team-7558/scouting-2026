import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { postSignIn } from "../requests/AuthRequests.js";

const SignInPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Get the `from` location from state, or default to homepage
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      const response = await postSignIn(username, password);
      localStorage.setItem("token", response.data.token);

      // Redirect to the original page or homepage after successful login
      navigate(from);
    } catch (err) {
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
            <br />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        </center>
        <br />
        <center>
          <div>
            <label>Password:</label>
            <br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </center>
        <br />
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
