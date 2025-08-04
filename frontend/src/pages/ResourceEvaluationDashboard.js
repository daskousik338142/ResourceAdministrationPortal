import React, { useState, useEffect } from 'react';
import '../styles/resource-evaluation-dashboard.css';

const ResourceEvaluationDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalEvaluations: 0,
    activeEvaluations: 0,
    completedEvaluations: 0,
    agingAnalytics: {
      under7Days: 0,
      between7And14Days: 0,
      between15And30Days: 0,
      over30Days: 0
    },
    completionStatus: {
      bothComplete: 0,
      internalOnly: 0,
      clientOnly: 0,
      neitherComplete: 0
    },
    passFailAnalytics: {
      internal: {
        pass: 0,
        fail: 0,
        pending: 0
      },
      client: {
        pass: 0,
        fail: 0,
        pending: 0
      },
      overall: {
        bothPass: 0,
        internalPassClientFail: 0,
        internalFailClientPass: 0,
        bothFail: 0,
        pending: 0
      }
    },
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/resource-evaluations/dashboard/analytics');
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.error || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getAgingColor = (days) => {
    if (days <= 7) return '#28a745'; // Green
    if (days <= 14) return '#ffc107'; // Yellow
    if (days <= 30) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  const calculatePercentage = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Resource Evaluation Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Total Evaluations</h3>
            <div className="card-value">{dashboardData.totalEvaluations}</div>
          </div>
        </div>
        <div className="summary-card active">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <h3>Active Evaluations</h3>
            <div className="card-value">{dashboardData.activeEvaluations}</div>
          </div>
        </div>
        <div className="summary-card completed">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>Completed Evaluations</h3>
            <div className="card-value">{dashboardData.completedEvaluations}</div>
          </div>
        </div>
        <div className="summary-card completion-rate">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Completion Rate</h3>
            <div className="card-value">
              {calculatePercentage(dashboardData.completedEvaluations, dashboardData.totalEvaluations)}%
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Aging Analytics */}
        <div className="dashboard-card aging-analytics">
          <h3>📅 Evaluation Aging Analysis</h3>
          <div className="aging-chart">
            <div className="aging-bar-container">
              <div className="aging-bar">
                <div className="bar-segment under-7" 
                     style={{width: `${calculatePercentage(dashboardData.agingAnalytics.under7Days, dashboardData.activeEvaluations)}%`}}>
                </div>
                <div className="bar-segment between-7-14" 
                     style={{width: `${calculatePercentage(dashboardData.agingAnalytics.between7And14Days, dashboardData.activeEvaluations)}%`}}>
                </div>
                <div className="bar-segment between-15-30" 
                     style={{width: `${calculatePercentage(dashboardData.agingAnalytics.between15And30Days, dashboardData.activeEvaluations)}%`}}>
                </div>
                <div className="bar-segment over-30" 
                     style={{width: `${calculatePercentage(dashboardData.agingAnalytics.over30Days, dashboardData.activeEvaluations)}%`}}>
                </div>
              </div>
            </div>
            <div className="aging-legend">
              <div className="legend-item">
                <span className="legend-color under-7"></span>
                <span>Under 7 days ({dashboardData.agingAnalytics.under7Days})</span>
              </div>
              <div className="legend-item">
                <span className="legend-color between-7-14"></span>
                <span>7-14 days ({dashboardData.agingAnalytics.between7And14Days})</span>
              </div>
              <div className="legend-item">
                <span className="legend-color between-15-30"></span>
                <span>15-30 days ({dashboardData.agingAnalytics.between15And30Days})</span>
              </div>
              <div className="legend-item">
                <span className="legend-color over-30"></span>
                <span>Over 30 days ({dashboardData.agingAnalytics.over30Days})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Status */}
        <div className="dashboard-card completion-status">
          <h3>🎯 Evaluation Completion Status</h3>
          <div className="completion-grid">
            <div className="completion-item both-complete">
              <div className="completion-value">{dashboardData.completionStatus.bothComplete}</div>
              <div className="completion-label">Both Complete</div>
              <div className="completion-subtitle">Internal & Client</div>
            </div>
            <div className="completion-item internal-only">
              <div className="completion-value">{dashboardData.completionStatus.internalOnly}</div>
              <div className="completion-label">Internal Only</div>
              <div className="completion-subtitle">Client Pending</div>
            </div>
            <div className="completion-item client-only">
              <div className="completion-value">{dashboardData.completionStatus.clientOnly}</div>
              <div className="completion-label">Client Only</div>
              <div className="completion-subtitle">Internal Pending</div>
            </div>
            <div className="completion-item neither-complete">
              <div className="completion-value">{dashboardData.completionStatus.neitherComplete}</div>
              <div className="completion-label">Neither Complete</div>
              <div className="completion-subtitle">Both Pending</div>
            </div>
          </div>
        </div>

        {/* Internal Pass/Fail Analytics */}
        <div className="dashboard-card pass-fail-internal">
          <h3>🏢 Internal Evaluation Results</h3>
          <div className="pass-fail-chart">
            <div className="pass-fail-item pass">
              <div className="pass-fail-circle">
                <div className="pass-fail-value">{dashboardData.passFailAnalytics.internal.pass}</div>
                <div className="pass-fail-label">Pass</div>
              </div>
            </div>
            <div className="pass-fail-item fail">
              <div className="pass-fail-circle">
                <div className="pass-fail-value">{dashboardData.passFailAnalytics.internal.fail}</div>
                <div className="pass-fail-label">Fail</div>
              </div>
            </div>
            <div className="pass-fail-item pending">
              <div className="pass-fail-circle">
                <div className="pass-fail-value">{dashboardData.passFailAnalytics.internal.pending}</div>
                <div className="pass-fail-label">Pending</div>
              </div>
            </div>
          </div>
          <div className="pass-fail-summary">
            Pass Rate: {calculatePercentage(
              dashboardData.passFailAnalytics.internal.pass,
              dashboardData.passFailAnalytics.internal.pass + dashboardData.passFailAnalytics.internal.fail
            )}%
          </div>
        </div>

        {/* Client Pass/Fail Analytics */}
        <div className="dashboard-card pass-fail-client">
          <h3>🤝 Client Evaluation Results</h3>
          <div className="pass-fail-chart">
            <div className="pass-fail-item pass">
              <div className="pass-fail-circle">
                <div className="pass-fail-value">{dashboardData.passFailAnalytics.client.pass}</div>
                <div className="pass-fail-label">Pass</div>
              </div>
            </div>
            <div className="pass-fail-item fail">
              <div className="pass-fail-circle">
                <div className="pass-fail-value">{dashboardData.passFailAnalytics.client.fail}</div>
                <div className="pass-fail-label">Fail</div>
              </div>
            </div>
            <div className="pass-fail-item pending">
              <div className="pass-fail-circle">
                <div className="pass-fail-value">{dashboardData.passFailAnalytics.client.pending}</div>
                <div className="pass-fail-label">Pending</div>
              </div>
            </div>
          </div>
          <div className="pass-fail-summary">
            Pass Rate: {calculatePercentage(
              dashboardData.passFailAnalytics.client.pass,
              dashboardData.passFailAnalytics.client.pass + dashboardData.passFailAnalytics.client.fail
            )}%
          </div>
        </div>

        {/* Overall Pass/Fail Analysis */}
        <div className="dashboard-card overall-results">
          <h3>🎯 Overall Evaluation Outcomes</h3>
          <div className="overall-grid">
            <div className="overall-item both-pass">
              <div className="overall-icon">✅</div>
              <div className="overall-value">{dashboardData.passFailAnalytics.overall.bothPass}</div>
              <div className="overall-label">Both Pass</div>
            </div>
            <div className="overall-item internal-pass">
              <div className="overall-icon">⚠️</div>
              <div className="overall-value">{dashboardData.passFailAnalytics.overall.internalPassClientFail}</div>
              <div className="overall-label">Internal Pass<br/>Client Fail</div>
            </div>
            <div className="overall-item client-pass">
              <div className="overall-icon">🔄</div>
              <div className="overall-value">{dashboardData.passFailAnalytics.overall.internalFailClientPass}</div>
              <div className="overall-label">Internal Fail<br/>Client Pass</div>
            </div>
            <div className="overall-item both-fail">
              <div className="overall-icon">❌</div>
              <div className="overall-value">{dashboardData.passFailAnalytics.overall.bothFail}</div>
              <div className="overall-label">Both Fail</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card recent-activity">
          <h3>📝 Recent Activity</h3>
          <div className="activity-list">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-description">{activity.description}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activity">
                <p>No recent activity to display</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceEvaluationDashboard;
