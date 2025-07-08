import React, { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import Webcam from "react-webcam";
import "./Attendance.css";
import { getApiUrl } from "../../utils/api";

function Attendance() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCalendar, setShowCalendar] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    checkIn: "",
    checkOut: "",
    checkInDate: "",
    checkOutDate: "",
  });
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const [message, setMessage] = useState("");

  // Face Auth & GPS state
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locationError, setLocationError] = useState("");
  const [faceAuthMessage, setFaceAuthMessage] = useState("");
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [faceModalType, setFaceModalType] = useState(null); // 'checkin' or 'checkout'

  const [showExportSample, setShowExportSample] = useState(false);

  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [selectedMonthForModal, setSelectedMonthForModal] = useState(
    format(new Date(), "yyyy-MM")
  );

  // Sample monthly data (could be replaced with real data)
  const sampleMonthlyData = [
    {
      id: 1,
      date: "2024-03-01",
      checkIn: "09:00",
      checkOut: "18:00",
      status: "Present",
      workingHours: 9,
      overtime: 0,
    },
    {
      id: 2,
      date: "2024-03-02",
      checkIn: "09:10",
      checkOut: "18:00",
      status: "Late",
      workingHours: 8.83,
      overtime: 0,
    },
    {
      id: 3,
      date: "2024-03-03",
      checkIn: "09:00",
      checkOut: "17:00",
      status: "Present",
      workingHours: 8,
      overtime: 0,
    },
    {
      id: 4,
      date: "2024-03-04",
      checkIn: "09:00",
      checkOut: "18:30",
      status: "Present",
      workingHours: 9.5,
      overtime: 0.5,
    },
    {
      id: 5,
      date: "2024-03-05",
      checkIn: "09:30",
      checkOut: "18:00",
      status: "Late",
      workingHours: 8.5,
      overtime: 0,
    },
    {
      id: 6,
      date: "2024-03-06",
      checkIn: "09:00",
      checkOut: "18:00",
      status: "Present",
      workingHours: 9,
      overtime: 0,
    },
    {
      id: 7,
      date: "2024-03-07",
      checkIn: "09:00",
      checkOut: "18:00",
      status: "Present",
      workingHours: 9,
      overtime: 0,
    },
  ];

  const [realTimeWorkingHours, setRealTimeWorkingHours] = useState("0");

  // Real-time working hours calculation for today
  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayRecord = attendanceRecords.find((r) => r.date === today);
    let intervalId;

    function updateWorkingHours() {
      if (todayRecord && todayRecord.checkIn) {
        const checkInTime = todayRecord.checkIn;
        const checkOutTime = todayRecord.checkOut;
        const now = new Date();
        const [inHour, inMin] = checkInTime.split(":").map(Number);
        const checkInDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          inHour,
          inMin
        );
        let diffMs;
        if (checkOutTime) {
          const [outHour, outMin] = checkOutTime.split(":").map(Number);
          const checkOutDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            outHour,
            outMin
          );
          diffMs = checkOutDate - checkInDate;
        } else {
          diffMs = now - checkInDate;
        }
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs / (1000 * 60)) % 60);
          setRealTimeWorkingHours(`${hours}h ${mins}m`);
        } else {
          setRealTimeWorkingHours("0");
        }
      } else {
        setRealTimeWorkingHours("0");
      }
    }

    updateWorkingHours();
    if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
      intervalId = setInterval(updateWorkingHours, 1000);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [attendanceRecords]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.employeeId) {
      setError("No employee ID found. Please log in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(getApiUrl(`/api/attendance?employeeId=${user.employeeId}`))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch attendance records");
        return res.json();
      })
      .then((data) => {
        setAttendanceRecords(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleCheckIn = () => {
    setFaceModalType("checkin");
    setFaceModalOpen(true);
    // Automatically get location when modal opens
    getLocation();
  };

  const handleCheckOut = () => {
    setFaceModalType("checkout");
    setFaceModalOpen(true);
    // Automatically get location when modal opens
    getLocation();
  };

  const handleFaceCapture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);

      // Show processing message
      setFaceAuthMessage("Processing face authentication...");

      if (!location.lat || !location.lng) {
        setFaceAuthMessage(
          "Location not available. Please allow location access and try again."
        );
        setTimeout(() => setFaceAuthMessage(""), 3000);
        return;
      }

      // Get user data from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.employeeId) {
        setFaceAuthMessage("User data not found. Please log in again.");
        setTimeout(() => setFaceAuthMessage(""), 3000);
        return;
      }

      // Convert base64 image to Blob
      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append("file", blob, "face.jpg");
      formData.append("latitude", location.lat);
      formData.append("longitude", location.lng);
      formData.append("employeeId", user.employeeId);

      try {
        const res = await fetch(getApiUrl("/api/attendance/validate"), {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.face_matched && data.location_ok) {
          const now = new Date();
          const today = format(now, "yyyy-MM-dd");
          const timeString = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          if (faceModalType === "checkin") {
            // Save check-in to backend
            try {
              const attendanceRes = await fetch(getApiUrl("/api/attendance"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  employeeId: user.employeeId,
                  date: today,
                  checkIn: timeString,
                  status: "Present",
                }),
              });

              if (attendanceRes.ok) {
                setMessage("✅ Checked in successfully!");
                // Refresh attendance records
                const updatedRes = await fetch(
                  getApiUrl(`/api/attendance?employeeId=${user.employeeId}`)
                );
                if (updatedRes.ok) {
                  const updatedData = await updatedRes.json();
                  setAttendanceRecords(updatedData);
                }
              } else {
                setMessage("❌ Failed to save attendance record");
              }
            } catch (err) {
              setMessage("❌ Error saving attendance record");
            }
          } else if (faceModalType === "checkout") {
            // Update check-out in backend
            try {
              const attendanceRes = await fetch(
                getApiUrl(`/api/attendance/${user.employeeId}/${today}`),
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    checkOut: timeString,
                  }),
                }
              );

              if (attendanceRes.ok) {
                setMessage("✅ Checked out successfully!");
                // Refresh attendance records
                const updatedRes = await fetch(
                  getApiUrl(`/api/attendance?employeeId=${user.employeeId}`)
                );
                if (updatedRes.ok) {
                  const updatedData = await updatedRes.json();
                  setAttendanceRecords(updatedData);
                }
              } else {
                setMessage("❌ Failed to update attendance record");
              }
            } catch (err) {
              setMessage("❌ Error updating attendance record");
            }
          }
          setFaceModalOpen(false);
        } else {
          setFaceAuthMessage(
            data.status ||
              "❌ Face or location validation failed. Please try again."
          );
        }
      } catch (err) {
        setFaceAuthMessage(
          "❌ Face authentication server error. Please check your connection."
        );
      }

      setTimeout(() => {
        setMessage("");
        setFaceAuthMessage("");
        setCapturedImage(null);
      }, 3000);
    }
  };

  const handleModalClose = () => {
    setFaceModalOpen(false);
    setFaceAuthMessage("");
    setCapturedImage(null);
  };

  const handleExport = () => {
    // Show sample export modal
    setShowExportSample(true);
    setMessage("Exporting attendance report...");
    setTimeout(() => setMessage(""), 3000);
  };

  const calculateMonthlyStats = () => {
    const present = attendanceRecords.filter(
      (r) => r.status === "Present"
    ).length;
    const late = attendanceRecords.filter((r) => r.status === "Late").length;
    const absent = attendanceRecords.filter(
      (r) => r.status === "Absent"
    ).length;
    const halfDay = attendanceRecords.filter(
      (r) => r.status === "Half Day"
    ).length;
    const totalWorkingHours = attendanceRecords.reduce(
      (sum, r) => sum + r.workingHours,
      0
    );
    const totalOvertime = attendanceRecords.reduce(
      (sum, r) => sum + r.overtime,
      0
    );

    return { present, late, absent, halfDay, totalWorkingHours, totalOvertime };
  };

  const stats = calculateMonthlyStats();

  // Get GPS location
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationError("");
        },
        (err) => {
          setLocationError("Location access denied or unavailable.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  };

  // Capture image from webcam
  const capture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      // Placeholder: Here you would send imageSrc to a backend or face recognition API
      setFaceAuthMessage("Face captured! (Authentication placeholder)");
      setTimeout(() => setFaceAuthMessage(""), 3000);
    }
  };

  // Helper to get all days in the selected month
  const getMonthDays = (month) => {
    const start = startOfMonth(new Date(month + "-01"));
    const end = endOfMonth(start);
    return eachDayOfInterval({ start, end });
  };

  return (
    <div className="attendance-container">
      {/* Face Authentication Modal */}
      {faceModalOpen && (
        <div className="face-modal-overlay">
          <div className="face-modal-content" style={{ position: "relative" }}>
            <button
              onClick={handleModalClose}
              style={{
                position: "absolute",
                top: 0,
                right: 5,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
                border: "none",
                borderRadius: "50%",
                color: "#ff0000",
                fontSize: 45,
                cursor: "pointer",
                zIndex: 1001,
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h2 style={{ marginBottom: "1rem" }}>
              {faceModalType === "checkin" ? "Check In" : "Check Out"} - Face
              Authentication
            </h2>

            {/* Date and Time Display */}
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.5rem",
                borderRadius: "4px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #e9ecef",
                textAlign: "center",
                fontSize: "0.9rem",
                fontWeight: "500",
                color: "#495057",
              }}
            >
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#1976D2",
                  marginBottom: "0.2rem",
                  textTransform: "capitalize",
                }}
              >
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "#2196F3",
                }}
              >
                {new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>

            {/* Location Status */}
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.5rem",
                borderRadius: "4px",
                backgroundColor:
                  location.lat && location.lng ? "#e8f5e8" : "#fff3cd",
                color: location.lat && location.lng ? "#155724" : "#856404",
                fontSize: "0.9rem",
              }}
            >
              📍{" "}
              {location.lat && location.lng
                ? "Location captured successfully"
                : "Getting your location... Please allow location access."}
            </div>

            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={240}
              height={180}
              style={{ borderRadius: 8, border: "1px solid #ddd" }}
            />

            <div
              style={{
                marginTop: 12,
                marginBottom: 8,
                fontSize: "0.9rem",
                color: "#666",
              }}
            >
              Position your face in the camera and click "Capture"
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
                justifyContent: "center",
              }}
            >
              <button
                className="button button-primary"
                onClick={handleFaceCapture}
                disabled={!location.lat || !location.lng}
                style={{
                  opacity: !location.lat || !location.lng ? 0.6 : 1,
                  padding: "10px 24px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "none",
                  background: "#1976D2",
                  color: "#fff",
                  cursor:
                    !location.lat || !location.lng ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                  boxShadow: "0 1px 4px rgba(25, 118, 210, 0.08)",
                }}
              >
                <i className="icon">📸</i> Capture
              </button>
            </div>

            {faceAuthMessage && (
              <div
                style={{
                  marginTop: 16,
                  padding: "0.75rem",
                  borderRadius: "4px",
                  backgroundColor: faceAuthMessage.includes("❌")
                    ? "#f8d7da"
                    : "#d1ecf1",
                  color: faceAuthMessage.includes("❌") ? "#721c24" : "#0c5460",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                }}
              >
                {faceAuthMessage}
              </div>
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
          <button
            className="button button-outlined"
            onClick={() => setShowMonthlyModal(true)}
          >
            <i className="icon">📊</i>
            View Monthly Attendance
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
            <div className="stat-label">Half Days</div>
            <div className="stat-value">{stats.halfDay}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Absent Days</div>
            <div className="stat-value">{stats.absent}</div>
          </div>

          <div className="stat-card stat-inline">
            <div className="stat-label">Working Hours</div>
            <div className="stat-value">{realTimeWorkingHours}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Overtime Hours</div>
            <div className="stat-value">{stats.totalOvertime}</div>
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
          <h2 className="records-title">Attendance Records</h2>
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
                <option value="on-leave">Leave</option>
              </select>
            </div>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: "1rem", textAlign: "center" }}>
            Loading attendance records...
          </div>
        ) : error ? (
          <div style={{ color: "red", padding: "1rem", textAlign: "center" }}>
            {error}
          </div>
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
                {attendanceRecords.map((record) => (
                  <tr key={record._id || record.id}>
                    <td>{record.date}</td>
                    <td>{record.checkIn}</td>
                    <td>{record.checkOut}</td>
                    <td>
                      <span
                        className={`status-chip ${
                          record.status === "On Leave" ||
                          record.status === "Leave"
                            ? "status-leave"
                            : record.status === "Half Day"
                            ? "status-half-day"
                            : "status-" +
                              record.status.toLowerCase().replace(/\s/g, "-")
                        }`}
                      >
                        {record.status === "On Leave" ? "Leave" : record.status}
                      </span>
                    </td>
                    <td>{record.workingHours}</td>
                    <td>{record.overtime}</td>
                  </tr>
                ))}
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

      {/* Export Sample Modal */}
      {showExportSample && (
        <div className="face-modal-overlay" style={{ zIndex: 2000 }}>
          <div
            className="face-modal-content"
            style={{ maxWidth: 600, position: "relative" }}
          >
            <button
              onClick={() => setShowExportSample(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f44336",
                border: "none",
                borderRadius: "50%",
                color: "#ff0000",
                fontSize: 20,
                cursor: "pointer",
                zIndex: 1001,
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h2 style={{ marginBottom: 16 }}>Sample Export Report</h2>
            <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ minWidth: 500 }}>
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
                  {attendanceRecords.slice(0, 5).map((record) => (
                    <tr key={record._id || record.id}>
                      <td>{record.date}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.status}</td>
                      <td>{record.workingHours}</td>
                      <td>{record.overtime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button
                onClick={() => setShowExportSample(false)}
                style={{
                  padding: "8px 20px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "1px solid #bbb",
                  background: "#fff",
                  color: "#333",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Attendance Modal */}
      {showMonthlyModal && (
        <div className="face-modal-overlay" style={{ zIndex: 2000 }}>
          <div
            className="face-modal-content"
            style={{
              minWidth: 450,
              maxWidth: 650,
              maxHeight: "70vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowMonthlyModal(false)}
              style={{
                position: "absolute",
                top: 0,
                right: 5,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
                border: "none",
                borderRadius: "50%",
                color: "#ff0000",
                fontSize: 20,
                cursor: "pointer",
                zIndex: 1001,
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h2 style={{ marginBottom: 16 }}>Monthly Attendance Data</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, marginRight: 8 }}>
                Select Month:
              </label>
              <input
                type="month"
                value={selectedMonthForModal}
                onChange={(e) => setSelectedMonthForModal(e.target.value)}
                style={{ fontSize: 16, padding: 4 }}
              />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ minWidth: 500 }}>
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
                  {sampleMonthlyData.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.status}</td>
                      <td>{record.workingHours}</td>
                      <td>{record.overtime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button
                onClick={() => setShowMonthlyModal(false)}
                style={{
                  padding: "8px 20px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "1px solid #bbb",
                  background: "#fff",
                  color: "#333",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
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

export default Attendance;
