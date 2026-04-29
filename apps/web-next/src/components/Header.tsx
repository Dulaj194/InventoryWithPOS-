'use client';

import { useState } from 'react';

interface HeaderProps {
  title?: string;
  onMenuToggle?: () => void;
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    // TODO: Implement logout
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <button
          className="menu-toggle"
          onClick={onMenuToggle}
          title="Toggle Sidebar"
        >
          ☰
        </button>
        {title && <h1 className="page-title">{title}</h1>}
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button className="action-btn" title="Notifications">
            🔔
          </button>
          <button className="action-btn" title="Settings">
            ⚙️
          </button>
        </div>

        <div className="user-menu-container">
          <button
            className="user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar-small">👤</div>
            <span className="user-name-short">Admin</span>
            <span className="menu-arrow">▼</span>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-info">
                <div className="user-avatar">👤</div>
                <div className="user-details">
                  <div className="user-name">Admin User</div>
                  <div className="user-email">admin@example.com</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item">
                <span className="item-icon">👤</span>
                Profile
              </button>
              <button className="dropdown-item">
                <span className="item-icon">⚙️</span>
                Settings
              </button>
              <button className="dropdown-item">
                <span className="item-icon">📊</span>
                Reports
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={handleLogout}>
                <span className="item-icon">🚪</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}