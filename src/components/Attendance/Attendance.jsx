import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import './Attendance.css';

function Attendance() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCalendar, setShowCalendar] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    checkIn: '',
    checkOut: '',
    checkInDate: '',
    checkOutDate: ''
  });
  const [attendanceRecords] = useState([
    {
      id: 1,
      date: '2024-03-20',
      checkIn: '09:00',
      checkOut: '18:00',
      status: 'Present',
      workingHours: 9,
      overtime: 0,
    },
    {
      id: 2,
      date: '2024-03-19',
      checkIn: '09:15',
      checkOut: '18:00',
      status: 'Late',
      workingHours: 8.75,
      overtime: 0,
    },
    {
      id: 3,
      date: '2024-03-18',
      checkIn: '09:00',
      checkOut: '17:00',
      status: 'Present',
      workingHours: 8,
      overtime: 0,
    },
  ]);

  const [leaveBalance] = useState([
    {
      type: 'Annual Leave',
      total: 20,
      used: 5,
      remaining: 15,
    },
    {
      type: 'Sick Leave',
      total: 10,
      used: 2,
      remaining: 8,
    },
  ]);

  const [message, setMessage] = useState('');

  const handleCheckIn = () => {
    const now = new Date();
    setAttendanceData(prev => ({
      ...prev,
      checkIn: now.toLocaleTimeString(),
      checkInDate: now.toLocaleDateString()
    }));
    setMessage('Checked in successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCheckOut = () => {
    const now = new Date();
    setAttendanceData(prev => ({
      ...prev,
      checkOut: now.toLocaleTimeString(),
      checkOutDate: now.toLocaleDateString()
    }));
    setMessage('Checked out successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleExport = () => {
    // Export functionality would go here
    setMessage('Exporting attendance report...');
    setTimeout(() => setMessage(''), 3000);
  };

  const calculateMonthlyStats = () => {
    const present = attendanceRecords.filter(r => r.status === 'Present').length;
    const late = attendanceRecords.filter(r => r.status === 'Late').length;
    const absent = attendanceRecords.filter(r => r.status === 'Absent').length;
    const totalWorkingHours = attendanceRecords.reduce((sum, r) => sum + r.workingHours, 0);
    const totalOvertime = attendanceRecords.reduce((sum, r) => sum + r.overtime, 0);

    return { present, late, absent, totalWorkingHours, totalOvertime };
  };

  const stats = calculateMonthlyStats();

  return (
    <div className="attendance-container">
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
          <button
            className="button button-outlined"
            onClick={handleExport}
          >
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
            <button
              className="button button-primary"
              onClick={handleCheckIn}
            >
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
          <div className="stat-card">
            <div className="stat-label">Present Days</div>
            <div className="stat-value">{stats.present}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Late Days</div>
            <div className="stat-value">{stats.late}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Working Hours</div>
            <div className="stat-value">{stats.totalWorkingHours}</div>
          </div>
          <div className="stat-card">
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
                <option value="on-leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>
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
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>{record.checkIn}</td>
                  <td>{record.checkOut}</td>
                  <td>
                    <span className={`status-chip status-${record.status.toLowerCase()}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>{record.workingHours}</td>
                  <td>{record.overtime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            {/* Calendar implementation would go here */}
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance; 