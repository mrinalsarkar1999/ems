import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import { getApiUrl } from "../../utils/api";

function EmployeeLogin() {
  const [form, setForm] = useState({
    employeeId: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(getApiUrl("/api/employee/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/";
    } catch (err) {
      setError("Network error");
    } finally {
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
        <h2 className="login-title">Employee Login</h2>
        <div className="login-field">
          <label htmlFor="employeeId">Employee ID</label>
          <input
            id="employeeId"
            name="employeeId"
            type="text"
            value={form.employeeId}
            onChange={handleChange}
            required
            className="bouncy-input"
          />
        </div>
        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
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
          <Link to="/employee/forgot-password" className="login-link">
            Forgot Password?
          </Link>
        </div>
        {/* <div className="login-footer">
          <span>Don't have an account?</span>
          <Link to="/employee/register" className="login-link">Employee Register</Link>
        </div> */}
      </form>
    </div>
  );
}

export default EmployeeLogin;
