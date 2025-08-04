import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ResourceEvaluationPopup from '../components/ResourceEvaluationPopup';
import ResourceEvaluationViewPopup from '../components/ResourceEvaluationViewPopup';
import '../styles/resource-evaluation-history.css';

const ResourceEvaluationHistory = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'completed'
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isViewPopupOpen, setIsViewPopupOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadEvaluations();
  }, []);

  useEffect(() => {
    // Check if we have an evaluateId parameter to auto-open the popup
    const evaluateId = searchParams.get('evaluateId');
    if (evaluateId && evaluations.length > 0) {
      const evaluation = evaluations.find(e => e.id.toString() === evaluateId);
      if (evaluation) {
        setSelectedEvaluation(evaluation);
        setIsPopupOpen(true);
        // Clear the URL parameter after opening popup
        setSearchParams({});
      }
    }
  }, [evaluations, searchParams, setSearchParams]);

  const loadEvaluations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/resource-evaluations');
      const data = await response.json();
      
      if (data.success) {
        setEvaluations(data.data);
      } else {
        console.error('Error loading evaluations:', data.error);
      }
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate aging in days
  const calculateAging = (createdDate) => {
    if (!createdDate) return 0;
    const created = new Date(createdDate);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get aging status color
  const getAgingStatus = (days) => {
    if (days <= 7) return 'aging-fresh';
    if (days <= 14) return 'aging-medium';
    if (days <= 30) return 'aging-old';
    return 'aging-critical';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  // Get status badge
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

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle evaluate button click
  const handleEvaluate = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsPopupOpen(true);
  };

  // Handle view button click
  const handleView = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsViewPopupOpen(true);
  };

  // Handle resume conversion
  const handleConvertResume = async (evaluation, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!evaluation.resume_file) {
      alert('No resume file available for conversion');
      return;
    }
    
    try {
      // Show loading state
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = 'Converting...';
      button.disabled = true;
      
      // Call the conversion API
      const response = await fetch('/api/resource-evaluations/convert-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluationId: evaluation.id,
          resumeFile: evaluation.resume_file
        })
      });
      
      if (response.ok) {
        // Get the converted file as blob
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `Converted_Resume_${evaluation.associate_id}.docx`;
        
        // Extract filename from response headers if available
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Show success message
        alert('Resume converted and downloaded successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Conversion failed');
      }
    } catch (error) {
      console.error('Error converting resume:', error);
      alert('Error converting resume: ' + error.message);
    } finally {
      // Reset button state
      const button = event.target;
      button.textContent = originalText;
      button.disabled = false;
    }
  };

  // Handle download resume
  const handleDownloadResume = (evaluation, event) => {
    event.preventDefault();
    event.stopPropagation();
    
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

  // Handle re-open evaluation
  const handleReOpen = async (evaluation) => {
    const confirmMessage = `Are you sure you want to re-open this evaluation for ${evaluation.associate_name}? 

This will:
• Reset evaluation status to pending
• Make the record editable again
• Move it back to Active Evaluations section
• Preserve all historical data

Continue?`;

    if (window.confirm(confirmMessage)) {
      try {
        const response = await fetch(`/api/resource-evaluations/${evaluation.id}/reopen`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Manual re-open from completed evaluations',
            reopened_by: 'System User', // In a real app, this would be the current user
            reopened_at: new Date().toISOString()
          })
        });

        const data = await response.json();
        
        if (data.success) {
          alert(`Evaluation for ${evaluation.associate_name} has been re-opened successfully! The record has been moved to Active Evaluations.`);
          loadEvaluations(); // Refresh the data
          
          // If we're currently viewing completed evaluations, optionally switch to active
          if (viewMode === 'completed') {
            // Show a message suggesting to switch views
            setTimeout(() => {
              if (window.confirm('Would you like to switch to Active Evaluations to see the re-opened record?')) {
                setViewMode('active');
              }
            }, 1000);
          }
        } else {
          alert('Error re-opening evaluation: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error re-opening evaluation:', error);
        alert('Error re-opening evaluation. Please try again.');
      }
    }
  };

  // Handle popup close
  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedEvaluation(null);
  };

  // Handle evaluation update
  const handleEvaluationUpdate = () => {
    loadEvaluations(); // Refresh the data
  };

  // Check if evaluation is completed
  const isEvaluationCompleted = (evaluation) => {
    const internalStatus = evaluation.internal_evaluation_status;
    const clientStatus = evaluation.client_evaluation_status;
    
    // Completed scenarios:
    // 1. Both internal and client evaluation passed
    // 2. Internal evaluation failed
    // 3. Internal evaluation passed and client evaluation failed
    return (
      (internalStatus === 'pass' && clientStatus === 'pass') ||
      (internalStatus === 'fail') ||
      (internalStatus === 'pass' && clientStatus === 'fail')
    );
  };

  // Sort and filter evaluations
  const sortedAndFilteredEvaluations = React.useMemo(() => {
    let filtered = evaluations.filter(evaluation => {
      // Filter by view mode first
      const isCompleted = isEvaluationCompleted(evaluation);
      const matchesViewMode = viewMode === 'completed' ? isCompleted : !isCompleted;

      const matchesText = filterText === '' || 
        evaluation.associate_name.toLowerCase().includes(filterText.toLowerCase()) ||
        evaluation.associate_id.includes(filterText) ||
        evaluation.email.toLowerCase().includes(filterText.toLowerCase()) ||
        evaluation.client_name.toLowerCase().includes(filterText.toLowerCase());

      const matchesStatus = statusFilter === 'all' || 
        evaluation.internal_evaluation_status === statusFilter ||
        evaluation.client_evaluation_status === statusFilter;

      return matchesViewMode && matchesText && matchesStatus;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'aging') {
          aValue = calculateAging(a.created_date);
          bValue = calculateAging(b.created_date);
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [evaluations, sortConfig, filterText, statusFilter, viewMode]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="sort-icon">⇅</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <span className="sort-icon active">↑</span> : 
      <span className="sort-icon active">↓</span>;
  };

  return (
    <div className="resource-evaluation-history-container">
      <div className="page-header">
        <h1>Resource Evaluation History</h1>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn ${viewMode === 'active' ? 'active' : ''}`}
            onClick={() => setViewMode('active')}
          >
            Active Evaluations
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'completed' ? 'active' : ''}`}
            onClick={() => setViewMode('completed')}
          >
            Completed Evaluations
          </button>
        </div>
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search by name, ID, email, or client..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="status-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="pass">Passed</option>
            <option value="fail">Failed</option>
          </select>
        </div>
        <div className="summary-stats">
          <span className="stat-item">
            Total: <strong>{sortedAndFilteredEvaluations.length}</strong>
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="loading">Loading evaluations...</div>
        ) : evaluations.length === 0 ? (
          <div className="no-data">No resource evaluations found</div>
        ) : (
          <table className="evaluation-history-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('associate_id')} className="sortable">
                  Associate ID {getSortIcon('associate_id')}
                </th>
                <th onClick={() => handleSort('associate_name')} className="sortable">
                  Associate Name {getSortIcon('associate_name')}
                </th>
                <th onClick={() => handleSort('email')} className="sortable">
                  Email {getSortIcon('email')}
                </th>
                <th>Phone</th>
                <th onClick={() => handleSort('client_name')} className="sortable">
                  Client {getSortIcon('client_name')}
                </th>
                <th onClick={() => handleSort('created_date')} className="sortable">
                  Created Date {getSortIcon('created_date')}
                </th>
                <th onClick={() => handleSort('aging')} className="sortable">
                  Aging (Days) {getSortIcon('aging')}
                </th>
                <th>Internal Status</th>
                <th>Client Status</th>
                <th>Resume</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredEvaluations.map((evaluation) => {
                const agingDays = calculateAging(evaluation.created_date);
                return (
                  <tr key={evaluation.id}>
                    <td className="associate-id">{evaluation.associate_id}</td>
                    <td className="associate-name">{evaluation.associate_name}</td>
                    <td className="email">{evaluation.email}</td>
                    <td className="phone">
                      {evaluation.country_code} {evaluation.phone_number}
                    </td>
                    <td className="client-name">{evaluation.client_name}</td>
                    <td className="created-date">{formatDate(evaluation.created_date)}</td>
                    <td className={`aging ${getAgingStatus(agingDays)}`}>
                      <span className="aging-value">{agingDays}</span>
                      <span className="aging-label">days</span>
                    </td>
                    <td className="status-cell">
                      {getStatusBadge(evaluation.internal_evaluation_status)}
                    </td>
                    <td className="status-cell">
                      {getStatusBadge(evaluation.client_evaluation_status)}
                    </td>
                    <td className="resume-cell">
                      {evaluation.resume_file ? (
                        <div className="resume-download-section">
                          <span className="resume-filename">
                            {evaluation.resume_file}
                          </span>
                          <button
                            className="download-arrow-btn"
                            onClick={(e) => handleDownloadResume(evaluation, e)}
                            title={`Download as Resume_${evaluation.associate_id}`}
                          >
                            ⬇
                          </button>
                        </div>
                      ) : (
                        <span className="no-file">No file</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-outline btn-view"
                        onClick={() => handleView(evaluation)}
                        title="View evaluation details"
                      >
                        View
                      </button>
                      {evaluation.resume_file && (
                        <button
                          className="btn btn-outline btn-convert"
                          onClick={(e) => handleConvertResume(evaluation, e)}
                          title="Convert resume to standard format"
                        >
                          Convert
                        </button>
                      )}
                      {viewMode === 'completed' ? (
                        <button
                          className="btn btn-outline btn-reopen"
                          onClick={() => handleReOpen(evaluation)}
                          title="Re-open evaluation"
                        >
                          Re-Open
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline btn-evaluate"
                          onClick={() => handleEvaluate(evaluation)}
                          title="Edit evaluation details"
                        >
                          Evaluate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Aging Legend */}
      <div className="aging-legend">
        <h3>Aging Status Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color aging-fresh"></span>
            <span>0-7 days (Fresh)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color aging-medium"></span>
            <span>8-14 days (Medium)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color aging-old"></span>
            <span>15-30 days (Old)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color aging-critical"></span>
            <span>30+ days (Critical)</span>
          </div>
        </div>
      </div>

      {/* Resource Evaluation Popup */}
      <ResourceEvaluationPopup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        evaluation={selectedEvaluation}
        onUpdate={handleEvaluationUpdate}
      />

      {/* Resource Evaluation View Popup */}
      <ResourceEvaluationViewPopup
        isOpen={isViewPopupOpen}
        onClose={() => setIsViewPopupOpen(false)}
        evaluation={selectedEvaluation}
      />
    </div>
  );
};

export default ResourceEvaluationHistory;
