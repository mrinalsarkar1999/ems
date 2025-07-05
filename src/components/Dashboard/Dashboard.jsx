import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [validationNote, setValidationNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [centreCodeFilter, setCentreCodeFilter] = useState('');

  // Get current user's centre code (for centre login)
  const user = JSON.parse(localStorage.getItem('user'));
  const userCentreCode = user?.centreCode || user?.centerCode || '';

  useEffect(() => {
    // Fetch both centers and employees
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // Fetch centers
        const centersResponse = await fetch('http://localhost:5000/api/centers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Fetch employees
        const employeesResponse = await fetch('http://localhost:5000/api/employees', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (centersResponse.ok) {
          const centersData = await centersResponse.json();
          setCenters(centersData);
        }

        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          setEmployees(employeesData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setCenters([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleViewCenter = (center) => {
    setSelectedCenter(center);
    setSelectedEmployee(null);
    setOpenDialog(true);
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setSelectedCenter(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCenter(null);
    setSelectedEmployee(null);
    setValidationNote('');
  };

  const handleApprove = async () => {
    if (!selectedEmployee) return;
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${selectedEmployee._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'Approved' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve employee');
      }

      const updatedEmployee = await response.json();

      setEmployees(employees.map(emp => 
        emp._id === selectedEmployee._id ? updatedEmployee : emp
      ));
      handleCloseDialog();
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleReject = async () => {
    if (!selectedEmployee) return;

    if (!validationNote.trim()) {
      alert('Validation note is required for rejection.');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${selectedEmployee._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'Rejected', validationNote }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject employee');
      }
      
      const updatedEmployee = await response.json();

      setEmployees(employees.map(emp => 
        emp._id === selectedEmployee._id ? updatedEmployee : emp
      ));
      handleCloseDialog();
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout" style={{ display: 'flex' }}>
      <nav className="sidebar" style={{ width: 220, minHeight: '100vh', background: '#f5f7fa', padding: '2rem 1rem', borderRight: '1px solid #e0e0e0' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: 24 }}>
            <a href="/dashboard" style={{ textDecoration: 'none', color: '#333', fontWeight: 600, fontSize: 18 }}>
              Dashboard
            </a>
          </li>
          <li style={{ marginBottom: 24 }}>
            <a href="/attendance-list" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 600, fontSize: 18 }}>
              Attendance
            </a>
          </li>
          <li style={{ marginBottom: 24 }}>
            <a href="/attendance-tracking" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 600, fontSize: 18 }}>
              Attendance Tracking
            </a>
          </li>
        </ul>
      </nav>
      <div style={{ flex: 1 }}>
        {/* Highlighted Center Name and Code */}
        {user && (user.centreName || user.centerName || userCentreCode) && (
          <div style={{
            background: '#e3f2fd',
            padding: '18px 24px 10px 24px',
            borderRadius: '0 0 12px 12px',
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.07)'
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1976d2', marginBottom: 2, textAlign: 'center' }}>
              {user.centreName || user.centerName || 'Center'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#333', textAlign: 'center' }}>
              Center Code: <span style={{ color: '#1976d2' }}>{userCentreCode}</span>
            </div>
          </div>
        )}
        <div className="dashboard-container">
          <h1 className="dashboard-title">Center Management Dashboard</h1>

          {/* Statistics Overview */}
          <div className="stats-container">
            {/* <div className="stat-card">
              <div className="stat-icon">
                <i className="icon">🏢</i>
              </div>
              <div className="stat-value">{centers.length}</div>
              <div className="stat-label">Total Centers</div>
            </div> */}

            <div className="stat-card">
              <div className="stat-icon">
                <i className="icon">👥</i>
              </div>
              <div className="stat-value">{employees.length}</div>
              <div className="stat-label">Total Employees</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="icon">✅</i>
              </div>
              <div className="stat-value">
                {employees.filter(emp => emp.status === 'Approved').length}
              </div>
              <div className="stat-label">Approved Employees</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="icon">⏳</i>
              </div>
              <div className="stat-value">
                {employees.filter(emp => emp.status === 'Pending').length}
              </div>
              <div className="stat-label">Pending Employees</div>
            </div>
          </div>

          {/* Employee List */}
          <div className="card">
            <div className="card-content">
              <h2>Employee Records</h2>
              <input
                type="text"
                placeholder="Filter by Centre Code"
                value={centreCodeFilter}
                onChange={e => setCentreCodeFilter(e.target.value)}
                style={{ marginBottom: 16, padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 220 }}
              />
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Centre Code</th>
                      <th>Position</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Join Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(centreCodeFilter
                      ? employees.filter(emp => (emp.centreCode || emp.centerCode || '').toLowerCase().includes(centreCodeFilter.toLowerCase()))
                      : (userCentreCode
                          ? employees.filter(emp => (emp.centreCode || emp.centerCode || '').toLowerCase() === userCentreCode.toLowerCase())
                          : employees)
                    ).map((employee) => (
                      <tr key={employee._id}>
                        <td>{employee.employeeId || '-'}</td>
                        <td>{employee.firstName} {employee.lastName}</td>
                        <td>{employee.centreCode || employee.centerCode || '-'}</td>
                        <td>{employee.position || '-'}</td>
                        <td>{employee.email || '-'}</td>
                        <td>
                          <span className={`status-chip status-${(employee.status || 'Pending').toLowerCase()}`}>
                            {employee.status || 'Pending'}
                          </span>
                        </td>
                        <td>{employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <button
                            className="icon-button"
                            onClick={() => handleViewEmployee(employee)}
                          >
                            <i className="icon">👁️</i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Employee Details Dialog */}
          {openDialog && selectedEmployee && (
            <div className="dialog-overlay">
              <div className="dialog">
                <h2 className="dialog-title">Employee Details</h2>
                <div className="dialog-content">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <div>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Position</label>
                    <div>{selectedEmployee.position || '-'}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <div>{selectedEmployee.email || '-'}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <div>
                      <span className={`status-chip status-${(selectedEmployee.status || 'Pending').toLowerCase()}`}>
                        {selectedEmployee.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Documents</label>
                    <ul>
                      {(selectedEmployee.documents || []).length === 0 && <li>No documents uploaded</li>}
                      {(selectedEmployee.documents || []).map((doc, index) => (
                        <li key={index}>
                          {doc.type || 'Document'}
                          {doc.url && (
                            <>
                              {' '}
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">[View]</a>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Validation Note</label>
                    <textarea
                      className="form-input"
                      value={validationNote}
                      onChange={(e) => setValidationNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="dialog-actions">
                  <button
                    className="button button-secondary"
                    onClick={handleCloseDialog}
                  >
                    Close
                  </button>
                  <button
                    className="button button-primary"
                    onClick={handleApprove}
                  >
                    Approve
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={handleReject}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Center Details Dialog */}
          {openDialog && selectedCenter && (
            <div className="dialog-overlay">
              <div className="dialog">
                <h2 className="dialog-title">Center Details</h2>
                <div className="dialog-content">
                  <div className="form-group">
                    <label className="form-label">Center Name</label>
                    <div>{selectedCenter.centreName}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Center Code</label>
                    <div>{selectedCenter.centreCode}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <div>{selectedCenter.username}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <div>{selectedCenter.email}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <div>
                      <span className={`status-chip status-${selectedCenter.role === 'admin' ? 'admin' : 'centre'}`}>{selectedCenter.role}</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registration Date</label>
                    <div>{selectedCenter.createdAt ? new Date(selectedCenter.createdAt).toLocaleString() : '-'}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Updated</label>
                    <div>{selectedCenter.updatedAt ? new Date(selectedCenter.updatedAt).toLocaleString() : '-'}</div>
                  </div>
                </div>
                <div className="dialog-actions">
                  <button className="button button-secondary" onClick={handleCloseDialog}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 