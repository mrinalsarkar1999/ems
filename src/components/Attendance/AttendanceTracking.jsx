import React, { useState, useEffect } from 'react';
import './Attendance.css';

function AttendanceTracking() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    employeeId: '',
    date: '',
    checkIn: '',
    checkOut: '',
    status: 'Present',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Fetch attendance records from backend
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

  // Calculate stats for today
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = attendanceRecords.filter(r => r.date && r.date.slice(0, 10) === today);

  // Demo data fallback
  const demoRecords = [
    { employeeId: 'EMP001', name: 'Alice Smith', date: today + 'T09:00:00Z', checkIn: today + 'T09:00:00Z', checkOut: today + 'T18:00:00Z', status: 'Present', workingHours: 9 },
    { employeeId: 'EMP002', name: 'Bob Johnson', date: today + 'T09:15:00Z', checkIn: today + 'T09:15:00Z', checkOut: today + 'T18:00:00Z', status: 'Late', workingHours: 8.75 },
    { employeeId: 'EMP003', name: 'Charlie Lee', date: today + 'T00:00:00Z', checkIn: '', checkOut: '', status: 'Absent', workingHours: 0 },
    { employeeId: 'EMP004', name: 'Diana Patel', date: today + 'T09:05:00Z', checkIn: today + 'T09:05:00Z', checkOut: today + 'T13:00:00Z', status: 'Half Day', workingHours: 4 },
    { employeeId: 'EMP005', name: 'Ethan Kim', date: today + 'T00:00:00Z', checkIn: '', checkOut: '', status: 'Leave', workingHours: 0 },
  ];

  // Use fetched records if available, otherwise demo data
  const recordsToShow = todayRecords.length > 0 ? todayRecords : demoRecords;
  const present = recordsToShow.filter(r => r.status === 'Present').length;
  const late = recordsToShow.filter(r => r.status === 'Late').length;
  const absent = recordsToShow.filter(r => r.status === 'Absent').length;
  const leave = recordsToShow.filter(r => r.status === 'On Leave' || r.status === 'Leave').length;
  const halfDay = recordsToShow.filter(r => r.status === 'Half Day').length;

  // Handle form input
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save attendance');
      const saved = await res.json();
      setAttendanceRecords(prev => [...prev, saved]);
      setSaveMsg('Attendance saved!');
      setForm({ employeeId: '', date: '', checkIn: '', checkOut: '', status: 'Present' });
    } catch (err) {
      setError(err.message || 'Error saving attendance');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 2000);
    }
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1 className="attendance-title">Attendance Tracking</h1>
      </div>
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
          <div className="stat-card stat-inline">
            <div className="stat-label">Leave</div>
            <div className="stat-value">{leave}</div>
          </div>
          <div className="stat-card stat-inline half-day">
            <div className="stat-label">Half Day</div>
            <div className="stat-value">{halfDay}</div>
          </div>
        </div>
      </div>
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
                  <th>Name</th>
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
                    <td>{record.name || '-'}</td>
                    <td>{record.date ? record.date.slice(0, 10) : ''}</td>
                    <td>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : ''}</td>
                    <td>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : ''}</td>
                    <td>
                      <span className={`status-chip status-${(record.status || '').toLowerCase()}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>{typeof record.workingHours === 'number' ? record.workingHours : '-'}</td>
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