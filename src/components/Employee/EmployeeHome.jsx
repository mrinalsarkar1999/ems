import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './EmployeeHome.css';

function EmployeeHome() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [onboarded, setOnboarded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [employeeRecord, setEmployeeRecord] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchOnboardingStatus() {
      if (!user?.employeeId && !user?.username) return;
      try {
        const res = await fetch(`http://localhost:5000/api/employee/onboarding-status?employeeId=${user.employeeId || ''}&username=${user.username || ''}`);
        const data = await res.json();
        setOnboarded(data.onboarded);
      } catch (err) {
        setOnboarded(true); // fail safe: don't block UI
      } finally {
        setLoading(false);
      }
    }
    fetchOnboardingStatus();
  }, [user?.employeeId, user?.username]);

  // Fetch employee onboarding record after onboarding is complete
  useEffect(() => {
    async function fetchEmployeeRecord() {
      if (!onboarded || (!user?.employeeId && !user?.username)) return;
      try {
        const res = await fetch(`http://localhost:5000/api/employee/record?employeeId=${user.employeeId || ''}&username=${user.username || ''}`);
        if (res.ok) {
          const data = await res.json();
          setEmployeeRecord(data);
        }
      } catch {}
    }
    fetchEmployeeRecord();
  }, [onboarded, user?.employeeId, user?.username]);

  // Fetch latest user info on mount
  useEffect(() => {
    async function fetchUserInfo() {
      if (!user?.employeeId) return;
      try {
        const res = await fetch(`http://localhost:5000/api/employee/info?employeeId=${user.employeeId}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        }
      } catch {}
    }
    fetchUserInfo();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="employee-home">
      {!loading && !onboarded && (
        <div className="onboarding-warning" style={{color: 'orange', margin: '16px 0', fontWeight: 'bold'}}>
          Please complete the onboarding process.
        </div>
      )}
      <div className="welcome-section">
        <div className="welcome-card">
          <div className="profile-header">
            <div className="profile-avatar" style={{ position: 'relative' }}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
              )}
              <button
                type="button"
                className="edit-avatar-btn"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Change profile picture"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/></svg>
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => setProfileImage(ev.target.result);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <div className="profile-info">
              <h1>Welcome back, {user?.firstName}!</h1>
              <p className="employee-role">Employee</p>
              <p className="employee-id">ID: {user?.employeeId}</p>
            </div>
          </div>
          
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-number">0</div>
              <div className="stat-label">Pending Tasks</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">0</div>
              <div className="stat-label">Leave Balance</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">0</div>
              <div className="stat-label">Attendance Days</div>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/onboarding" className="action-card">
            <div className="action-icon">📝</div>
            <h3>Onboarding</h3>
            <p>Complete your onboarding process</p>
          </Link>
          {user?.status === 'Approved' && (
            <>
              <Link to="/attendance" className="action-card">
                <div className="action-icon">📅</div>
                <h3>Attendance</h3>
                <p>Mark your attendance and view records</p>
              </Link>
              <Link to="/leave" className="action-card">
                <div className="action-icon">🏖️</div>
                <h3>Leave Management</h3>
                <p>Request and manage your leaves</p>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">✅</div>
            <div className="activity-content">
              <h4>Profile Updated</h4>
              <p>Your profile information was updated</p>
              <span className="activity-time">Just now</span>
            </div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon">📧</div>
            <div className="activity-content">
              <h4>Welcome Email Sent</h4>
              <p>Welcome email sent to {user?.email}</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-details">
        <h2>Profile Details</h2>
        <div className="profile-grid">
          <div className="profile-field">
            <label>Full Name</label>
            <span>{user?.firstName} {user?.lastName}</span>
          </div>
          
          <div className="profile-field">
            <label>Employee ID</label>
            <span>{user?.employeeId}</span>
          </div>
          
          <div className="profile-field">
            <label>Email</label>
            <span>{user?.email}</span>
          </div>
          
          <div className="profile-field">
            <label>Role</label>
            <span className="role-badge">{user?.role}</span>
          </div>
          <div className="profile-field">
            <label>Center Code</label>
            <span>{user?.centerCode || <span className="placeholder">Not provided</span>}</span>
          </div>
          
          <div className="profile-field">
            <label>Account Created</label>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          
          <div className="profile-field">
            <label>Status</label>
            <span className={`status-badge ${user?.status?.toLowerCase()}`}>{user?.status || "Pending"}</span>
          </div>
        </div>
        {employeeRecord && (
          <div className="onboarding-details">
            <h2>Onboarding Details</h2>
            <table className="onboarding-table">
              <tbody>
                <tr><th>First Name</th><td>{employeeRecord.firstName || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Last Name</th><td>{employeeRecord.lastName || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Email</th><td>{employeeRecord.email || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Phone</th><td>{employeeRecord.phone || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Address</th><td>{employeeRecord.address || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>City</th><td>{employeeRecord.city || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>State</th><td>{employeeRecord.state || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Pincode</th><td>{employeeRecord.pincode || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Highest Qualification</th><td>{employeeRecord.highestQualification || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Position</th><td>{employeeRecord.position || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Current Salary</th><td>{employeeRecord.currentSalary || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Marital Status</th><td>{employeeRecord.maritalStatus || <span className="placeholder">Not provided</span>}</td></tr>
                {employeeRecord.maritalStatus === 'Married' && (
                  <>
                    <tr><th>Spouse Name</th><td>{employeeRecord.spouseName || <span className="placeholder">Not provided</span>}</td></tr>
                    <tr><th>Wedding Date</th><td>{employeeRecord.weddingDate ? new Date(employeeRecord.weddingDate).toLocaleDateString() : <span className="placeholder">Not provided</span>}</td></tr>
                  </>
                )}
                <tr><th>Blood Group</th><td>{employeeRecord.bloodGroup || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>UAN Number</th><td>{employeeRecord.uanNumber || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>ESI Number</th><td>{employeeRecord.esiNumber || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Aadhar Number</th><td>{employeeRecord.aadharNumber || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>PAN Number</th><td>{employeeRecord.panNumber || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Bank Account Number</th><td>{employeeRecord.bankAccountNumber || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Bank Name</th><td>{employeeRecord.bankName || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>Branch Name</th><td>{employeeRecord.branchName || <span className="placeholder">Not provided</span>}</td></tr>
                <tr><th>IFSC Code</th><td>{employeeRecord.ifscCode || <span className="placeholder">Not provided</span>}</td></tr>
                {employeeRecord.emergencyContact && employeeRecord.emergencyContact.length > 0 && employeeRecord.emergencyContact.map((c, i) => (
                  <tr key={i}><th>{`Emergency Contact${employeeRecord.emergencyContact.length > 1 ? ' ' + (i+1) : ''}`}</th><td>{(c.name && c.relationship && c.phone) ? `${c.name} (${c.relationship}) - ${c.phone}` : <span className="placeholder">Not provided</span>}</td></tr>
                ))}
              </tbody>
            </table>
            {employeeRecord.documents && employeeRecord.documents.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <strong>Documents:</strong>
                <ul>
                  {employeeRecord.documents.map((doc, i) => (
                    <li key={i}>
                      {doc.type}: {doc.url ? <a href={doc.url} target="_blank" rel="noopener noreferrer">View</a> : 'Not uploaded'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeHome; 