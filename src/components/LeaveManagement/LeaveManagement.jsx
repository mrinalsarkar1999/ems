import React, { useState, useEffect } from "react";
import LeaveRequestForm from "./LeaveRequestForm";
import "./LeaveManagement.css";
import { apiCall } from "../../utils/api";

function LeaveManagement() {
  const [showForm, setShowForm] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveStats, setLeaveStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [leaveBalance, setLeaveBalance] = useState({
    paidLeavesUsed: 0,
    paidLeavesRemaining: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);

    if (token) {
      fetchLeaveRequests(token);
      fetchLeaveStats(token);
      if (userData.userType === "employee") {
        fetchLeaveBalance(token);
      }
    }
  }, []);

  const fetchLeaveRequests = async (token) => {
    try {
      const data = await apiCall("/api/leaves");
      setLeaveRequests(data);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
      setError("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveStats = async (token) => {
    try {
      const data = await apiCall("/api/leaves/stats");
      setLeaveStats(data);
    } catch (err) {
      console.error("Error fetching leave statistics:", err);
    }
  };

  const fetchLeaveBalance = async (token) => {
    try {
      const data = await apiCall("/api/leaves/balance");
      setLeaveBalance(data);
    } catch (err) {
      console.error("Error fetching leave balance:", err);
    }
  };

  const handleLeaveSubmitted = () => {
    setShowForm(false);
    const token = localStorage.getItem("token");
    if (token) {
      fetchLeaveRequests(token);
      fetchLeaveStats(token);
    }
  };

  const handleStatusUpdate = async (leaveId, status, rejectionReason = "") => {
    try {
      await apiCall(`/api/leaves/${leaveId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, rejectionReason }),
      });

      // Refresh the data
      const token = localStorage.getItem("token");
      fetchLeaveRequests(token);
      fetchLeaveStats(token);
    } catch (err) {
      console.error("Error updating leave status:", err);
      setError("Failed to update leave status");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "pending";
      case "approved":
        return "approved";
      case "rejected":
        return "rejected";
      default:
        return "pending";
    }
  };

  if (loading) {
    return (
      <div className="leave-management-container">
        <div className="loading">Loading leave data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leave-management-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="leave-management-container">
      <div className="leave-header">
        <h1 className="leave-management-title">Leave Management</h1>
        {user?.userType === "employee" && (
          <button className="apply-leave-btn" onClick={() => setShowForm(true)}>
            Apply for Leave
          </button>
        )}
      </div>

      {/* Leave Balance Card for Employees */}
      {user?.userType === "employee" && (
        <div className="leave-balance-card">
          <h2>Paid Leave Balance (This Month)</h2>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div>
              <b>Used:</b> {leaveBalance.paidLeavesUsed} / 1
            </div>
            <div>
              <b>Remaining:</b> {leaveBalance.paidLeavesRemaining}
            </div>
            <div>
              <b>LOP Hours:</b> {leaveBalance.lopHours || 0}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h2 className="stat-title">Pending Requests</h2>
          <div className="stat-value pending">{leaveStats.pending}</div>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Approved Requests</h2>
          <div className="stat-value approved">{leaveStats.approved}</div>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Rejected Requests</h2>
          <div className="stat-value rejected">{leaveStats.rejected}</div>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Total Requests</h2>
          <div className="stat-value total">{leaveStats.total}</div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="table-container">
        <h2 className="table-title">Leave Requests</h2>
        {leaveRequests.length === 0 ? (
          <div className="no-data">No leave requests found.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Category</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
                {(user?.userType === "centre" ||
                  user?.userType === "admin") && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => (
                <tr key={request._id}>
                  <td>{request.employeeName}</td>
                  <td>{request.leaveType}</td>
                  <td>{request.leaveCategory || "-"}</td>
                  <td>{formatDate(request.startDate)}</td>
                  <td>{formatDate(request.endDate)}</td>
                  <td>{request.totalDays}</td>
                  <td>
                    <span
                      className={`status-chip status-${getStatusColor(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="reason-cell">{request.reason}</td>
                  {(user?.userType === "centre" ||
                    user?.userType === "admin") && (
                    <td className="actions-cell">
                      {request.status === "Pending" && (
                        <div className="action-buttons">
                          <button
                            className="approve-btn"
                            onClick={() =>
                              handleStatusUpdate(request._id, "Approved")
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => {
                              const reason = prompt(
                                "Please provide a reason for rejection:"
                              );
                              if (reason) {
                                handleStatusUpdate(
                                  request._id,
                                  "Rejected",
                                  reason
                                );
                              }
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {request.status === "Approved" && (
                        <span className="approved-by">
                          Approved by: {request.approvedBy}
                        </span>
                      )}
                      {request.status === "Rejected" && (
                        <span className="rejection-reason">
                          Reason: {request.rejectionReason}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Leave Request Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Apply for Leave</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <LeaveRequestForm onLeaveSubmitted={handleLeaveSubmitted} />
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveManagement;
