import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [breakdownData, setBreakdownData] = useState(null);
  const [emailSending, setEmailSending] = useState(false);

  useEffect(() => {
    fetchStats();
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
        
        // Fetch actual records to calculate detailed breakdown
        await fetchDetailedBreakdown(response.data.data);
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

  const fetchDetailedBreakdown = async (statsData) => {
    try {
      console.log('Fetching detailed records for breakdown...');
      const response = await api.getNBLList();
      
      if (response.data.success && response.data.data.length > 0) {
        const records = response.data.data;
        const calculatedBreakdown = calculateDetailedBreakdownFromRecords(records, statsData);
        setBreakdownData(calculatedBreakdown);
      } else {
        // Fallback to simple calculation if no records
        const calculatedBreakdown = calculateBreakdownFromStats(statsData);
        setBreakdownData(calculatedBreakdown);
      }
    } catch (err) {
      console.error('Error fetching detailed breakdown:', err);
      // Fallback to simple calculation
      const calculatedBreakdown = calculateBreakdownFromStats(statsData);
      setBreakdownData(calculatedBreakdown);
    }
  };

  const calculateDetailedBreakdownFromRecords = (records, statsData) => {
    const totalRecords = records.length;
    const categoryStats = statsData.categoryStats || {};
    
    let gencPaCount = 0;
    let nonGencCount = 0;
    let billedCount = 0;
    let awaitingBillingCount = 0;
    let nblForMonthCount = 0;
    let nblCount = 0;
    
    // NBL for Month secondary breakdown by NBL Secondary Category
    let nblForMonthAwaitingBilling = 0;
    let nblForMonthMarkedForRelease = 0;
    let nblForMonthMLReturn = 0;
    
    const secondaryCategories = {};
    
    records.forEach(record => {
      const nblCategory = record['NBL Category'] || '';
      const secondaryStateTag = record['Secondary State Tag'] || '';
      const nblSecondaryCategory = record['NBL Secondary Category'] || '';
      
      // Count secondary categories
      if (secondaryStateTag && secondaryStateTag.trim() && secondaryStateTag !== '0') {
        secondaryCategories[secondaryStateTag] = (secondaryCategories[secondaryStateTag] || 0) + 1;
        
        // Determine if this is GenC or Non-GenC based on secondary category
        // GenC categories include "GenC" in the name
        const isGenC = secondaryStateTag.toLowerCase().includes('genc');
        
        if (isGenC) {
          gencPaCount++;
        } else {
          nonGencCount++;
        }
      } else {
        // If no secondary category, assume Non-GenC
        nonGencCount++;
      }
      
      // Count primary NBL categories
      const normalizedCategory = nblCategory.trim().toLowerCase();
      if (normalizedCategory.includes('billed')) {
        billedCount++;
      } else if (normalizedCategory.includes('awaiting') && normalizedCategory.includes('bill')) {
        awaitingBillingCount++;
      } else if (normalizedCategory.includes('nbl for') && normalizedCategory.includes('month')) {
        nblForMonthCount++;
        
        // For NBL for Month, break down by NBL Secondary Category
        if (nblSecondaryCategory && nblSecondaryCategory.trim()) {
          const secondaryLower = nblSecondaryCategory.toLowerCase().trim();
          console.log('NBL for Month record:', {
            nblCategory,
            nblSecondaryCategory,
            secondaryLower
          });
          
          if (secondaryLower.includes('awaiting') && secondaryLower.includes('bill')) {
            nblForMonthAwaitingBilling++;
            console.log('Found NBL for Month - Awaiting Billing:', nblSecondaryCategory);
          } else if (secondaryLower === 'release' || (secondaryLower.includes('marked') && secondaryLower.includes('release'))) {
            nblForMonthMarkedForRelease++;
            console.log('Found NBL for Month - Marked for Release:', nblSecondaryCategory);
          } else if (secondaryLower.includes('ml') && secondaryLower.includes('return')) {
            nblForMonthMLReturn++;
            console.log('Found NBL for Month - ML Return:', nblSecondaryCategory);
          } else {
            console.log('NBL for Month - Other secondary category (not counted):', nblSecondaryCategory);
          }
        }
      } else if (normalizedCategory === 'nbl') {
        nblCount++;
      }
    });
    
    console.log('NBL for Month breakdown:', {
      awaitingBilling: nblForMonthAwaitingBilling,
      markedForRelease: nblForMonthMarkedForRelease,
      mlReturn: nblForMonthMLReturn
    });
    
    return {
      totalRecords,
      gencPaCount,
      nonGencCount,
      billedCount,
      awaitingBillingCount,
      nblForMonthCount,
      nblCount,
      categoryBreakdown: categoryStats,
      secondaryCategories,
      // NBL for Month secondary breakdown
      nblForMonthBreakdown: {
        awaitingBilling: nblForMonthAwaitingBilling,
        markedForRelease: nblForMonthMarkedForRelease,
        mlReturn: nblForMonthMLReturn
      }
    };
  };

  const calculateBreakdownFromStats = (statsData) => {
    const categoryStats = statsData.categoryStats || {};
    const totalRecords = statsData.totalRecords || 0;
    
    // Calculate breakdown based on NBL categories
    const billedCount = categoryStats['Billed'] || 0;
    const awaitingBillingCount = categoryStats['Awaiting billing'] || 0;
    const nblForMonthCount = categoryStats['NBL for the month'] || categoryStats['NBL for month'] || 0;
    const nblCount = categoryStats['NBL'] || 0;
    
    // For now, we'll use a simple calculation for GenC vs Non-GenC
    // This should be updated when we have secondary category data
    const nonGencCount = billedCount + awaitingBillingCount + nblForMonthCount + nblCount;
    const gencPaCount = Math.max(0, totalRecords - nonGencCount);
    
    return {
      totalRecords,
      gencPaCount,
      nonGencCount,
      billedCount,
      awaitingBillingCount,
      nblForMonthCount,
      nblCount,
      categoryBreakdown: categoryStats,
      // We'll need to get this from the actual data
      secondaryCategories: {}
    };
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
          </div>

          {/* NBL Category Cards */}
          {(stats?.totalRecords || 0) > 0 && stats?.categoryStats && (
            <div className="category-cards-section">
              <h2>NBL Category Distribution</h2>
              <div className="category-cards-grid">
                {Object.entries(stats.categoryStats)
                  .sort(([,a], [,b]) => b - a) // Sort by count descending
                  .map(([category, count]) => {
                    const percentage = stats.totalRecords > 0 
                      ? ((count / stats.totalRecords) * 100).toFixed(1)
                      : '0.0';
                    
                    const getCategoryColor = (cat) => {
                      const colors = {
                        'NBL': '#ef4444', // red
                        'Awaiting billing': '#f59e0b', // amber
                        'NBL for the month': '#3b82f6', // blue
                        'NBL for month': '#3b82f6', // blue (alternative spelling)
                        'Billed': '#10b981', // emerald
                      };
                      return colors[cat] || '#6b7280'; // gray for unknown
                    };
                    
                    return (
                      <div 
                        key={category} 
                        className="category-card"
                        style={{ borderLeftColor: getCategoryColor(category) }}
                      >
                        <div className="category-header">
                          <h3>{category}</h3>
                          <div className="category-metrics">
                            <span 
                              className="category-count"
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
          {stats?.totalRecords === 0 && (
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
          {(stats?.totalRecords || 0) > 0 && (
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
                    {/* Total Records Row */}
                    <tr className="main-row total-row">
                      <td className="category-name"><strong>Total Records</strong></td>
                      <td className="count-value"><strong>{stats?.totalRecords || 0}</strong></td>
                      <td className="percentage-value"><strong>100.0%</strong></td>
                    </tr>
                    
                    {/* GenC/PA Row - based on secondary NBL category */}
                    <tr className="main-row genc-row">
                      <td className="category-name">GenC/PA Records</td>
                      <td className="count-value">{breakdownData?.gencPaCount || 0}</td>
                      <td className="percentage-value">
                        {(stats?.totalRecords || 0) > 0 ? (((breakdownData?.gencPaCount || 0) / stats.totalRecords) * 100).toFixed(1) : '0.0'}%
                      </td>
                    </tr>
                    
                    {/* Non-GenC Row */}
                    <tr className="main-row non-genc-row">
                      <td className="category-name">Non-GenC Records</td>
                      <td className="count-value">{breakdownData?.nonGencCount || 0}</td>
                      <td className="percentage-value">
                        {(stats?.totalRecords || 0) > 0 ? (((breakdownData?.nonGencCount || 0) / stats.totalRecords) * 100).toFixed(1) : '0.0'}%
                      </td>
                    </tr>
                    
                    {/* Already Billed - sub-menu under Non-GenC Records */}
                    {breakdownData?.billedCount > 0 && (
                      <tr className="sub-sub-row">
                        <td className="category-name sub-sub-category">　　Already Billed</td>
                        <td className="count-value">{breakdownData.billedCount}</td>
                        <td className="percentage-value">
                          {(stats?.totalRecords || 0) > 0 ? ((breakdownData.billedCount / stats.totalRecords) * 100).toFixed(1) : '0.0'}%
                        </td>
                      </tr>
                    )}
                    
                    {/* Awaiting Billing - sub-menu under Non-GenC Records */}
                    {breakdownData?.awaitingBillingCount > 0 && (
                      <tr className="sub-sub-row">
                        <td className="category-name sub-sub-category">　　Awaiting Billing</td>
                        <td className="count-value">{breakdownData.awaitingBillingCount}</td>
                        <td className="percentage-value">
                          {(stats?.totalRecords || 0) > 0 ? ((breakdownData.awaitingBillingCount / stats.totalRecords) * 100).toFixed(1) : '0.0'}%
                        </td>
                      </tr>
                    )}
                    
                    {/* NBL for Month - sub-category under Non-GenC Records */}
                    {breakdownData?.nblForMonthCount > 0 && (
                      <>
                        <tr className="sub-sub-row">
                          <td className="category-name sub-sub-category">　　NBL for Month</td>
                          <td className="count-value">{breakdownData.nblForMonthCount}</td>
                          <td className="percentage-value">
                            {(stats?.totalRecords || 0) > 0 ? ((breakdownData.nblForMonthCount / stats.totalRecords) * 100).toFixed(1) : '0.0'}%
                          </td>
                        </tr>
                        
                        {/* NBL for Month Secondary Categories - based on NBL Secondary Category field */}
                        {breakdownData?.nblForMonthBreakdown?.awaitingBilling > 0 && (
                          <tr className="sub-sub-row">
                            <td className="category-name sub-sub-sub-category">　　　　Awaiting Billing</td>
                            <td className="count-value">{breakdownData.nblForMonthBreakdown.awaitingBilling}</td>
                            <td className="percentage-value">
                              {(stats?.totalRecords || 0) > 0 ? ((breakdownData.nblForMonthBreakdown.awaitingBilling / stats.totalRecords) * 100).toFixed(1) : '0.0'}%
                            </td>
                          </tr>
                        )}
                        
                        {breakdownData?.nblForMonthBreakdown?.markedForRelease > 0 && (
                          <tr className="sub-sub-row">
                            <td className="category-name sub-sub-sub-category">　　　　Marked for Release</td>
                            <td className="count-value">{breakdownData.nblForMonthBreakdown.markedForRelease}</td>
                            <td className="percentage-value">
                              {(stats?.totalRecords || 0) > 0 ? ((breakdownData.nblForMonthBreakdown.markedForRelease / stats.totalRecords) * 100).toFixed(1) : '0.0'}%
                            </td>
                          </tr>
                        )}
                        
                        {breakdownData?.nblForMonthBreakdown?.mlReturn > 0 && (
                          <tr className="sub-sub-row">
                            <td className="category-name sub-sub-sub-category">　　　　ML Return</td>
                            <td className="count-value">{breakdownData.nblForMonthBreakdown.mlReturn}</td>
                            <td className="percentage-value">
                              {(stats?.totalRecords || 0) > 0 ? ((breakdownData.nblForMonthBreakdown.mlReturn / stats.totalRecords) * 100).toFixed(1) : '0.0'}%
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                    
                    {/* NBL - sub-menu under Non-GenC Records */}
                    {breakdownData?.nblCount > 0 && (
                      <tr className="sub-sub-row">
                        <td className="category-name sub-sub-category">　　NBL</td>
                        <td className="count-value">{breakdownData.nblCount}</td>
                        <td className="percentage-value">
                          {(stats?.totalRecords || 0) > 0 ? ((breakdownData.nblCount / stats.totalRecords) * 100).toFixed(1) : '0.0'}%
                        </td>
                      </tr>
                    )}
                    
                    {/* Show message if no breakdown data is available */}
                    {!breakdownData && (
                      <tr>
                        <td colSpan="3" className="loading-row">
                          <em>Loading detailed breakdown data...</em>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Email Summary Button - Always show when there are records */}
              <div className="summary-actions">
                <button 
                  className="email-summary-btn"
                  onClick={handleSendSummaryEmails}
                  disabled={!breakdownData || (stats?.totalRecords || 0) === 0 || emailSending}
                >
                  {emailSending ? '📤 Sending...' : '📧 Email Summary Report'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
