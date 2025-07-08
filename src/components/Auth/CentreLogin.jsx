import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import { getApiUrl } from "../../utils/api";

function CentreLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(getApiUrl("/api/centre/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setLoading(false);
      window.location.replace("/");
    } catch (err) {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <form
        className="login-form bouncy"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <h2 className="login-title">Centre Login</h2>
        <div className="login-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            className="bouncy-input"
          />
        </div>
        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bouncy-input"
          />
        </div>
        {error && <div className="login-error bouncy-error">{error}</div>}
        <button
          type="submit"
          className={`login-btn bouncy-btn${loading ? " loading" : ""}`}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <div
          className="login-footer"
          style={{ marginTop: 16, textAlign: "center" }}
        >
          <Link to="/centre/forgot-password" className="login-link">
            Forgot Password?
          </Link>
        </div>
        {/* <div className="login-footer">
          <span>Don't have an account?</span>
          <Link to="/centre/register" className="login-link">Register as Centre</Link>
        </div> */}
      </form>
    </div>
  );
}

export default CentreLogin;
