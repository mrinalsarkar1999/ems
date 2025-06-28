import React, { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import Webcam from "react-webcam";
import "./Attendance.css";

function Attendance() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCalendar, setShowCalendar] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaveBalance] = useState([
    {
      type: "Annual Leave",
      total: 20,
      used: 5,
      remaining: 15,
    },
    {
      type: "Sick Leave",
      total: 10,
      used: 2,
      remaining: 8,
    },
  ]);

  // Face Auth & GPS state
  const webcamRef = useRef(null);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [faceAuthMessage, setFaceAuthMessage] = useState("");
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [faceModalType, setFaceModalType] = useState(null); // 'checkin' or 'checkout'
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successDetails, setSuccessDetails] = useState({});

  // Get current user info
  const user = JSON.parse(localStorage.getItem("user"));
  const currentEmployeeId = user?.employeeId || "EMP001";

  // Fetch attendance records for current employee
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/attendance", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch attendance records");
        const data = await res.json();

        // Filter records for current employee only
        const employeeRecords = data.filter(
          (record) => record.employeeId === currentEmployeeId
        );
        setAttendanceRecords(employeeRecords);
      } catch (err) {
        setError(err.message || "Error fetching attendance records");
        // Use demo data if API fails
        setAttendanceRecords([
          {
            id: 1,
            employeeId: currentEmployeeId,
            date: "2024-03-20",
            checkIn: "09:00",
            checkOut: "18:00",
            status: "Present",
            workingHours: 9,
            overtime: 0,
          },
          {
            id: 2,
            employeeId: currentEmployeeId,
            date: "2024-03-19",
            checkIn: "09:15",
            checkOut: "18:00",
            status: "Late",
            workingHours: 8.75,
            overtime: 0,
          },
          {
            id: 3,
            employeeId: currentEmployeeId,
            date: "2024-03-18",
            checkIn: "09:00",
            checkOut: "17:00",
            status: "Present",
            workingHours: 8,
            overtime: 0,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceRecords();
  }, [currentEmployeeId]);

  // Get user's location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          console.log("Location captured:", {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setFaceAuthMessage(
            "Location access denied. Please enable location services."
          );
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setFaceAuthMessage("Geolocation is not supported by this browser.");
    }
  }, []);

  const handleCheckIn = () => {
    setFaceModalType("checkin");
    setFaceModalOpen(true);
    setFaceAuthMessage(""); // Clear any previous messages
    setShowSuccessMessage(false); // Clear any previous success message
  };

  const handleCheckOut = () => {
    setFaceModalType("checkout");
    setFaceModalOpen(true);
    setFaceAuthMessage(""); // Clear any previous messages
    setShowSuccessMessage(false); // Clear any previous success message
  };

  const handleFaceCapture = async () => {
    if (!webcamRef.current) {
      setFaceAuthMessage(
        "Camera not available. Please check camera permissions."
      );
      return;
    }

    setIsLoading(true);
    setFaceAuthMessage("Processing...");

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      console.log("Image captured, size:", imageSrc?.length || 0);

      if (!imageSrc) {
        setFaceAuthMessage("Failed to capture image. Please try again.");
        setIsLoading(false);
        return;
      }

      // Check if location is available
      if (!location.lat || !location.lng) {
        setFaceAuthMessage(
          "Location not available. Please allow location access and try again."
        );
        setIsLoading(false);
        return;
      }

      console.log("Sending to face auth server with location:", location);

      // Convert base64 image to Blob
      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append("file", blob, "face.jpg");
      formData.append("latitude", location.lat);
      formData.append("longitude", location.lng);

      // Try the face authentication server first
      try {
        const res = await fetch("http://localhost:8000/validate/", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Face auth response:", data);

        if (data.face_matched && data.location_ok) {
          // Success - save attendance record
          const savedRecord = await saveAttendanceRecord();

          // Show success message and details
          const clientTime = new Date();
          setSuccessDetails({
            type: faceModalType,
            time: clientTime.toLocaleTimeString(),
            date: clientTime.toLocaleDateString(),
            location: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
            similarity: data.similarity || "N/A",
            record: savedRecord,
          });

          setShowSuccessMessage(true);
          setFaceAuthMessage("✅ Success! Attendance recorded successfully.");

          // Keep modal open for 3 seconds to show success, then close
          setTimeout(() => {
            setFaceModalOpen(false);
            setShowSuccessMessage(false);
            setSuccessDetails({});
            // Refresh attendance records after successful check-in/out
            window.location.reload();
          }, 3000);
        } else {
          setFaceAuthMessage(
            data.status || "❌ Face or location validation failed."
          );
        }
      } catch (err) {
        console.error("Face auth server error:", err);
        setFaceAuthMessage(
          "⚠️ Face authentication server is not running. Please start the face auth server."
        );
      }
    } catch (err) {
      console.error("Error in face capture:", err);
      setFaceAuthMessage("❌ Error processing request. Please try again.");
    } finally {
      setIsLoading(false);
      // Don't clear message immediately on success
      if (!showSuccessMessage) {
        setTimeout(() => {
          setFaceAuthMessage("");
        }, 5000);
      }
    }
  };

  const saveAttendanceRecord = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const employeeId = user?.employeeId || "EMP001"; // Fallback for testing

      // Get client's local time
      const clientTime = new Date();
      const clientDate = new Date(
        clientTime.getFullYear(),
        clientTime.getMonth(),
        clientTime.getDate()
      );

      const attendanceData = {
        employeeId: employeeId,
        checkIn: faceModalType === "checkin" ? clientTime.toISOString() : false,
        checkOut:
          faceModalType === "checkout" ? clientTime.toISOString() : false,
        clientDate: clientDate.toISOString(), // Send client's date for daily records
        clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Send timezone info
      };

      console.log("Client time:", clientTime.toLocaleString());
      console.log("Client date:", clientDate.toLocaleDateString());
      console.log("Sending to server:", attendanceData);

      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(attendanceData),
      });

      if (!response.ok) {
        throw new Error("Failed to save attendance record");
      }

      const savedRecord = await response.json();
      console.log("Attendance record saved/updated successfully:", savedRecord);
      return savedRecord;
    } catch (err) {
      console.error("Error saving attendance record:", err);
      setFaceAuthMessage("⚠️ Attendance saved but server record failed.");
      return null;
    }
  };

  const handleExport = () => {
    // Export functionality would go here
    console.log("Exporting attendance report...");
  };

  const calculateMonthlyStats = () => {
    const present = attendanceRecords.filter(
      (r) => r.status === "Present"
    ).length;
    const late = attendanceRecords.filter((r) => r.status === "Late").length;
    const absent = attendanceRecords.filter(
      (r) => r.status === "Absent"
    ).length;
    const totalWorkingHours = attendanceRecords.reduce(
      (sum, r) => sum + (r.workingHours || 0),
      0
    );
    const totalOvertime = attendanceRecords.reduce(
      (sum, r) => sum + (r.overtime || 0),
      0
    );

    return { present, late, absent, totalWorkingHours, totalOvertime };
  };

  const stats = calculateMonthlyStats();

  // Helper to get all days in the selected month
  const getMonthDays = (month) => {
    const start = startOfMonth(new Date(month + "-01"));
    const end = endOfMonth(start);
    return eachDayOfInterval({ start, end });
  };

  return (
    <div className="attendance-container">
      {/* Persistent Success Notification */}
      {showSuccessMessage && !faceModalOpen && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#4caf50",
            color: "white",
            padding: "16px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            maxWidth: "400px",
            animation: "slideInRight 0.5s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "24px" }}>✅</div>
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                Attendance Recorded!
              </div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>
                {successDetails.type === "checkin" ? "Check In" : "Check Out"}{" "}
                at {successDetails.time}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Face Authentication Modal */}
      {faceModalOpen && (
        <div className="face-modal-overlay">
          <div className="face-modal-content">
            <h2 style={{ marginBottom: "1rem" }}>
              {faceModalType === "checkin" ? "Check In" : "Check Out"} - Face
              Authentication
            </h2>

            {/* Success Message Display */}
            {showSuccessMessage ? (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "48px",
                    marginBottom: "16px",
                    animation: "bounce 0.6s ease-in-out",
                  }}
                >
                  🎉
                </div>
                <h3 style={{ color: "#2e7d32", marginBottom: "16px" }}>
                  Attendance Recorded Successfully!
                </h3>

                <div
                  style={{
                    background: "#e8f5e9",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Type:</strong>{" "}
                    {successDetails.type === "checkin"
                      ? "Check In"
                      : "Check Out"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Date:</strong> {successDetails.date}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Time:</strong> {successDetails.time}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Location:</strong> {successDetails.location}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Face Similarity:</strong>{" "}
                    {successDetails.similarity}%
                  </div>
                  {successDetails.record && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Record ID:</strong>{" "}
                      {successDetails.record._id || "N/A"}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    color: "#666",
                    fontSize: "14px",
                    fontStyle: "italic",
                  }}
                >
                  Modal will close automatically in a few seconds...
                </div>
              </div>
            ) : (
              <>
                {/* Location Status */}
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "8px",
                    backgroundColor: location.lat ? "#e8f5e9" : "#fff3e0",
                    borderRadius: "4px",
                  }}
                >
                  <small>
                    📍 Location:{" "}
                    {location.lat
                      ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
                      : "Getting location..."}
                  </small>
                </div>

                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={240}
                  height={180}
                  style={{ borderRadius: 8, border: "1px solid #ddd" }}
                />

                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button
                    className="button button-primary"
                    onClick={handleFaceCapture}
                    disabled={isLoading || !location.lat}
                  >
                    {isLoading ? (
                      <>
                        <i className="icon">⏳</i> Processing...
                      </>
                    ) : (
                      <>
                        <i className="icon">📸</i> Capture & Continue
                      </>
                    )}
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => setFaceModalOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>

                {faceAuthMessage && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: "8px 12px",
                      borderRadius: "4px",
                      fontWeight: 500,
                      backgroundColor: faceAuthMessage.includes("✅")
                        ? "#e8f5e9"
                        : faceAuthMessage.includes("⚠️")
                        ? "#fff3e0"
                        : "#ffebee",
                      color: faceAuthMessage.includes("✅")
                        ? "#2e7d32"
                        : faceAuthMessage.includes("⚠️")
                        ? "#f57c00"
                        : "#c62828",
                    }}
                  >
                    {faceAuthMessage}
                  </div>
                )}

                {/* Debug Info */}
                <div
                  style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}
                >
                  <div>
                    Face Auth Server: {isLoading ? "Connecting..." : "Ready"}
                  </div>
                  <div>
                    Camera: {webcamRef.current ? "Available" : "Not available"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="attendance-header">
        <h1 className="attendance-title">Attendance Management</h1>
        <div className="header-actions">
          <button
            className="button button-outlined"
            onClick={() => setShowCalendar(true)}
          >
            <i className="icon">📅</i>
            Calendar View
          </button>
          <button className="button button-outlined" onClick={handleExport}>
            <i className="icon">📥</i>
            Export Report
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="quick-actions-card">
          <div className="quick-actions-content">
            <div className="form-group">
              <label className="form-label">Today's Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <button className="button button-primary" onClick={handleCheckIn}>
              <i className="icon">⏰</i>
              Check In
            </button>
            <button
              className="button button-secondary"
              onClick={handleCheckOut}
            >
              <i className="icon">⏰</i>
              Check Out
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card stat-inline">
            <div className="stat-label">Present Days</div>
            <div className="stat-value">{stats.present}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Late Days</div>
            <div className="stat-value">{stats.late}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Absent Days</div>
            <div className="stat-value">{stats.absent}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Working Hours</div>
            <div className="stat-value">
              {stats.totalWorkingHours.toFixed(1)}
            </div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Overtime Hours</div>
            <div className="stat-value">{stats.totalOvertime.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Leave Balance */}
      <div className="leave-balance">
        <h2 className="leave-balance-title">Leave Balance</h2>
        <div className="leave-balance-grid">
          {leaveBalance.map((leave) => (
            <div key={leave.type} className="leave-card">
              <h3 className="leave-type">{leave.type}</h3>
              <div className="leave-detail">
                <span className="leave-label">Total:</span>
                <span>{leave.total} days</span>
              </div>
              <div className="leave-detail">
                <span className="leave-label">Used:</span>
                <span>{leave.used} days</span>
              </div>
              <div className="leave-detail">
                <span className="leave-label">Remaining:</span>
                <span>{leave.remaining} days</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Records */}
      <div className="attendance-records">
        <div className="records-header">
          <h2 className="records-title">My Attendance Records</h2>
          <div className="records-filters">
            <div className="form-group">
              <select
                className="form-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>
        {loading ? (
          <div>Loading attendance records...</div>
        ) : error ? (
          <div style={{ color: "red" }}>{error}</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Working Hours</th>
                  <th>Overtime</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>
                      No attendance records found for Employee ID:{" "}
                      {currentEmployeeId}
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record) => (
                    <tr key={record._id || record.id}>
                      <td>
                        {record.date
                          ? typeof record.date === "string"
                            ? new Date(record.date).toLocaleDateString()
                            : record.date
                          : "-"}
                      </td>
                      <td>
                        {record.checkIn
                          ? typeof record.checkIn === "string"
                            ? new Date(record.checkIn).toLocaleTimeString()
                            : record.checkIn
                          : "-"}
                      </td>
                      <td>
                        {record.checkOut
                          ? typeof record.checkOut === "string"
                            ? new Date(record.checkOut).toLocaleTimeString()
                            : record.checkOut
                          : "-"}
                      </td>
                      <td>
                        <span
                          className={`status-chip status-${record.status.toLowerCase()}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td>
                        {record.workingHours
                          ? `${record.workingHours.toFixed(2)} hours`
                          : "-"}
                      </td>
                      <td>
                        {record.overtime
                          ? `${record.overtime.toFixed(2)} hours`
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Calendar Dialog */}
      {showCalendar && (
        <div className="calendar-dialog">
          <div className="calendar-content">
            <div className="calendar-header">
              <h2 className="calendar-title">Calendar View</h2>
              <button
                className="button button-secondary"
                onClick={() => setShowCalendar(false)}
              >
                Close
              </button>
            </div>
            {/* Month Selector */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <button
                className="button button-secondary"
                onClick={() =>
                  setSelectedMonth(
                    format(
                      new Date(
                        new Date(selectedMonth + "-01").setMonth(
                          new Date(selectedMonth + "-01").getMonth() - 1
                        )
                      ),
                      "yyyy-MM"
                    )
                  )
                }
              >
                {"<"}
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ fontSize: 16, padding: 4 }}
              />
              <button
                className="button button-secondary"
                onClick={() =>
                  setSelectedMonth(
                    format(
                      new Date(
                        new Date(selectedMonth + "-01").setMonth(
                          new Date(selectedMonth + "-01").getMonth() + 1
                        )
                      ),
                      "yyyy-MM"
                    )
                  )
                }
              >
                {">"}
              </button>
            </div>
            {/* Calendar Grid */}
            <div className="calendar-grid">
              {[...Array(7)].map((_, i) => (
                <div key={i} style={{ fontWeight: 600, textAlign: "center" }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
                </div>
              ))}
              {(() => {
                const days = getMonthDays(selectedMonth);
                const firstDay = days[0].getDay();
                const blanks = Array(firstDay).fill(null);
                const todayStr = format(new Date(), "yyyy-MM-dd");
                return [
                  ...blanks.map((_, i) => (
                    <div key={"b" + i} className="calendar-day disabled"></div>
                  )),
                  ...days.map((day) => {
                    const dayStr = format(day, "yyyy-MM-dd");
                    const isToday = dayStr === todayStr;
                    const isSelected = dayStr === date;
                    return (
                      <div
                        key={dayStr}
                        className={`calendar-day${isToday ? " today" : ""}${
                          isSelected ? " selected" : ""
                        }`}
                        onClick={() => setDate(dayStr)}
                        style={{
                          cursor: "pointer",
                          fontWeight: isToday ? 600 : 400,
                        }}
                      >
                        {day.getDate()}
                      </div>
                    );
                  }),
                ];
              })()}
            </div>
            <div style={{ marginTop: 16 }}>
              <b>Selected Date:</b> {date}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;
