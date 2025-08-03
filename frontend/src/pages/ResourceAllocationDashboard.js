import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/resource-allocation-dashboard.css';
const ResourceAllocationDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    existingAllocations: {
      totalRecords: 0,
      lastUpload: null,
      fileName: null,
      billableAnalytics: { billable: 0, nonBillable: 0, unknown: 0 },
      gradeAnalytics: {},
      offshoreAnalytics: { offshore: 0, onshore: 0, unknown: 0, ratio: '0%' }
    },
    newAllocations: {
      totalRecords: 0,
      lastUpload: null,
      fileName: null,
      billableAnalytics: { billable: 0, nonBillable: 0, unknown: 0 },
      gradeAnalytics: {},
      offshoreAnalytics: { offshore: 0, onshore: 0, unknown: 0, ratio: '0%' }
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadDashboardData();
  }, []);
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // Load existing allocations stats and analytics
      const [existingAllocationsResponse, existingBillableResponse, existingGradeResponse, existingOffshoreResponse] = await Promise.all([
        api.getAllocationDataStats(),
        api.getAllocationDataBillableAnalytics(),
        api.getAllocationDataGradeAnalytics(),
        api.getAllocationDataOffshoreAnalytics()
      ]);
      // Load new allocations stats and analytics
      const [newAllocationsResponse, newBillableResponse, newGradeResponse, newOffshoreResponse] = await Promise.all([
        api.getNewAllocationsStats(),
        api.getNewAllocationsBillableAnalytics(),
        api.getNewAllocationsGradeAnalytics(),
        api.getNewAllocationsOffshoreAnalytics()
      ]);

      console.log('API Responses:', {
        existingAllocationsResponse: existingAllocationsResponse.data,
        existingBillableResponse: existingBillableResponse.data,
        existingGradeResponse: existingGradeResponse.data,
        existingOffshoreResponse: existingOffshoreResponse.data,
        newAllocationsResponse: newAllocationsResponse.data,
        newBillableResponse: newBillableResponse.data,
        newGradeResponse: newGradeResponse.data,
        newOffshoreResponse: newOffshoreResponse.data
      });
      setDashboardData({
        existingAllocations: {
          totalRecords: existingAllocationsResponse.data.success ? existingAllocationsResponse.data.stats.totalRecords : 0,
          lastUpload: existingAllocationsResponse.data.success ? { timestamp: existingAllocationsResponse.data.stats.lastUpload } : null,
          fileName: existingAllocationsResponse.data.success ? existingAllocationsResponse.data.stats.uploadInfo?.fileName : null,
          billableAnalytics: existingBillableResponse.data.success ? existingBillableResponse.data.analytics : { billable: 0, nonBillable: 0, unknown: 0 },
          gradeAnalytics: existingGradeResponse.data.success ? existingGradeResponse.data.analytics : {},
          offshoreAnalytics: existingOffshoreResponse.data.success ? existingOffshoreResponse.data.analytics : { offshore: 0, onshore: 0, unknown: 0, ratio: '0%' }
        },
        newAllocations: {
          totalRecords: newAllocationsResponse.data.success ? newAllocationsResponse.data.stats.totalRecords : 0,
          lastUpload: newAllocationsResponse.data.success ? { timestamp: newAllocationsResponse.data.stats.lastUpload } : null,
          fileName: newAllocationsResponse.data.success ? newAllocationsResponse.data.stats.uploadInfo?.fileName : null,
          billableAnalytics: newBillableResponse.data.success ? newBillableResponse.data.analytics : { billable: 0, nonBillable: 0, unknown: 0 },
          gradeAnalytics: newGradeResponse.data.success ? newGradeResponse.data.analytics : {},
          offshoreAnalytics: newOffshoreResponse.data.success ? newOffshoreResponse.data.analytics : { offshore: 0, onshore: 0, unknown: 0, ratio: '0%' }
        }
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default empty data on error
      setDashboardData({
        existingAllocations: {
          totalRecords: 0,
          lastUpload: null,
          fileName: null,
          billableAnalytics: { billable: 0, nonBillable: 0, unknown: 0 },
          gradeAnalytics: {},
          offshoreAnalytics: { offshore: 0, onshore: 0, unknown: 0, ratio: '0%' }
        },
        newAllocations: {
          totalRecords: 0,
          lastUpload: null,
          fileName: null,
          billableAnalytics: { billable: 0, nonBillable: 0, unknown: 0 },
          gradeAnalytics: {},
          offshoreAnalytics: { offshore: 0, onshore: 0, unknown: 0, ratio: '0%' }
        }
      });
    } finally {
      setIsLoading(false);
    }
  };
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };
  const calculatePercentage = (value, total) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };
  const getTotalForDataset = (dataset) => {
    return dataset.billableAnalytics.billable + 
           dataset.billableAnalytics.nonBillable + 
           dataset.billableAnalytics.unknown;
  };
  const getTotalGradesForDataset = (dataset) => {
    return Object.values(dataset.gradeAnalytics || {}).reduce((sum, count) => sum + count, 0);
  };
  const getCombinedTotal = () => {
    return getTotalForDataset(dashboardData.existingAllocations) + getTotalForDataset(dashboardData.newAllocations);
  };
  const getCombinedGradesTotal = () => {
    const combinedGrades = {};
    // Add existing allocations grades
    Object.entries(dashboardData.existingAllocations.gradeAnalytics || {}).forEach(([grade, count]) => {
      combinedGrades[grade] = (combinedGrades[grade] || 0) + count;
    });
    // Add new allocations grades
    Object.entries(dashboardData.newAllocations.gradeAnalytics || {}).forEach(([grade, count]) => {
      combinedGrades[grade] = (combinedGrades[grade] || 0) + count;
    });
    return Object.values(combinedGrades).reduce((sum, count) => sum + count, 0);
  };
  const getCombinedOffshoreAnalytics = () => {
    const combined = { offshore: 0, onshore: 0, unknown: 0, ratio: '0%' };
    
    // Add existing allocations offshore data
    combined.offshore += dashboardData.existingAllocations.offshoreAnalytics.offshore;
    combined.onshore += dashboardData.existingAllocations.offshoreAnalytics.onshore;
    combined.unknown += dashboardData.existingAllocations.offshoreAnalytics.unknown;
    
    // Add new allocations offshore data
    combined.offshore += dashboardData.newAllocations.offshoreAnalytics.offshore;
    combined.onshore += dashboardData.newAllocations.offshoreAnalytics.onshore;
    combined.unknown += dashboardData.newAllocations.offshoreAnalytics.unknown;
    
    // Calculate combined ratio using formula: (onshore * 100) / total offshore
    if (combined.offshore > 0) {
      const ratio = (combined.onshore * 100) / combined.offshore;
      combined.ratio = `${ratio.toFixed(1)}%`;
    } else if (combined.onshore > 0) {
      combined.ratio = '∞%'; // Infinite when there's onshore but no offshore
    } else {
      combined.ratio = '0%';
    }
    
    return combined;
  };

  return (
    <div className="resource-allocation-dashboard-container">
      <div className="dashboard-header">
        <h1>Resource Allocation Dashboard</h1>
        <p>Overview of resource allocation data and statistics</p>
      </div>
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner">⌛</div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {/* Existing Allocations Analytics Section */}
          <div className="analytics-section">
            <div className="section-header">
              <h2>📊 Existing Allocations Analytics</h2>
            </div>
            {/* Billable/Non-Billable Row */}
            <div className="analytics-row">
              <h3>Billable Status</h3>
              <div className="analytics-cards-grid">
                <div className="analytics-card billable">
                  <div className="analytics-card-content">
                    <div className="analytics-card-value">
                      {dashboardData.existingAllocations.billableAnalytics.billable.toLocaleString()}
                    </div>
                    <div className="analytics-card-percentage">
                      {calculatePercentage(dashboardData.existingAllocations.billableAnalytics.billable, getTotalForDataset(dashboardData.existingAllocations))}
                    </div>
                    <div className="analytics-card-label">Billable Resources</div>
                  </div>
                  <div className="analytics-card-icon">💰</div>
                </div>
                <div className="analytics-card non-billable">
                  <div className="analytics-card-content">
                    <div className="analytics-card-value">
                      {dashboardData.existingAllocations.billableAnalytics.nonBillable.toLocaleString()}
                    </div>
                    <div className="analytics-card-percentage">
                      {calculatePercentage(dashboardData.existingAllocations.billableAnalytics.nonBillable, getTotalForDataset(dashboardData.existingAllocations))}
                    </div>
                    <div className="analytics-card-label">Non-Billable Resources</div>
                  </div>
                  <div className="analytics-card-icon">📋</div>
                </div>
                {dashboardData.existingAllocations.billableAnalytics.unknown > 0 && (
                  <div className="analytics-card unknown">
                    <div className="analytics-card-content">
                      <div className="analytics-card-value">
                        {dashboardData.existingAllocations.billableAnalytics.unknown.toLocaleString()}
                      </div>
                      <div className="analytics-card-percentage">
                        {calculatePercentage(dashboardData.existingAllocations.billableAnalytics.unknown, getTotalForDataset(dashboardData.existingAllocations))}
                      </div>
                      <div className="analytics-card-label">Unknown Status</div>
                    </div>
                    <div className="analytics-card-icon">❓</div>
                  </div>
                )}
              </div>
            </div>
            {/* Grade Description Row */}
            <div className="analytics-row">
              <h3>Grade Distribution</h3>
              <div className="analytics-cards-grid">
                {Object.entries(dashboardData.existingAllocations.gradeAnalytics || {})
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([grade, count], index) => (
                    <div key={grade} className={`analytics-card grade grade-${index}`}>
                      <div className="analytics-card-content">
                        <div className="analytics-card-value">{count.toLocaleString()}</div>
                        <div className="analytics-card-percentage">
                          {calculatePercentage(count, getTotalGradesForDataset(dashboardData.existingAllocations))}
                        </div>
                        <div className="analytics-card-label">{grade}</div>
                      </div>
                      <div className="analytics-card-icon">👨‍💼</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          {/* New Allocations Analytics Section */}
          <div className="analytics-section">
            <div className="section-header">
              <h2>🆕 New Allocations Analytics</h2>
            </div>
            {/* Billable/Non-Billable Row */}
            <div className="analytics-row">
              <h3>Billable Status</h3>
              <div className="analytics-cards-grid">
                <div className="analytics-card billable">
                  <div className="analytics-card-content">
                    <div className="analytics-card-value">
                      {dashboardData.newAllocations.billableAnalytics.billable.toLocaleString()}
                    </div>
                    <div className="analytics-card-percentage">
                      {calculatePercentage(dashboardData.newAllocations.billableAnalytics.billable, getTotalForDataset(dashboardData.newAllocations))}
                    </div>
                    <div className="analytics-card-label">Billable Resources</div>
                  </div>
                  <div className="analytics-card-icon">�</div>
                </div>
                <div className="analytics-card non-billable">
                  <div className="analytics-card-content">
                    <div className="analytics-card-value">
                      {dashboardData.newAllocations.billableAnalytics.nonBillable.toLocaleString()}
                    </div>
                    <div className="analytics-card-percentage">
                      {calculatePercentage(dashboardData.newAllocations.billableAnalytics.nonBillable, getTotalForDataset(dashboardData.newAllocations))}
                    </div>
                    <div className="analytics-card-label">Non-Billable Resources</div>
                  </div>
                  <div className="analytics-card-icon">📋</div>
                </div>
                {dashboardData.newAllocations.billableAnalytics.unknown > 0 && (
                  <div className="analytics-card unknown">
                    <div className="analytics-card-content">
                      <div className="analytics-card-value">
                        {dashboardData.newAllocations.billableAnalytics.unknown.toLocaleString()}
                      </div>
                      <div className="analytics-card-percentage">
                        {calculatePercentage(dashboardData.newAllocations.billableAnalytics.unknown, getTotalForDataset(dashboardData.newAllocations))}
                      </div>
                      <div className="analytics-card-label">Unknown Status</div>
                    </div>
                    <div className="analytics-card-icon">❓</div>
                  </div>
                )}
              </div>
            </div>
            {/* Grade Description Row */}
            <div className="analytics-row">
              <h3>Grade Distribution</h3>
              <div className="analytics-cards-grid">
                {Object.entries(dashboardData.newAllocations.gradeAnalytics || {})
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([grade, count], index) => (
                    <div key={grade} className={`analytics-card grade grade-${index}`}>
                      <div className="analytics-card-content">
                        <div className="analytics-card-value">{count.toLocaleString()}</div>
                        <div className="analytics-card-percentage">
                          {calculatePercentage(count, getTotalGradesForDataset(dashboardData.newAllocations))}
                        </div>
                        <div className="analytics-card-label">{grade}</div>
                      </div>
                      <div className="analytics-card-icon">👨‍💼</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          {/* Combined Overview Section */}
          <div className="analytics-section">
            <div className="section-header">
              <h2>📈 Combined Overview</h2>
            </div>
            {/* Combined Billable/Non-Billable Row */}
            <div className="analytics-row">
              <h3>Total Billable Status</h3>
              <div className="analytics-cards-grid">
                <div className="analytics-card billable">
                  <div className="analytics-card-content">
                    <div className="analytics-card-value">
                      {(dashboardData.existingAllocations.billableAnalytics.billable + dashboardData.newAllocations.billableAnalytics.billable).toLocaleString()}
                    </div>
                    <div className="analytics-card-percentage">
                      {calculatePercentage(
                        dashboardData.existingAllocations.billableAnalytics.billable + dashboardData.newAllocations.billableAnalytics.billable, 
                        getCombinedTotal()
                      )}
                    </div>
                    <div className="analytics-card-label">Total Billable Resources</div>
                  </div>
                  <div className="analytics-card-icon">💰</div>
                </div>
                <div className="analytics-card non-billable">
                  <div className="analytics-card-content">
                    <div className="analytics-card-value">
                      {(dashboardData.existingAllocations.billableAnalytics.nonBillable + dashboardData.newAllocations.billableAnalytics.nonBillable).toLocaleString()}
                    </div>
                    <div className="analytics-card-percentage">
                      {calculatePercentage(
                        dashboardData.existingAllocations.billableAnalytics.nonBillable + dashboardData.newAllocations.billableAnalytics.nonBillable, 
                        getCombinedTotal()
                      )}
                    </div>
                    <div className="analytics-card-label">Total Non-Billable Resources</div>
                  </div>
                  <div className="analytics-card-icon">📋</div>
                </div>
                {(dashboardData.existingAllocations.billableAnalytics.unknown + dashboardData.newAllocations.billableAnalytics.unknown) > 0 && (
                  <div className="analytics-card unknown">
                    <div className="analytics-card-content">
                      <div className="analytics-card-value">
                        {(dashboardData.existingAllocations.billableAnalytics.unknown + dashboardData.newAllocations.billableAnalytics.unknown).toLocaleString()}
                      </div>
                      <div className="analytics-card-percentage">
                        {calculatePercentage(
                          dashboardData.existingAllocations.billableAnalytics.unknown + dashboardData.newAllocations.billableAnalytics.unknown, 
                          getCombinedTotal()
                        )}
                      </div>
                      <div className="analytics-card-label">Total Unknown Status</div>
                    </div>
                    <div className="analytics-card-icon">❓</div>
                  </div>
                )}
              </div>
            </div>
            {/* Combined Grade Description Row */}
            <div className="analytics-row">
              <h3>Total Grade Distribution</h3>
              <div className="analytics-cards-grid">
                {(() => {
                  // Combine grade analytics from both datasets
                  const combinedGrades = {};
                  // Add existing allocations grades
                  Object.entries(dashboardData.existingAllocations.gradeAnalytics || {}).forEach(([grade, count]) => {
                    combinedGrades[grade] = (combinedGrades[grade] || 0) + count;
                  });
                  // Add new allocations grades
                  Object.entries(dashboardData.newAllocations.gradeAnalytics || {}).forEach(([grade, count]) => {
                    combinedGrades[grade] = (combinedGrades[grade] || 0) + count;
                  });
                  // Sort by count and take top 6
                  const topGrades = Object.entries(combinedGrades)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 6);
                  return topGrades.map(([grade, count], index) => (
                    <div key={grade} className={`analytics-card grade grade-${index}`}>
                      <div className="analytics-card-content">
                        <div className="analytics-card-value">{count.toLocaleString()}</div>
                        <div className="analytics-card-percentage">
                          {calculatePercentage(count, getCombinedGradesTotal())}
                        </div>
                        <div className="analytics-card-label">{grade}</div>
                      </div>
                      <div className="analytics-card-icon">👨‍💼</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            {/* Combined Offshore/Onshore Row */}
            <div className="analytics-row">
              <h3>Total Location Distribution</h3>
              <div className="analytics-cards-grid">
                <div className="analytics-card offshore">
                  <div className="analytics-card-content">
                    <div className="analytics-card-value">
                      {getCombinedOffshoreAnalytics().offshore.toLocaleString()}
                    </div>
                    <div className="analytics-card-percentage">
                      {calculatePercentage(getCombinedOffshoreAnalytics().offshore, getCombinedTotal())}
                    </div>
                    <div className="analytics-card-label">Offshore Resources</div>
                  </div>
                  <div className="analytics-card-icon">🌍</div>
                </div>
                <div className="analytics-card onshore">
                  <div className="analytics-card-content">
                    <div className="analytics-card-value">
                      {getCombinedOffshoreAnalytics().onshore.toLocaleString()}
                    </div>
                    <div className="analytics-card-percentage">
                      {calculatePercentage(getCombinedOffshoreAnalytics().onshore, getCombinedTotal())}
                    </div>
                    <div className="analytics-card-label">Onshore Resources</div>
                  </div>
                  <div className="analytics-card-icon">🏢</div>
                </div>
                <div className="analytics-card ratio">
                  <div className="analytics-card-content">
                    <div className="analytics-card-value">
                      {getCombinedOffshoreAnalytics().ratio}
                    </div>
                    <div className="analytics-card-percentage">
                      Onshore Ratio vs Offshore
                    </div>
                    <div className="analytics-card-label">Resource Ratio</div>
                  </div>
                  <div className="analytics-card-icon">⚖️</div>
                </div>
                {getCombinedOffshoreAnalytics().unknown > 0 && (
                  <div className="analytics-card unknown">
                    <div className="analytics-card-content">
                      <div className="analytics-card-value">
                        {getCombinedOffshoreAnalytics().unknown.toLocaleString()}
                      </div>
                      <div className="analytics-card-percentage">
                        {calculatePercentage(getCombinedOffshoreAnalytics().unknown, getCombinedTotal())}
                      </div>
                      <div className="analytics-card-label">Unknown Location</div>
                    </div>
                    <div className="analytics-card-icon">❓</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ResourceAllocationDashboard;
