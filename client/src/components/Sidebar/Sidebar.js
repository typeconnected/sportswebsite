import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NavItem = ({ to, icon, label }) => (
  <NavLink to={to} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
    <span className="nav-icon">{icon}</span>
    <span className="nav-label">{label}</span>
  </NavLink>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">▶</div>
          <span className="logo-text">SportStream</span>
          <button className="sidebar-close" onClick={onClose}>✕</button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <NavItem to="/" icon="🏠" label="Home" />
          <NavItem to="/explore" icon="📡" label="Explore Streaming" />
          <NavItem to="/browse" icon="🌐" label="Browse Sports" />
          <NavItem to="/schedule" icon="📅" label="Sports Schedule" />
          {user?.role === 'streamer' || user?.role === 'admin' ? (
            <NavItem to="/go-live" icon="🔴" label="Go Live" />
          ) : null}
          <NavItem to="/support" icon="🛡️" label="Supports" />
        </nav>

        {/* User info */}
        {user && (
          <div className="sidebar-user">
            <div className="user-avatar">
              {user.avatar ? <img src={user.avatar} alt={user.username} /> : user.username[0].toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{user.username}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
        )}

        <button className="sidebar-logout" onClick={handleLogout}>
          <span>↩</span> Log Out
        </button>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    </>
  );
};

export default Sidebar;
