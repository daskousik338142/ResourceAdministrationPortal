import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResourceAllocationOpen, setIsResourceAllocationOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isResourceAllocationActive = () => {
    return location.pathname === '/new-allocations' ||
           location.pathname === '/existing-allocations';
  };

  const isDashboardActive = () => {
    return location.pathname === '/dashboard' ||
           location.pathname === '/resource-allocation-dashboard';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleResourceAllocation = () => {
    setIsResourceAllocationOpen(!isResourceAllocationOpen);
  };

  const toggleDashboard = () => {
    setIsDashboardOpen(!isDashboardOpen);
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
          
          {/* Dashboard Menu */}
          <div className="nav-dropdown">
            <button 
              className={`nav-link dropdown-toggle ${isDashboardActive() ? 'active' : ''}`}
              onClick={toggleDashboard}
            >
              <span className="menu-icon-item">📊</span>
              Dashboard
              <span className={`dropdown-arrow ${isDashboardOpen ? 'open' : ''}`}>▼</span>
            </button>
            <div className={`dropdown-content ${isDashboardOpen ? 'open' : ''}`}>
              <Link 
                to="/dashboard" 
                className={`nav-link sub-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <span className="menu-icon-item">📊</span>
                NBL Dashboard
              </Link>
              <Link 
                to="/resource-allocation-dashboard" 
                className={`nav-link sub-link ${isActive('/resource-allocation-dashboard') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <span className="menu-icon-item">📈</span>
                Resource Allocation Dashboard
              </Link>
            </div>
          </div>
          <Link 
            to="/nbl-list" 
            className={`nav-link ${isActive('/nbl-list') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <span className="menu-icon-item">📋</span>
            NBL List
          </Link>
          
          {/* Resource Allocation Menu */}
          <div className="nav-dropdown">
            <button 
              className={`nav-link dropdown-toggle ${isResourceAllocationActive() ? 'active' : ''}`}
              onClick={toggleResourceAllocation}
            >
              <span className="menu-icon-item">📈</span>
              Resource Allocation
              <span className={`dropdown-arrow ${isResourceAllocationOpen ? 'open' : ''}`}>▼</span>
            </button>
            <div className={`dropdown-content ${isResourceAllocationOpen ? 'open' : ''}`}>
              <Link 
                to="/existing-allocations" 
                className={`nav-link sub-link ${isActive('/existing-allocations') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <span className="menu-icon-item">📋</span>
                Existing Allocations
              </Link>
              <Link 
                to="/new-allocations" 
                className={`nav-link sub-link ${isActive('/new-allocations') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <span className="menu-icon-item">✨</span>
                New Allocations
              </Link>
            </div>
          </div>
          
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
