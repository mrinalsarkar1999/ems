import React, { useState } from "react";
import "./LeaveRequestForm.css";
import { apiCall } from "../../utils/api";

export default function LeaveRequestForm({ onLeaveSubmitted }) {
  const [formData, setFormData] = useState({
    leaveType: "Sick Leave",
    startDate: "",
    endDate: "",
    reason: "",
    totalDays: 1,
    permissionSlot: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await apiCall("/api/leaves", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      console.log("Leave request submitted successfully:", result);

      // Reset form
      setFormData({
        leaveType: "Sick Leave",
        startDate: "",
        endDate: "",
        reason: "",
        totalDays: 1,
        permissionSlot: "",
      });

      // Notify parent component
      if (onLeaveSubmitted) {
        onLeaveSubmitted();
      }

      alert("Leave request submitted successfully!");
    } catch (err) {
      console.error("Error submitting leave request:", err);
      setError(err.message || "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leave-form-container">
      <h2 className="leave-form-title">Leave Request Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="leaveType">Leave Type</label>
          <select
            id="leaveType"
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Select Leave Type</option>
            <option value="Full Day Leave">Full Day Leave</option>
            <option value="Half Day Leave">Half Day Leave</option>
            <option value="2 Hours Permission">2 Hours Permission</option>
          </select>
        </div>

        {formData.leaveType === "2 Hours Permission" && (
          <div className="form-group">
            <label htmlFor="permissionSlot">Permission Slot</label>
            <select
              id="permissionSlot"
              name="permissionSlot"
              value={formData.permissionSlot}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select Slot</option>
              <option value="Morning (9-11 AM)">Morning (9-11 AM)</option>
              <option value="Afternoon (4-6 PM)">Afternoon (4-6 PM)</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-input"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]}
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
            min={formData.startDate || new Date().toISOString().split("T")[0]}
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
            placeholder="Please provide a detailed reason for your leave request..."
            rows="4"
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Submitting..." : "Submit Leave Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
