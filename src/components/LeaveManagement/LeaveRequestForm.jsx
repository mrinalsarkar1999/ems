import React, { useState } from "react";
import "./LeaveRequestForm.css";

export default function LeaveRequestForm() {
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    leaveType: "Sick Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Leave Request Submitted!\n" + JSON.stringify(formData, null, 2));
    // You can replace alert with an API call
  };

  return (
    <div className="leave-form-container">
      <h2 className="leave-form-title">Leave Request Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Employee Name</label>
          <input
            type="text"
            className="form-input"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Employee ID</label>
          <input
            type="text"
            className="form-input"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Leave Type</label>
          <select
            className="form-select"
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
          >
            <option value="Sick Leave">Sick Leave</option>
            <option value="Casual Leave">Casual Leave</option>
            <option value="Earned Leave">Earned Leave</option>
            <option value="Maternity Leave">Maternity Leave</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-input"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">End Date</label>
          <input
            type="date"
            className="form-input"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Reason for Leave</label>
          <textarea
            className="form-textarea"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Submit Leave Request
        </button>
      </form>
    </div>
  );
} 