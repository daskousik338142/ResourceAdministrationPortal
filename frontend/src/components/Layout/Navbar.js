import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <button 
              className="menu-button"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <div className="menu-icon">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
            <div className="nav-brand">
              <Link to="/" className="brand-link" onClick={closeMenu}>
                Resource Management Portal
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Side Panel */}
      <div className={`side-panel ${isMenuOpen ? 'open' : ''}`}>
        <div className="side-panel-header">
          <h3>Navigation</h3>
          <button className="close-button" onClick={closeMenu}>
            ×
          </button>
        </div>
        <div className="side-panel-content">
          <Link 
            to="/home" 
            className={`nav-link ${isActive('/home') || isActive('/') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <span className="menu-icon-item">🏠</span>
            Home
          </Link>
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <span className="menu-icon-item">📊</span>
            Dashboard
          </Link>
          <Link 
            to="/nbl-list" 
            className={`nav-link ${isActive('/nbl-list') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <span className="menu-icon-item">📋</span>
            NBL List
          </Link>
          <Link 
            to="/admin" 
            className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <span className="menu-icon-item">⚙️</span>
            Admin
          </Link>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="side-panel-overlay" 
          onClick={closeMenu}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        />
      )}
    </>
  );
};

export default Navbar;
