import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saveError, setSaveError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [editAdminDialogOpen, setEditAdminDialogOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: user?.name || '', email: user?.email || '', adminId: user?.adminId || '' });
  const [adminSaveError, setAdminSaveError] = useState('');
  const [adminSaveLoading, setAdminSaveLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/employees', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setEmployees(data);
        } else {
          setEmployees([]);
        }
      } catch (err) {
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleEditClick = (employee) => {
    setEditEmployee(employee);
    setEditForm({ ...employee });
    setEditDialogOpen(true);
    setSaveError('');
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Failed to save changes');
        setSaveLoading(false);
        return;
      }
      setEmployees((prev) => prev.map(emp => emp._id === data._id ? data : emp));
      setEditDialogOpen(false);
      setEditEmployee(null);
    } catch (err) {
      setSaveError('Network error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditEmployee(null);
    setEditForm({});
    setSaveError('');
  };

  const handleDelete = async () => {
    if (!editEmployee) return;
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
    setSaveLoading(true);
    setSaveError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/employees/${editEmployee._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || 'Failed to delete employee');
        setSaveLoading(false);
        return;
      }
      setEmployees((prev) => prev.filter(emp => emp._id !== editEmployee._id));
      setEditDialogOpen(false);
      setEditEmployee(null);
    } catch (err) {
      setSaveError('Network error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAdminEditOpen = () => {
    setAdminForm({ name: user?.name || '', email: user?.email || '', adminId: user?.adminId || '' });
    setEditAdminDialogOpen(true);
    setAdminSaveError('');
  };

  const handleAdminEditChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };

  const handleAdminEditSave = async (e) => {
    e.preventDefault();
    setAdminSaveLoading(true);
    setAdminSaveError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminSaveError(data.error || 'Failed to save changes');
        setAdminSaveLoading(false);
        return;
      }
      localStorage.setItem('user', JSON.stringify(data));
      setEditAdminDialogOpen(false);
    } catch (err) {
      setAdminSaveError('Network error');
    } finally {
      setAdminSaveLoading(false);
    }
  };

  const handleAdminEditDialogClose = () => {
    setEditAdminDialogOpen(false);
    setAdminSaveError('');
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Admin Dashboard</h1>
      <div className="card">
        <div className="card-content">
          <h2>Welcome, {user?.name || 'Admin'}!</h2>
          <p style={{ margin: '16px 0' }}>This is your admin dashboard. Here you can manage the application, view statistics, and perform admin-specific actions.</p>
          <div style={{ marginTop: '24px' }}>
            <strong>Admin Info:</strong>
            <ul style={{ marginTop: '8px', lineHeight: '1.7' }}>
              <li><b>Admin ID:</b> {user?.adminId}</li>
              <li><b>Email:</b> {user?.email}</li>
              <li><b>Role:</b> {user?.role}</li>
            </ul>
            <button className="button button-primary" style={{ marginTop: 16 }} onClick={handleAdminEditOpen}>
              Edit Admin Profile
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-content">
          <h2>All Employees</h2>
          {loading ? (
            <div className="loading"><div className="loading-spinner"></div></div>
          ) : (
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
                        <button className="icon-button" onClick={() => handleEditClick(employee)}>
                          <i className="icon">✏️</i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Employee Dialog */}
      {editDialogOpen && editEmployee && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2 className="dialog-title">Edit Employee</h2>
            <form className="dialog-content" onSubmit={handleEditSave}>
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input className="form-input" name="employeeId" value={editForm.employeeId || ''} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" name="firstName" value={editForm.firstName || ''} onChange={handleEditChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" name="lastName" value={editForm.lastName || ''} onChange={handleEditChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Father Name</label>
                <input className="form-input" name="fatherName" value={editForm.fatherName || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Mother Name</label>
                <input className="form-input" name="motherName" value={editForm.motherName || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" name="status" value={editForm.status || 'Pending'} onChange={handleEditChange}>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Validation Note</label>
                <input className="form-input" name="validationNote" value={editForm.validationNote || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Highest Qualification</label>
                <input className="form-input" name="highestQualification" value={editForm.highestQualification || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">DOB (Certificate)</label>
                <input className="form-input" name="dobAsPerCertificate" type="date" value={editForm.dobAsPerCertificate ? editForm.dobAsPerCertificate.substring(0,10) : ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">DOB (Celebration)</label>
                <input className="form-input" name="dobAsPerCelebration" type="date" value={editForm.dobAsPerCelebration ? editForm.dobAsPerCelebration.substring(0,10) : ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Marital Status</label>
                <select className="form-input" name="maritalStatus" value={editForm.maritalStatus || ''} onChange={handleEditChange}>
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Spouse Name</label>
                <input className="form-input" name="spouseName" value={editForm.spouseName || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Spouse DOB</label>
                <input className="form-input" name="spouseDateOfBirth" type="date" value={editForm.spouseDateOfBirth ? editForm.spouseDateOfBirth.substring(0,10) : ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Wedding Date</label>
                <input className="form-input" name="weddingDate" type="date" value={editForm.weddingDate ? editForm.weddingDate.substring(0,10) : ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Spouse Email</label>
                <input className="form-input" name="spouseEmail" value={editForm.spouseEmail || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <input className="form-input" name="bloodGroup" value={editForm.bloodGroup || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" name="email" type="email" value={editForm.email || ''} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" name="phone" value={editForm.phone || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" name="address" value={editForm.address || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" name="city" value={editForm.city || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" name="state" value={editForm.state || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input className="form-input" name="pincode" value={editForm.pincode || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Experience</label>
                <input className="form-input" name="experience" value={editForm.experience || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Current Salary</label>
                <input className="form-input" name="currentSalary" type="number" value={editForm.currentSalary || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Position</label>
                <input className="form-input" name="position" value={editForm.position || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">UAN Number</label>
                <input className="form-input" name="uanNumber" value={editForm.uanNumber || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">ESI Number</label>
                <input className="form-input" name="esiNumber" value={editForm.esiNumber || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Aadhar Number</label>
                <input className="form-input" name="aadharNumber" value={editForm.aadharNumber || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Names as on Aadhar</label>
                <input className="form-input" name="namesAsOnAadhar" value={editForm.namesAsOnAadhar || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">PAN Number</label>
                <input className="form-input" name="panNumber" value={editForm.panNumber || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Names as on PAN</label>
                <input className="form-input" name="namesAsOnPan" value={editForm.namesAsOnPan || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Bank Account Number</label>
                <input className="form-input" name="bankAccountNumber" value={editForm.bankAccountNumber || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Names as per Bank Details</label>
                <input className="form-input" name="namesAsPerBankDetails" value={editForm.namesAsPerBankDetails || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input className="form-input" name="bankName" value={editForm.bankName || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Branch Name</label>
                <input className="form-input" name="branchName" value={editForm.branchName || ''} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <input className="form-input" name="ifscCode" value={editForm.ifscCode || ''} onChange={handleEditChange} />
              </div>
              {saveError && <div className="login-error bouncy-error" style={{ marginBottom: 8 }}>{saveError}</div>}
              <div className="dialog-actions">
                <button type="button" className="button button-secondary" onClick={handleEditDialogClose}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={saveLoading}>
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="button button-secondary" style={{ color: 'red', borderColor: 'red' }} onClick={handleDelete} disabled={saveLoading}>
                  Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Dialog */}
      {editAdminDialogOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2 className="dialog-title">Edit Admin Profile</h2>
            <form className="dialog-content" onSubmit={handleAdminEditSave}>
              <div className="form-group">
                <label className="form-label">Admin ID</label>
                <input
                  className="form-input"
                  name="adminId"
                  value={adminForm.adminId}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  name="name"
                  value={adminForm.name}
                  onChange={handleAdminEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  name="email"
                  type="email"
                  value={adminForm.email}
                  onChange={handleAdminEditChange}
                  required
                />
              </div>
              {adminSaveError && <div className="login-error bouncy-error" style={{ marginBottom: 8 }}>{adminSaveError}</div>}
              <div className="dialog-actions">
                <button type="button" className="button button-secondary" onClick={handleAdminEditDialogClose}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={adminSaveLoading}>
                  {adminSaveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard; 