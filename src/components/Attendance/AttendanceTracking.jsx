import React, { useState, useEffect } from "react";
import "./Attendance.css";

function AttendanceTracking() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch attendance records from backend
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

  // Calculate stats for today
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

  // Demo data fallback with new structure
  const demoRecords = [
    {
      employeeId: "EMP001",
      date: startOfToday.toISOString(),
      checkIn: new Date().toISOString(),
      checkOut: null,
      status: "Checked In",
      workingHours: 0,
    },
    {
      employeeId: "EMP002",
      date: startOfToday.toISOString(),
      checkIn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      checkOut: new Date().toISOString(),
      status: "Checked Out",
      workingHours: 2.0,
    },
    {
      employeeId: "EMP003",
      date: startOfToday.toISOString(),
      checkIn: null,
      checkOut: null,
      status: "Present",
      workingHours: 0,
    },
    {
      employeeId: "EMP004",
      date: startOfToday.toISOString(),
      checkIn: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      checkOut: null,
      status: "Checked In",
      workingHours: 0,
    },
    {
      employeeId: "EMP005",
      date: startOfToday.toISOString(),
      checkIn: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      checkOut: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: "Checked Out",
      workingHours: 5.0,
    },
  ];

  // Use fetched records if available, otherwise demo data
  const recordsToShow = todayRecords.length > 0 ? todayRecords : demoRecords;

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1 className="attendance-title">Attendance Tracking</h1>
      </div>
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
                {recordsToShow.map((record, idx) => (
                  <tr key={record._id || idx}>
                    <td>{record.employeeId}</td>
                    <td>
                      {new Date(record.date).toLocaleDateString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </td>
                    <td>
                      {record.checkIn
                        ? new Date(record.checkIn).toLocaleTimeString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceTracking;
