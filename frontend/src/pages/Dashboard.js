import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryRecords, setCategoryRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [breakdownData, setBreakdownData] = useState(null);
  const [emailSending, setEmailSending] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchBreakdown();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      console.log('Fetching NBL stats...');
      const response = await api.getNBLStats();
      console.log('Stats response:', response.data);
      if (response.data.success) {
        setStats(response.data.data);
        console.log('Stats data:', response.data.data);
      } else {
        setError('Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBreakdown = async () => {
    try {
      console.log('Fetching breakdown data...');
      const response = await api.getNBLBreakdown();
      console.log('Breakdown response:', response.data);
      if (response.data.success) {
        setBreakdownData(response.data.data);
        console.log('Breakdown data:', response.data.data);
      }
    } catch (err) {
      console.error('Error fetching breakdown data:', err);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'NBL': '#ef4444', // red
      'Awaiting Billing': '#f59e0b', // amber
      'NBL for month': '#3b82f6', // blue
      'Billed': '#10b981', // emerald
    };
    return colors[category] || '#6b7280'; // gray for unknown categories
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      'NBL': 'Non-billable resources not assigned to client projects',
      'Awaiting Billing': 'Resources pending billing processing and approval',
      'NBL for month': 'Monthly non-billable allocations and assignments',
      'Billed': 'Successfully billed resources with completed transactions',
    };
    return descriptions[category] || 'Resource category requiring classification';
  };

  const handleCategoryClick = async (categoryName) => {
    try {
      setRecordsLoading(true);
      setSelectedCategory(categoryName);
      setShowModal(true);
      
      console.log('Fetching records for category:', categoryName);
      const response = await api.getNBLRecordsByCategory(categoryName);
      
      if (response.data.success) {
        setCategoryRecords(response.data.data.records);
        console.log('Category records:', response.data.data.records);
      } else {
        console.error('Failed to fetch category records');
        setCategoryRecords([]);
      }
    } catch (error) {
      console.error('Error fetching category records:', error);
      setCategoryRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setCategoryRecords([]);
  };

  const handleModalClick = (e) => {
    // Close modal if clicking on overlay (not on modal content)
    if (e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  };

  const handleSendSummaryEmails = async () => {
    if (!breakdownData) {
      alert('No summary data available to send');
      return;
    }

    if (window.confirm('Send summary report to all active email recipients?')) {
      try {
        setEmailSending(true);
        console.log('Sending summary emails to all active recipients');
        
        const response = await api.sendSummaryToAllEmails(breakdownData);
        
        if (response.success) {
          alert(`Summary emails sent successfully! ${response.message}`);
        } else {
          throw new Error(response.message || 'Failed to send emails');
        }
      } catch (error) {
        console.error('Error sending summary emails:', error);
        alert('Failed to send summary emails: ' + error.message);
      } finally {
        setEmailSending(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <div className="loading-spinner">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={fetchStats} className="retry-btn">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Resource Management Dashboard</h1>
          <p>Overview of your resource data and NBL categories</p>
        </div>

        <div className="dashboard-content">
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card total-records">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Total Records</h3>
                <p className="stat-number">{stats?.totalRecords || 0}</p>
              </div>
            </div>

            {stats?.categoryStats && Object.keys(stats.categoryStats).length > 0 && (
              <div className="stat-card categories-count">
                <div className="stat-icon">�</div>
                <div className="stat-content">
                  <h3>Categories</h3>
                  <p className="stat-number">{Object.keys(stats.categoryStats).length}</p>
                </div>
              </div>
            )}

            {stats?.lastUpload && (
              <div className="stat-card last-upload">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h3>Last Updated</h3>
                  <p className="stat-text">{new Date(stats.lastUpload.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* NBL Category Distribution */}
          {stats?.categoryStats && Object.keys(stats.categoryStats).length > 0 && (
            <div className="category-section">
              <h2>NBL Category Distribution</h2>
              <p className="section-description">
                Summary of resources organized by their NBL (Non-Billable) category status
              </p>
              <div className="category-grid">
                {Object.entries(stats.categoryStats)
                  .sort(([,a], [,b]) => b - a) // Sort by count descending
                  .map(([category, count]) => {
                    const percentage = stats.totalRecords > 0 
                      ? ((count / stats.totalRecords) * 100).toFixed(1)
                      : '0';
                    
                    return (
                      <div 
                        key={category} 
                        className="category-card enhanced clickable"
                        style={{ borderLeftColor: getCategoryColor(category) }}
                        onClick={() => handleCategoryClick(category)}
                        title={`Click to view ${count} records in ${category} category`}
                      >
                        <div className="category-header">
                          <div className="category-info">
                            <h3>{category}</h3>
                            <p className="category-description">
                              {getCategoryDescription(category)}
                            </p>
                          </div>
                          <div className="category-metrics">
                            <span 
                              className="category-badge"
                              style={{ backgroundColor: getCategoryColor(category) }}
                            >
                              {count}
                            </span>
                          </div>
                        </div>
                        <div className="category-stats">
                          <div className="percentage-bar">
                            <div 
                              className="percentage-fill"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: getCategoryColor(category)
                              }}
                            ></div>
                          </div>
                          <div className="category-percentage">
                            {percentage}% of total resources
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* No Data Message */}
          {(!stats?.categoryStats || Object.keys(stats.categoryStats).length === 0) && stats?.totalRecords === 0 && (
            <div className="no-data-section">
              <div className="no-data-card">
                <div className="no-data-icon">📊</div>
                <h2>No Data Available</h2>
                <p>No resource data has been loaded yet. Import your data to view comprehensive analytics and category distributions.</p>
                <div className="empty-state-actions">
                  <a href="/nbl-list" className="upload-link">Import Data</a>
                  <button onClick={fetchStats} className="refresh-link">Refresh Dashboard</button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Breakdown Table */}
          {breakdownData && breakdownData.totalRecords > 0 && (
            <div className="summary-table-section">
              <h2>Detailed Summary Breakdown</h2>
              <div className="summary-table-container">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* GenC/PA Row */}
                    <tr className="main-row">
                      <td className="category-name">GenC/PA Records</td>
                      <td className="count-value">{breakdownData.gencPaCount}</td>
                      <td className="percentage-value">
                        {((breakdownData.gencPaCount / breakdownData.totalRecords) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    
                    {/* Non-GenC Row */}
                    <tr className="main-row">
                      <td className="category-name">Non-GenC Records</td>
                      <td className="count-value">{breakdownData.nonGencCount}</td>
                      <td className="percentage-value">
                        {((breakdownData.nonGencCount / breakdownData.totalRecords) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    
                    {/* Billed Sub-row */}
                    <tr className="sub-row">
                      <td className="category-name sub-category">↳ Already Billed</td>
                      <td className="count-value">{breakdownData.billedCount}</td>
                      <td className="percentage-value">
                        {((breakdownData.billedCount / breakdownData.totalRecords) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    
                    {/* Awaiting Billing Sub-row */}
                    <tr className="sub-row">
                      <td className="category-name sub-category">↳ Awaiting Billing</td>
                      <td className="count-value">{breakdownData.awaitingBillingCount}</td>
                      <td className="percentage-value">
                        {((breakdownData.awaitingBillingCount / breakdownData.totalRecords) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    
                    {/* NBL for Month Sub-row (indented under Non-GenC) */}
                    <tr className="sub-row">
                      <td className="category-name sub-category">↳ NBL for Month</td>
                      <td className="count-value">{breakdownData.nblForMonthCount}</td>
                      <td className="percentage-value">
                        {((breakdownData.nblForMonthCount / breakdownData.totalRecords) * 100).toFixed(1)}%
                      </td>
                    </tr>
                    
                    {/* NBL for Month Secondary Categories (sub-sub-rows) */}
                    {Object.entries(breakdownData.nblForMonthSecondaryBreakdown || {}).map(([secondaryCategory, count]) => (
                      <tr key={secondaryCategory} className="sub-sub-row">
                        <td className="category-name sub-sub-category">　　↳ {secondaryCategory}</td>
                        <td className="count-value">{count}</td>
                        <td className="percentage-value">
                          {((count / breakdownData.totalRecords) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Email Summary Button */}
              <div className="summary-actions">
                <button 
                  className="email-summary-btn"
                  onClick={handleSendSummaryEmails}
                  disabled={!breakdownData || breakdownData.totalRecords === 0 || emailSending}
                >
                  {emailSending ? '📤 Sending...' : '📧 Email Summary Report'}
                </button>
              </div>
            </div>
          )}

          {/* Category Records Modal */}
          {showModal && (
            <div className="modal-overlay" onClick={handleModalClick}>
              <div className="modal-content">
                <div className="modal-header">
                  <h2>{selectedCategory} Records</h2>
                  <span className="record-count">({categoryRecords.length} records)</span>
                  <button className="close-modal" onClick={closeModal}>✖</button>
                </div>
                <div className="modal-body">
                  {recordsLoading ? (
                    <div className="loading-spinner">Loading records...</div>
                  ) : (
                    <div className="records-list">
                      {categoryRecords.length > 0 ? (
                        categoryRecords.map((record, index) => (
                          <div key={index} className="record-item">
                            <div className="record-header">
                              <h4>{record['Associate Name'] || 'N/A'}</h4>
                              <span className="record-id">ID: {record['Associate ID']}</span>
                            </div>
                            <div className="record-details">
                              <div className="detail-row">
                                <span className="label">Account:</span>
                                <span className="value">{record['Account Name'] || 'N/A'}</span>
                              </div>
                              <div className="detail-row">
                                <span className="label">Project:</span>
                                <span className="value">{record['Project Description'] || 'N/A'}</span>
                              </div>
                              <div className="detail-row">
                                <span className="label">Department:</span>
                                <span className="value">{record['Department Name'] || 'N/A'}</span>
                              </div>
                              <div className="detail-row">
                                <span className="label">Service Line:</span>
                                <span className="value">{record['Service Line'] || 'N/A'}</span>
                              </div>
                              <div className="detail-row">
                                <span className="label">Allocation:</span>
                                <span className="value">{record['Percent Allocation']}%</span>
                              </div>
                              <div className="detail-row">
                                <span className="label">Grade:</span>
                                <span className="value">{record['Grade Mapping'] || 'N/A'}</span>
                              </div>
                              <div className="detail-row">
                                <span className="label">Primary State:</span>
                                <span className="value">{record['Primary State Tag'] || 'N/A'}</span>
                              </div>
                              {record['Secondary State Tag'] && record['Secondary State Tag'] !== '0' && (
                                <div className="detail-row">
                                  <span className="label">Secondary State:</span>
                                  <span className="value">{record['Secondary State Tag']}</span>
                                </div>
                              )}
                              {record['Billable/ Release Date(MM/DD/YYYY)'] && (
                                <div className="detail-row">
                                  <span className="label">Release Date:</span>
                                  <span className="value">{record['Billable/ Release Date(MM/DD/YYYY)']}</span>
                                </div>
                              )}
                              {record['Remarks'] && (
                                <div className="detail-row">
                                  <span className="label">Remarks:</span>
                                  <span className="value">{record['Remarks']}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-records">
                          <p>No records found for this category.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
