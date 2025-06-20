import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Import SVG icons
import MenuIcon from './assets/icons/menu.svg';
import DashboardIcon from './assets/icons/dashboard.svg';
import GroupAddIcon from './assets/icons/group-add.svg';
import CalendarTodayIcon from './assets/icons/calendar.svg';
import WorkOffIcon from './assets/icons/work-off.svg';
import TrendingUpIcon from './assets/icons/trending-up.svg';
import AccountBalanceIcon from './assets/icons/account-balance.svg';
import ExpandLessIcon from './assets/icons/expand-less.svg';
import ExpandMoreIcon from './assets/icons/expand-more.svg';

import Dashboard from './components/Dashboard/Dashboard';
import Onboarding from './components/Onboarding/Onboarding';
import Attendance from './components/Attendance/Attendance';
import LeaveManagement from './components/LeaveManagement/LeaveManagement';
import PerformanceTracking from './components/PerformanceTracking/PerformanceTracking';
import PayrollPreview from './components/PayrollPreview/PayrollPreview';

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState({});

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSectionToggle = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: DashboardIcon,
      path: '/',
      description: 'Overview of center operations and key metrics',
      subItems: [
        { text: 'Center Overview', path: '/' },
        { text: 'Employee Stats', path: '/' },
        { text: 'Quick Actions', path: '/' },
      ],
    },
    {
      text: 'Onboarding',
      icon: GroupAddIcon,
      path: '/onboarding',
      description: 'Manage new employee onboarding process',
      subItems: [
        { text: 'New Employee Form', path: '/onboarding' },
        { text: 'Document Upload', path: '/ ' },
        { text: 'Training Schedule', path: '/ ' },
      ],
    },
    {
      text: 'Attendance',
      icon: CalendarTodayIcon,
      path: '/attendance',
      description: 'Track employee attendance and time records',
      subItems: [
        { text: 'Daily Attendance', path: '/attendance' },
        { text: 'Time Tracking', path: '/attendance' },
        { text: 'Reports', path: '/ ' },
      ],
    },
    {
      text: 'Leave',
      icon: WorkOffIcon,
      path: '/leave',
      description: 'Manage employee leave requests and balances',
      subItems: [
        { text: 'Leave Requests', path: '/leave' },
        { text: 'Leave Balance', path: '/leave' },
        { text: 'Calendar', path: '/leave' },
      ],
    },
    {
      text: 'Performance',
      icon: TrendingUpIcon,
      path: '/performance',
      description: 'Track and evaluate employee performance',
      subItems: [
        { text: 'Performance Reviews', path: '/performance' },
        { text: 'Goals & KPIs', path: '/performance' },
        { text: 'Feedback', path: '/performance' },
      ],
    },
    {
      text: 'Payroll',
      icon: AccountBalanceIcon,
      path: '/payroll',
      description: 'Manage employee compensation and benefits',
      subItems: [
        { text: 'Salary Processing', path: '/payroll' },
        { text: 'Benefits', path: '/payroll' },
        { text: 'Tax Reports', path: '/payroll' },
      ],
    },
  ];

  const drawer = (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">SynchroServe</h1>
      </div>
      <ul className="menu-list">
        {menuItems.map((item) => (
          <li key={item.text}>
            <button
              className="menu-item"
              onClick={() => handleSectionToggle(item.text)}
              data-section={item.text}
            >
              <img src={item.icon} alt="" className="menu-item-icon" />
              <div className="menu-item-text">
                <div>{item.text}</div>
                <div className="menu-item-description">{item.description}</div>
              </div>
              <img
                src={openSections[item.text] ? ExpandLessIcon : ExpandMoreIcon}
                alt=""
                className="menu-item-icon expand-icon"
              />
            </button>
            {openSections[item.text] && (
              <ul className="submenu">
                {item.subItems.map((subItem) => (
                  <li key={subItem.text}>
                    <Link to={subItem.path} className="submenu-item">
                      {subItem.text}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <button className="menu-button" onClick={handleDrawerToggle}>
            <img src={MenuIcon} alt="Menu" />
          </button>
          <h1 className="app-title">SynchroServe</h1>
        </header>

        <nav className={`sidebar ${mobileOpen ? 'open' : ''}`}>
          {drawer}
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leave" element={<LeaveManagement />} />
            <Route path="/performance" element={<PerformanceTracking />} />
            <Route path="/payroll" element={<PayrollPreview />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 