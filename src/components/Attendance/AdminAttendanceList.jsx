import React, { useState, useEffect } from "react";
import "./Attendance.css";

function AdminAttendanceList() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeIdFilter, setEmployeeIdFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/attendance", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch attendance records");
        const data = await res.json();
        setAttendanceRecords(data);
      } catch (err) {
        setError(err.message || "Error fetching attendance");
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  // Filter records by employee ID and date
  const filteredRecords = attendanceRecords.filter((r) => {
    const matchesEmployee = employeeIdFilter
      ? (r.employeeId || "")
          .toLowerCase()
          .includes(employeeIdFilter.toLowerCase())
      : true;
    const matchesDate = dateFilter
      ? r.date && new Date(r.date).toISOString().slice(0, 10) === dateFilter
      : true;
    return matchesEmployee && matchesDate;
  });

  // Today's stats
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const todayRecords = attendanceRecords.filter((record) => {
    const recordDate = new Date(record.date);
    return recordDate.getTime() === startOfToday.getTime();
  });

  const checkedIn = todayRecords.filter(
    (r) => r.status === "Checked In"
  ).length;
  const checkedOut = todayRecords.filter(
    (r) => r.status === "Checked Out"
  ).length;
  const present = todayRecords.filter((r) => r.status === "Present").length;

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1 className="attendance-title">Attendance List (Admin)</h1>
      </div>
      {/* Today's Stats */}
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card stat-inline">
            <div className="stat-label">Checked In</div>
            <div className="stat-value">{checkedIn}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Checked Out</div>
            <div className="stat-value">{checkedOut}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Present</div>
            <div className="stat-value">{present}</div>
          </div>
        </div>
      </div>

      {/* Today's Records Table */}
      <div className="attendance-records">
        <div className="records-header">
          <h2 className="records-title">Today's Attendance Records</h2>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Working Hours</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>
                      No records found for today
                    </td>
                  </tr>
                ) : (
                  todayRecords.map((record, idx) => (
                    <tr key={record._id || idx}>
                      <td>{record.employeeId}</td>
                      <td>
                        {new Date(record.date).toLocaleDateString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </td>
                      <td>
                        {record.checkIn
                          ? new Date(record.checkIn).toLocaleTimeString(
                              "en-IN",
                              { timeZone: "Asia/Kolkata" }
                            )
                          : "Not checked in"}
                      </td>
                      <td>
                        {record.checkOut
                          ? new Date(record.checkOut).toLocaleTimeString(
                              "en-IN",
                              { timeZone: "Asia/Kolkata" }
                            )
                          : "Not checked out"}
                      </td>
                      <td>
                        <span
                          className={`status-chip status-${(record.status || "")
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td>
                        {typeof record.workingHours === "number"
                          ? `${record.workingHours.toFixed(2)} hours`
                          : "0 hours"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Records Table */}
      <div className="attendance-records">
        <div className="records-header">
          <h2 className="records-title">All Attendance Records</h2>
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <input
            className="form-input"
            placeholder="Filter by Employee ID"
            value={employeeIdFilter}
            onChange={(e) => setEmployeeIdFilter(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <input
            className="form-input"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ maxWidth: 180 }}
          />
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Working Hours</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, idx) => (
                    <tr key={record._id || idx}>
                      <td>{record.employeeId}</td>
                      <td>
                        {new Date(record.date).toLocaleDateString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </td>
                      <td>
                        {record.checkIn
                          ? new Date(record.checkIn).toLocaleTimeString(
                              "en-IN",
                              { timeZone: "Asia/Kolkata" }
                            )
                          : "Not checked in"}
                      </td>
                      <td>
                        {record.checkOut
                          ? new Date(record.checkOut).toLocaleTimeString(
                              "en-IN",
                              { timeZone: "Asia/Kolkata" }
                            )
                          : "Not checked out"}
                      </td>
                      <td>
                        <span
                          className={`status-chip status-${(record.status || "")
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td>
                        {typeof record.workingHours === "number"
                          ? `${record.workingHours.toFixed(2)} hours`
                          : "0 hours"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAttendanceList;
