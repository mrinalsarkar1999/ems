import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import { getApiUrl } from "../../utils/api";

function EmployeeRegister() {
  const [form, setForm] = useState({
    employeeId: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    centerCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Check if current user is admin
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = currentUser?.userType === "admin";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const registrationData = { ...form, status: "Pending" };
      const response = await fetch(getApiUrl("/api/employee/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      setSuccess(true);
      // Redirect based on user type
      const redirectPath = isAdmin ? "/admin/dashboard" : "/employee/login";
      setTimeout(() => navigate(redirectPath), 1200);
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
        <h2 className="login-title">Employee Registration</h2>
        {isAdmin && (
          <div
            style={{
              background: "#e3f2fd",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "20px",
              textAlign: "center",
              color: "#1976d2",
              fontSize: "14px",
            }}
          >
            Registering as Admin - Will return to Admin Dashboard
          </div>
        )}
        <div className="login-field">
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={form.firstName}
            onChange={handleChange}
            required
            className="bouncy-input"
          />
        </div>
        <div className="login-field">
          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={form.lastName}
            onChange={handleChange}
            required
            className="bouncy-input"
          />
        </div>
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
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
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
        <div className="login-field">
          <label htmlFor="centreName">Centre Name</label>
          <input
            id="centreName"
            name="centreName"
            type="text"
            value={form.centreName}
            onChange={handleChange}
            required
            className="bouncy-input"
          />
        </div>
        <div className="login-field">
          <label htmlFor="centerCode">Center Code</label>
          <input
            id="centerCode"
            name="centerCode"
            type="text"
            value={form.centerCode}
            onChange={handleChange}
            required
            className="bouncy-input"
          />
        </div>
        {error && <div className="login-error bouncy-error">{error}</div>}
        {success && (
          <div className="login-success bouncy">
            Registration successful! Redirecting to{" "}
            {isAdmin ? "Admin Dashboard" : "Employee Login"}...
          </div>
        )}
        <button
          type="submit"
          className={`login-btn bouncy-btn${loading ? " loading" : ""}`}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        {isAdmin && (
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <Link
              to="/admin/dashboard"
              className="login-link"
              style={{ color: "#1976d2" }}
            >
              ← Back to Admin Dashboard
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}

export default EmployeeRegister;
