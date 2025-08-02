import React from 'react';
import '../styles/home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="home-container">
        <div className="home-header">
          <h1>Resource Management Portal</h1>
          <p>Welcome to the Resource Management System</p>
        </div>

        <div className="home-content">
          <div className="purpose-card">
            <div className="purpose-content">
              <h2>Purpose & Overview</h2>
              <p>
                The Resource Management Portal is designed to streamline the management and tracking 
                of organizational resources. This centralized platform enables efficient monitoring, 
                allocation, and reporting of various resource categories including personnel assignments, 
                billing statuses, and project allocations.
              </p>
              
              <p>
                Key capabilities include:
              </p>
              
              <ul>
                <li><strong>NBL (Non-Billable) Tracking:</strong> Monitor and categorize non-billable resources and time allocations</li>
                <li><strong>Data Import & Management:</strong> Upload and manage resource data through Excel file imports</li>
                <li><strong>Status Management:</strong> Track billing statuses including NBL, Awaiting Billing, NBL for month, and Billed categories</li>
                <li><strong>Advanced Filtering:</strong> Search, sort, and filter resource data with comprehensive table controls</li>
                <li><strong>Data Export:</strong> Export filtered and processed data for reporting and analysis</li>
              </ul>

              <p>
                Use the navigation menu to access different sections of the portal:
              </p>

              <div className="quick-navigation">
                <div className="nav-item">
                  <div className="nav-icon">📊</div>
                  <div className="nav-content">
                    <h3>Dashboard</h3>
                    <p>View real-time statistics and category distributions</p>
                  </div>
                </div>
                
                <div className="nav-item">
                  <div className="nav-icon">📋</div>
                  <div className="nav-content">
                    <h3>NBL List</h3>
                    <p>Upload Excel files, manage data, and track billing categories</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
