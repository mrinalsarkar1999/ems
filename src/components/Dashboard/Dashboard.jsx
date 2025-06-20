import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [validationNote, setValidationNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  // Sample data for centers
  const [centers] = useState([
    {
      id: 1,
      name: 'Main Center',
      location: 'New York',
      employeeCount: 150,
      status: 'Active',
    },
    {
      id: 2,
      name: 'Branch Office',
      location: 'Los Angeles',
      employeeCount: 75,
      status: 'Active',
    },
    {
      id: 3,
      name: 'Remote Center',
      location: 'Chicago',
      employeeCount: 50,
      status: 'Inactive',
    },
  ]);

  useEffect(() => {
    // Fetch employees from backend
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/getemployees');
        if (!response.ok) throw new Error('Failed to fetch employees');
        const data = await response.json();
        setEmployees(data);
      } catch (err) {
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmployee(null);
    setValidationNote('');
  };

  const handleApprove = () => {
    // Implement approval logic
    console.log('Approved employee:', selectedEmployee?._id);
    handleCloseDialog();
  };

  const handleReject = () => {
    // Implement rejection logic
    console.log('Rejected employee:', selectedEmployee?._id);
    handleCloseDialog();
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
      <h1 className="dashboard-title">Center Dashboard</h1>

      {/* Statistics Overview */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="icon">👥</i>
          </div>
          <div className="stat-value">{employees.length}</div>
          <div className="stat-label">Total Employees</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="icon">📍</i>
          </div>
          <div className="stat-value">{centers.length}</div>
          <div className="stat-label">Active Centers</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="icon">💼</i>
          </div>
          <div className="stat-value">
            {employees.filter(emp => emp.status === 'Approved').length}
          </div>
          <div className="stat-label">Active Employees</div>
        </div>
      </div>

      {/* Employee List */}
      <div className="card">
        <div className="card-content">
          <h2>Employee List</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.firstName} {employee.lastName}</td>
                    <td>{employee.position || employee.highestQualification || '-'}</td>
                    <td>
                      <span className={`status-chip status-${(employee.status || 'Pending').toLowerCase()}`}>
                        {employee.status || 'Pending'}
                      </span>
                    </td>
                    <td>{employee.joinDate || (employee.createdAt ? employee.createdAt.substring(0, 10) : '-')}</td>
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
          <h2>Centers</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Employees</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {centers.map((center) => (
                  <tr key={center.id}>
                    <td>{center.name}</td>
                    <td>{center.location}</td>
                    <td>{center.employeeCount}</td>
                    <td>
                      <span className={`status-chip status-${center.status.toLowerCase()}`}>
                        {center.status}
                      </span>
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
                <div>{selectedEmployee.position || selectedEmployee.highestQualification || '-'}</div>
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
    </div>
  );
}

export default Dashboard; 