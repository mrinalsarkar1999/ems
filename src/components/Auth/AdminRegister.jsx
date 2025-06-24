import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

function AdminRegister() {
  const [form, setForm] = useState({
    adminId: '',
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const response = await fetch('http://localhost:5000/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate('/admin/login'), 1200);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <form className="login-form bouncy" onSubmit={handleSubmit} autoComplete="off">
        <h2 className="login-title">Admin Registration</h2>
        <div className="login-field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            className="bouncy-input"
          />
        </div>
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
        {error && <div className="login-error bouncy-error">{error}</div>}
        {success && <div className="login-success bouncy">Registration successful! Redirecting...</div>}
        <button type="submit" className={`login-btn bouncy-btn${loading ? ' loading' : ''}`} disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        <div className="login-footer">
          <span>Already have an account?</span>
          <Link to="/admin/login" className="login-link">Admin Login</Link>
        </div>
      </form>
    </div>
  );
}

export default AdminRegister; 