import React, { useState, useEffect } from 'react';
import '../styles/resource-evaluation-popup.css';

const ResourceEvaluationViewPopup = ({ isOpen, onClose, evaluation }) => {
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'status-pending',
      'in-progress': 'status-in-progress',
      completed: 'status-completed',
      pass: 'status-completed',
      fail: 'status-rejected',
      rejected: 'status-rejected'
    };
    
    return (
      <span className={`status-badge ${statusColors[status] || 'status-pending'}`}>
        {status}
      </span>
    );
  };

  const handleDownloadResume = () => {
    if (!evaluation.resume_file) return;
    
    // Extract the file extension from the original filename
    const fileExtension = evaluation.resume_file.split('.').pop();
    const downloadName = `Resume_${evaluation.associate_id}.${fileExtension}`;
    
    // Create a temporary anchor element for download
    const link = document.createElement('a');
    link.href = `/api/uploads/resumes/${evaluation.resume_file}`;
    link.download = downloadName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load evaluation history for this associate
  const loadEvaluationHistory = async () => {
    if (!evaluation?.associate_id) return;
    
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/resource-evaluations/history/${evaluation.associate_id}`);
      const data = await response.json();
      
      if (data.success) {
        setEvaluationHistory(data.data.evaluations);
      } else {
        console.error('Error loading evaluation history:', data.error);
      }
    } catch (error) {
      console.error('Error loading evaluation history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && evaluation) {
      loadEvaluationHistory();
    }
  }, [isOpen, evaluation]);

  if (!isOpen || !evaluation) return null;

  return (
    <div className="evaluation-popup-overlay" onClick={onClose}>
      <div className="evaluation-popup view-only" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <h2>Resource Evaluation Details (View Only)</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="popup-content">
          {/* Basic Information */}
          <div className="evaluation-section">
            <h3>Basic Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Associate ID:</label>
                <span>{evaluation.associate_id}</span>
              </div>
              <div className="info-item">
                <label>Associate Name:</label>
                <span>{evaluation.associate_name}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{evaluation.email}</span>
              </div>
              <div className="info-item">
                <label>Phone:</label>
                <span>{evaluation.country_code} {evaluation.phone_number}</span>
              </div>
              <div className="info-item">
                <label>Client Name:</label>
                <span>{evaluation.client_name}</span>
              </div>
              <div className="info-item">
                <label>Created Date:</label>
                <span>{formatDate(evaluation.created_date)}</span>
              </div>
              {evaluation.remarks && (
                <div className="info-item remarks-item">
                  <label>Remarks:</label>
                  <div className="remarks-content">{evaluation.remarks}</div>
                </div>
              )}
            </div>
          </div>

          {/* Resume Section */}
          <div className="evaluation-section">
            <h3>Resume</h3>
            <div className="resume-info">
              {evaluation.resume_file ? (
                <div className="resume-actions">
                  <button
                    className="btn btn-download"
                    onClick={handleDownloadResume}
                    title={`Download as Resume_${evaluation.associate_id}`}
                  >
                    📄 Download Resume
                  </button>
                  <span className="original-filename">
                    Original: {evaluation.resume_file}
                  </span>
                </div>
              ) : (
                <span className="no-file">No resume file uploaded</span>
              )}
            </div>
          </div>

          {/* Internal Evaluation Section */}
          <div className="evaluation-section">
            <h3>Internal Evaluation</h3>
            <div className="evaluation-details">
              <div className="status-row">
                <label>Status:</label>
                {getStatusBadge(evaluation.internal_evaluation_status || 'pending')}
                {evaluation.internal_evaluation_date && (
                  <span className="evaluation-date">
                    Updated: {formatDate(evaluation.internal_evaluation_date)}
                  </span>
                )}
              </div>
              <div className="feedback-row">
                <label>Feedback:</label>
                <div className="feedback-content">
                  {evaluation.internal_evaluation_feedback || 'No feedback provided'}
                </div>
              </div>
            </div>
          </div>

          {/* Client Evaluation Section */}
          <div className="evaluation-section">
            <h3>Client Evaluation</h3>
            <div className="evaluation-details">
              <div className="status-row">
                <label>Status:</label>
                {getStatusBadge(evaluation.client_evaluation_status || 'pending')}
                {evaluation.client_evaluation_date && (
                  <span className="evaluation-date">
                    Updated: {formatDate(evaluation.client_evaluation_date)}
                  </span>
                )}
              </div>
              <div className="feedback-row">
                <label>Feedback:</label>
                <div className="feedback-content">
                  {evaluation.client_feedback || 'No feedback provided'}
                </div>
              </div>
            </div>
          </div>

          {/* Evaluation History Section */}
          {evaluationHistory.length > 1 && (
            <div className="evaluation-section">
              <h3>Evaluation History ({evaluationHistory.length} total evaluations)</h3>
              <div className="history-toggle">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? 'Hide' : 'Show'} Historical Records
                </button>
              </div>
              
              {showHistory && (
                <div className="history-content">
                  {loadingHistory ? (
                    <div className="loading-spinner">Loading history...</div>
                  ) : (
                    <div className="history-list">
                      {evaluationHistory.map((historyItem, index) => (
                        <div key={index} className={`history-item ${historyItem.record_type}`}>
                          <div className="history-header">
                            <div className="history-date">
                              <strong>
                                {historyItem.record_type === 'current' ? 'Current Evaluation' : 'Historical Record'}
                              </strong>
                              <span className="date-text">
                                {formatDate(historyItem.evaluation_date)}
                              </span>
                            </div>
                            {historyItem.record_type === 'historical' && historyItem.reopened_at && (
                              <div className="reopened-info">
                                <small>Re-opened: {formatDate(historyItem.reopened_at)}</small>
                              </div>
                            )}
                          </div>
                          
                          <div className="history-details">
                            <div className="history-client">
                              <label>Client:</label> {historyItem.client_name}
                            </div>
                            <div className="history-status-row">
                              <div className="status-group">
                                <label>Internal:</label>
                                {getStatusBadge(historyItem.internal_evaluation_status || 'pending')}
                              </div>
                              <div className="status-group">
                                <label>Client:</label>
                                {getStatusBadge(historyItem.client_evaluation_status || 'pending')}
                              </div>
                            </div>
                            
                            {(historyItem.internal_evaluation_feedback || historyItem.client_feedback) && (
                              <div className="history-feedback">
                                {historyItem.internal_evaluation_feedback && (
                                  <div className="feedback-item">
                                    <label>Internal Feedback:</label>
                                    <div className="feedback-text">{historyItem.internal_evaluation_feedback}</div>
                                  </div>
                                )}
                                {historyItem.client_feedback && (
                                  <div className="feedback-item">
                                    <label>Client Feedback:</label>
                                    <div className="feedback-text">{historyItem.client_feedback}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="popup-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceEvaluationViewPopup;
