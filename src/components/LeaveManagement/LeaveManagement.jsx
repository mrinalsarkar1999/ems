import React, { useState } from 'react';
import './LeaveManagement.css';

function LeaveManagement() {
  // Sample data for leave requests
  const [leaveRequests] = useState([
    {
      id: 1,
      type: 'Annual Leave',
      startDate: '2024-02-20',
      endDate: '2024-02-22',
      status: 'Approved',
      reason: 'Family vacation',
    },
    {
      id: 2,
      type: 'Sick Leave',
      startDate: '2024-02-15',
      endDate: '2024-02-16',
      status: 'Pending',
      reason: 'Medical appointment',
    },
    {
      id: 3,
      type: 'Emergency Leave',
      startDate: '2024-02-18',
      endDate: '2024-02-18',
      status: 'Approved',
      reason: 'Family emergency',
    },
  ]);

  // Sample attendance statistics
  const [attendanceStats] = useState({
    present: 45,
    absent: 5,
    total: 50,
  });

  // Calculate leave request statistics
  const pendingRequests = leaveRequests.filter(req => req.status === 'Pending').length;
  const approvedRequests = leaveRequests.filter(req => req.status === 'Approved').length;
  const rejectedRequests = leaveRequests.filter(req => req.status === 'Rejected').length;

  return (
    <div className="leave-management-container">
      <h1 className="leave-management-title">Leave Management</h1>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h2 className="stat-title">Pending Requests</h2>
          <div className="stat-value pending">{pendingRequests}</div>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Approved Requests</h2>
          <div className="stat-value approved">{approvedRequests}</div>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Rejected Requests</h2>
          <div className="stat-value rejected">{rejectedRequests}</div>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Total Requests</h2>
          <div className="stat-value total">{leaveRequests.length}</div>
        </div>
      </div>

      {/* Attendance Statistics */}
      <div className="attendance-stats">
        <div className="attendance-card">
          <h2 className="attendance-title">Present Today</h2>
          <div className="attendance-value present">{attendanceStats.present}</div>
          <div className="attendance-subtext">
            Out of {attendanceStats.total} employees
          </div>
        </div>
        <div className="attendance-card">
          <h2 className="attendance-title">Absent Today</h2>
          <div className="attendance-value absent">{attendanceStats.absent}</div>
          <div className="attendance-subtext">
            {((attendanceStats.absent / attendanceStats.total) * 100).toFixed(1)}% of total
          </div>
        </div>
        <div className="attendance-card">
          <h2 className="attendance-title">Attendance Rate</h2>
          <div className="attendance-value rate">
            {((attendanceStats.present / attendanceStats.total) * 100).toFixed(1)}%
          </div>
          <div className="attendance-subtext">
            Present employees
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.map((request) => (
              <tr key={request.id}>
                <td>{request.id}</td>
                <td>{request.type}</td>
                <td>{request.startDate}</td>
                <td>{request.endDate}</td>
                <td>
                  <span className={`status-chip status-${request.status.toLowerCase()}`}>
                    {request.status}
                  </span>
                </td>
                <td>{request.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaveManagement; 