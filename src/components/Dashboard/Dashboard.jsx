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
    <div className="dashboard-container">
      <h1 className="dashboard-title">Center Management Dashboard</h1>

      {/* Statistics Overview */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="icon">🏢</i>
          </div>
          <div className="stat-value">{centers.length}</div>
          <div className="stat-label">Total Centers</div>
        </div>

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
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.firstName} {employee.lastName}</td>
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

      {/* Centers List */}
      <div className="card">
        <div className="card-content">
          <h2>Registered Centers</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Center Name</th>
                  <th>Center Code</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {centers.map((center) => (
                  <tr key={center._id}>
                    <td>{center.centreName}</td>
                    <td>{center.centreCode}</td>
                    <td>{center.username}</td>
                    <td>{center.email}</td>
                    <td>
                      <span className={`status-chip status-${center.role === 'admin' ? 'admin' : 'centre'}`}>
                        {center.role}
                      </span>
                    </td>
                    <td>{center.createdAt ? new Date(center.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <button
                        className="icon-button"
                        onClick={() => handleViewCenter(center)}
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
                  <span className={`status-chip status-${selectedCenter.role === 'admin' ? 'admin' : 'centre'}`}>
                    {selectedCenter.role}
                  </span>
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
              <button
                className="button button-secondary"
                onClick={handleCloseDialog}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard; 