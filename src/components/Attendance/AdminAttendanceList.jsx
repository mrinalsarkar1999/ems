import React, { useState, useEffect } from 'react';
import './Attendance.css';

function AdminAttendanceList() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employeeIdFilter, setEmployeeIdFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/attendance', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch attendance records');
        const data = await res.json();
        setAttendanceRecords(data);
      } catch (err) {
        setError(err.message || 'Error fetching attendance');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  // Filter records
  const filteredRecords = attendanceRecords.filter(r => {
    const matchesEmployee = employeeIdFilter ? (r.employeeId || '').toLowerCase().includes(employeeIdFilter.toLowerCase()) : true;
    const matchesDate = dateFilter ? (r.date && r.date.slice(0, 10) === dateFilter) : true;
    return matchesEmployee && matchesDate;
  });

  // Today's stats
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = attendanceRecords.filter(r => r.date && r.date.slice(0, 10) === today);
  const present = todayRecords.filter(r => r.status === 'Present').length;
  const late = todayRecords.filter(r => r.status === 'Late').length;
  const absent = todayRecords.filter(r => r.status === 'Absent').length;

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1 className="attendance-title">Attendance List (Admin)</h1>
      </div>
      {/* Today's Stats */}
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card stat-inline">
            <div className="stat-label">Present</div>
            <div className="stat-value">{present}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Late</div>
            <div className="stat-value">{late}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Absent</div>
            <div className="stat-value">{absent}</div>
          </div>
        </div>
      </div>
      {/* Today's Records Table */}
      <div className="attendance-records">
        <div className="records-header">
          <h2 className="records-title">Attendance Records (Today)</h2>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
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
                </tr>
              </thead>
              <tbody>
                {todayRecords.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>No records found</td></tr>
                ) : todayRecords.map((record, idx) => (
                  <tr key={record._id || idx}>
                    <td>{record.employeeId}</td>
                    <td>{record.date ? record.date.slice(0, 10) : ''}</td>
                    <td>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : ''}</td>
                    <td>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : ''}</td>
                    <td>
                      <span className={`status-chip status-${(record.status || '').toLowerCase()}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* All History Table */}
      <div className="attendance-records">
        <div className="records-header">
          <h2 className="records-title">Attendance History (All Records)</h2>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            className="form-input"
            placeholder="Filter by Employee ID"
            value={employeeIdFilter}
            onChange={e => setEmployeeIdFilter(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <input
            className="form-input"
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ maxWidth: 180 }}
          />
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
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
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record._id || idx}>
                    <td>{record.employeeId}</td>
                    <td>{record.date ? record.date.slice(0, 10) : ''}</td>
                    <td>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : ''}</td>
                    <td>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : ''}</td>
                    <td>
                      <span className={`status-chip status-${(record.status || '').toLowerCase()}`}>
                        {record.status}
                      </span>
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

export default AdminAttendanceList; 