import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

function AdminLogin() {
  const [form, setForm] = useState({
    adminId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/';
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <form className="login-form bouncy" onSubmit={handleSubmit} autoComplete="off">
        <h2 className="login-title">Admin Login</h2>
        <div className="login-field">
          <label htmlFor="adminId">Admin ID</label>
          <input
            id="adminId"
            name="adminId"
            type="text"
            value={form.adminId}
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
        <button type="submit" className={`login-btn bouncy-btn${loading ? ' loading' : ''}`} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="login-footer">
          <span>Employee login?</span>
          <Link to="/employee/login" className="login-link">Employee Login</Link>
        </div>
        <div className="login-footer">
          <span>Centre login?</span>
          <Link to="/centre/login" className="login-link">Centre Login</Link>
        </div>
      </form>
    </div>
  );
}

export default AdminLogin; 