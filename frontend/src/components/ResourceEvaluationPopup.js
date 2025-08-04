import React, { useState, useEffect } from 'react';
import '../styles/resource-evaluation-popup.css';

const ResourceEvaluationPopup = ({ isOpen, onClose, evaluation, onUpdate }) => {
  const [formData, setFormData] = useState({
    internal_evaluation_status: '',
    internal_evaluation_feedback: '',
    client_evaluation_status: '',
    client_feedback: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('internal');

  useEffect(() => {
    if (evaluation) {
      setFormData({
        internal_evaluation_status: evaluation.internal_evaluation_status || 'pending',
        internal_evaluation_feedback: evaluation.internal_evaluation_feedback || '',
        client_evaluation_status: evaluation.client_evaluation_status || 'pending',
        client_feedback: evaluation.client_feedback || ''
      });
    }
  }, [evaluation]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!evaluation) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/resource-evaluations/${evaluation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          internal_evaluation_status: formData.internal_evaluation_status,
          internal_evaluation_feedback: formData.internal_evaluation_feedback,
          internal_evaluation_date: formData.internal_evaluation_status !== evaluation.internal_evaluation_status ? 
            new Date().toISOString() : evaluation.internal_evaluation_date,
          client_evaluation_status: formData.client_evaluation_status,
          client_feedback: formData.client_feedback,
          client_evaluation_date: formData.client_evaluation_status !== evaluation.client_evaluation_status ? 
            new Date().toISOString() : evaluation.client_evaluation_date
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Evaluation updated successfully!');
        onUpdate(); // Refresh the parent component data
        onClose(); // Close the popup
      } else {
        alert('Error updating evaluation: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating evaluation:', error);
      alert('Error updating evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!isOpen || !evaluation) return null;

  return (
    <div className="evaluation-popup-overlay" onClick={onClose}>
      <div className="evaluation-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <div className="popup-title">
            <h2>Evaluate: {evaluation.associate_name}</h2>
            <div className="popup-subtitle">
              ID: {evaluation.associate_id} | Client: {evaluation.client_name}
            </div>
          </div>
          <button className="popup-close" onClick={onClose}>×</button>
        </div>

        <div className="popup-content">
          {/* Basic Information */}
          <div className="evaluation-info">
            <div className="info-grid">
              <div className="info-item">
                <label>Email:</label>
                <span>{evaluation.email}</span>
              </div>
              <div className="info-item">
                <label>Phone:</label>
                <span>{evaluation.country_code} {evaluation.phone_number}</span>
              </div>
              <div className="info-item">
                <label>Created:</label>
                <span>{formatDate(evaluation.created_date)}</span>
              </div>
              <div className="info-item">
                <label>Resume:</label>
                {evaluation.resume_file ? (
                  <a 
                    href={`/api/uploads/resumes/${evaluation.resume_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resume-link"
                  >
                    📄 View Resume
                  </a>
                ) : (
                  <span>No file</span>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="evaluation-tabs">
            <button 
              className={`tab-button ${activeTab === 'internal' ? 'active' : ''}`}
              onClick={() => setActiveTab('internal')}
            >
              Internal Evaluation
            </button>
            <button 
              className={`tab-button ${activeTab === 'client' ? 'active' : ''} ${formData.internal_evaluation_status !== 'pass' ? 'disabled' : ''}`}
              onClick={() => formData.internal_evaluation_status === 'pass' && setActiveTab('client')}
              disabled={formData.internal_evaluation_status !== 'pass'}
            >
              Client Evaluation
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Internal Evaluation Tab */}
            {activeTab === 'internal' && (
              <div className="tab-content">
                <h3>Internal Evaluation</h3>
                
                <div className="form-group">
                  <label>Status:</label>
                  <select
                    value={formData.internal_evaluation_status}
                    onChange={(e) => handleInputChange('internal_evaluation_status', e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                  <div className="current-status">
                    Current: {getStatusBadge(evaluation.internal_evaluation_status)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Feedback:</label>
                  <textarea
                    value={formData.internal_evaluation_feedback}
                    onChange={(e) => handleInputChange('internal_evaluation_feedback', e.target.value)}
                    className="feedback-textarea"
                    rows="4"
                    placeholder="Enter internal evaluation feedback..."
                  />
                </div>

                {evaluation.internal_evaluation_date && (
                  <div className="evaluation-history">
                    <strong>Last Updated:</strong> {formatDate(evaluation.internal_evaluation_date)}
                  </div>
                )}
              </div>
            )}

            {/* Client Evaluation Tab */}
            {activeTab === 'client' && (
              <div className="tab-content">
                <h3>Client Evaluation</h3>
                
                {formData.internal_evaluation_status !== 'pass' ? (
                  <div className="disabled-notice">
                    <p>Client evaluation is only available after internal evaluation passes.</p>
                    <p>Current internal status: {getStatusBadge(formData.internal_evaluation_status)}</p>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Status:</label>
                      <select
                        value={formData.client_evaluation_status}
                        onChange={(e) => handleInputChange('client_evaluation_status', e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                      <div className="current-status">
                        Current: {getStatusBadge(evaluation.client_evaluation_status)}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Client Feedback:</label>
                      <textarea
                        value={formData.client_feedback}
                        onChange={(e) => handleInputChange('client_feedback', e.target.value)}
                        className="feedback-textarea"
                        rows="4"
                        placeholder="Enter client evaluation feedback..."
                      />
                    </div>

                    {evaluation.client_evaluation_date && (
                      <div className="evaluation-history">
                        <strong>Last Updated:</strong> {formatDate(evaluation.client_evaluation_date)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="popup-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Evaluation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResourceEvaluationPopup;
