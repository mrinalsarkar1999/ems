import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './EmployeeHome.css';

function EmployeeHome() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [onboarded, setOnboarded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [employeeRecord, setEmployeeRecord] = useState(null);

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
            <div className="profile-avatar">
              <span>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
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
            <div className="onboarding-details-grid">
              <div><strong>First Name:</strong> {employeeRecord.firstName}</div>
              <div><strong>Last Name:</strong> {employeeRecord.lastName}</div>
              <div><strong>Email:</strong> {employeeRecord.email}</div>
              <div><strong>Phone:</strong> {employeeRecord.phone}</div>
              <div><strong>Address:</strong> {employeeRecord.address}</div>
              <div><strong>City:</strong> {employeeRecord.city}</div>
              <div><strong>State:</strong> {employeeRecord.state}</div>
              <div><strong>Pincode:</strong> {employeeRecord.pincode}</div>
              <div><strong>Highest Qualification:</strong> {employeeRecord.highestQualification}</div>
              <div><strong>Position:</strong> {employeeRecord.position}</div>
              <div><strong>Current Salary:</strong> {employeeRecord.currentSalary}</div>
              <div><strong>Marital Status:</strong> {employeeRecord.maritalStatus}</div>
              {employeeRecord.maritalStatus === 'Married' && (
                <>
                  <div><strong>Spouse Name:</strong> {employeeRecord.spouseName}</div>
                  <div><strong>Wedding Date:</strong> {employeeRecord.weddingDate ? new Date(employeeRecord.weddingDate).toLocaleDateString() : ''}</div>
                </>
              )}
              <div><strong>Blood Group:</strong> {employeeRecord.bloodGroup}</div>
              <div><strong>UAN Number:</strong> {employeeRecord.uanNumber}</div>
              <div><strong>ESI Number:</strong> {employeeRecord.esiNumber}</div>
              <div><strong>Aadhar Number:</strong> {employeeRecord.aadharNumber}</div>
              <div><strong>PAN Number:</strong> {employeeRecord.panNumber}</div>
              <div><strong>Bank Account Number:</strong> {employeeRecord.bankAccountNumber}</div>
              <div><strong>Bank Name:</strong> {employeeRecord.bankName}</div>
              <div><strong>Branch Name:</strong> {employeeRecord.branchName}</div>
              <div><strong>IFSC Code:</strong> {employeeRecord.ifscCode}</div>
            </div>
            {employeeRecord.emergencyContact && employeeRecord.emergencyContact.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <strong>Emergency Contacts:</strong>
                <ul>
                  {employeeRecord.emergencyContact.map((c, i) => (
                    <li key={i}>
                      {c.name} ({c.relationship}) - {c.phone}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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