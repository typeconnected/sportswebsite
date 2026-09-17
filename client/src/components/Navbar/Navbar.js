import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ onMenuToggle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu">
          ☰
        </button>
        <div className="topbar-browse">
          <span className="browse-icon">⊞</span>
          <span>Browse</span>
          <span className="browse-plus">+</span>
        </div>
      </div>

      <form className="topbar-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search streams, sports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="search-btn" aria-label="Search">🔍</button>
      </form>

      <div className="topbar-right">
        <button className="topbar-icon-btn" title="Region">🌐 ▾</button>
        <button className="topbar-icon-btn" title="Notifications">🔔</button>
        <div className="topbar-avatar" title="Profile">
          <img src="https://i.pravatar.cc/36?img=3" alt="User" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
