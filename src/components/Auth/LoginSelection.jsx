import React from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

function LoginSelection() {
  return (
    <div className="login-bg">
      <div className="login-form bouncy" style={{ textAlign: 'center', padding: '40px' }}>
        <h2 className="login-title">Welcome to SynchroServe</h2>
        <p style={{ marginBottom: '30px', color: '#666' }}>
          Please select your login type
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Link to="/employee/login" className="login-btn bouncy-btn" style={{ 
            textDecoration: 'none', 
            display: 'block',
            padding: '15px 30px',
            fontSize: '16px'
          }}>
            👤 Employee Login
          </Link>
          
          <Link to="/centre/login" className="login-btn bouncy-btn" style={{ 
            textDecoration: 'none', 
            display: 'block',
            padding: '15px 30px',
            fontSize: '16px'
          }}>
            🏢 Centre Login
          </Link>

          <Link to="/admin/login" className="login-btn bouncy-btn" style={{ 
            textDecoration: 'none', 
            display: 'block',
            padding: '15px 30px',
            fontSize: '16px'
          }}>
            🛡️ Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginSelection; 