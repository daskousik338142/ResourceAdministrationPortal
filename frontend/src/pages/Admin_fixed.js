import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/admin.css';

const Admin = () => {
  const [emails, setEmails] = useState([]);
  const [distributionLists, setDistributionLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dlLoading, setDlLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDlModal, setShowDlModal] = useState(false);
  const [showEditDlModal, setShowEditDlModal] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null);
  const [editingDl, setEditingDl] = useState(null);
  const [activeTab, setActiveTab] = useState('emails'); // 'emails' or 'distribution-lists'
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    description: '',
    distribution_list: '',
    active: true
  });
  const [dlFormData, setDlFormData] = useState({
    dlName: '',
    selectedEmails: []
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmails();
    fetchDistributionLists();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await api.getEmailList();
      if (response.success) {
        setEmails(response.data);
      } else {
        setError('Failed to fetch email list');
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Error loading email list');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributionLists = async () => {
    try {
      setDlLoading(true);
      const response = await api.getDistributionLists();
      if (response.success) {
        setDistributionLists(response.data);
      } else {
        setError('Failed to fetch distribution lists');
      }
    } catch (err) {
      console.error('Error fetching distribution lists:', err);
      setError('Error loading distribution lists');
    } finally {
      setDlLoading(false);
    }
  };

  const handleAddEmail = async () => {
    if (!formData.email.trim()) {
      alert('Email address is required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.addEmailToList(formData);
      if (response.success) {
        alert('Email added successfully!');
        setShowAddModal(false);
        setFormData({ email: '', name: '', description: '', active: true });
        fetchEmails();
      } else {
        alert('Failed to add email: ' + response.message);
      }
    } catch (err) {
      console.error('Error adding email:', err);
      alert('Failed to add email: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmail = async () => {
    if (!formData.email.trim()) {
      alert('Email address is required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.updateEmailInList(editingEmail.id, formData);
      if (response.success) {
        alert('Email updated successfully!');
        setShowEditModal(false);
        setEditingEmail(null);
        setFormData({ email: '', name: '', description: '', active: true });
        fetchEmails();
      } else {
        alert('Failed to update email: ' + response.message);
      }
    } catch (err) {
      console.error('Error updating email:', err);
      alert('Failed to update email: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmail = async (id, email) => {
    if (window.confirm(`Are you sure you want to delete ${email}?`)) {
      try {
        const response = await api.deleteEmailFromList(id);
        if (response.success) {
          alert('Email deleted successfully!');
          fetchEmails();
        } else {
          alert('Failed to delete email: ' + response.message);
        }
      } catch (err) {
        console.error('Error deleting email:', err);
        alert('Failed to delete email: ' + err.message);
      }
    }
  };

  const openEditModal = (email) => {
    setEditingEmail(email);
    setFormData({
      email: email.email,
      name: email.name || '',
      description: email.description || '',
      distribution_list: email.distribution_list || '',
      active: email.active
    });
    setShowEditModal(true);
  };

  const handleCreateDl = async () => {
    if (!dlFormData.dlName.trim()) {
      alert('Distribution list name is required');
      return;
    }

    if (dlFormData.selectedEmails.length === 0) {
      alert('Please select at least one email');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.createDistributionList({
        dlName: dlFormData.dlName.trim(),
        emailIds: dlFormData.selectedEmails
      });
      
      if (response.success) {
        alert('Distribution list created successfully!');
        setShowDlModal(false);
        setDlFormData({ dlName: '', selectedEmails: [] });
        fetchDistributionLists();
        fetchEmails();
      } else {
        alert('Failed to create distribution list: ' + response.message);
      }
    } catch (err) {
      console.error('Error creating distribution list:', err);
      alert('Failed to create distribution list: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDl = async () => {
    if (!dlFormData.dlName.trim()) {
      alert('Distribution list name is required');
      return;
    }

    if (dlFormData.selectedEmails.length === 0) {
      alert('Please select at least one email');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.updateDistributionList(editingDl.name, {
        newName: dlFormData.dlName.trim(),
        emailIds: dlFormData.selectedEmails
      });
      
      if (response.success) {
        alert('Distribution list updated successfully!');
        setShowEditDlModal(false);
        setEditingDl(null);
        setDlFormData({ dlName: '', selectedEmails: [] });
        fetchDistributionLists();
        fetchEmails();
      } else {
        alert('Failed to update distribution list: ' + response.message);
      }
    } catch (err) {
      console.error('Error updating distribution list:', err);
      alert('Failed to update distribution list: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDl = async (dlName) => {
    if (window.confirm(`Are you sure you want to delete distribution list "${dlName}"? This will remove all email assignments.`)) {
      try {
        const response = await api.deleteDistributionList(dlName);
        if (response.success) {
          alert('Distribution list deleted successfully!');
          fetchDistributionLists();
          fetchEmails();
        } else {
          alert('Failed to delete distribution list: ' + response.message);
        }
      } catch (err) {
        console.error('Error deleting distribution list:', err);
        alert('Failed to delete distribution list: ' + err.message);
      }
    }
  };

  const openEditDlModal = async (dl) => {
    try {
      setEditingDl(dl);
      const response = await api.getDistributionListEmails(dl.name);
      if (response.success) {
        setDlFormData({
          dlName: dl.name,
          selectedEmails: response.data.emails.map(email => email.id)
        });
        setShowEditDlModal(true);
      }
    } catch (err) {
      console.error('Error loading distribution list details:', err);
      alert('Error loading distribution list details');
    }
  };

  const handleEmailSelection = (emailId, isSelected) => {
    setDlFormData(prev => ({
      ...prev,
      selectedEmails: isSelected 
        ? [...prev.selectedEmails, emailId]
        : prev.selectedEmails.filter(id => id !== emailId)
    }));
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDlModal(false);
    setShowEditDlModal(false);
    setEditingEmail(null);
    setEditingDl(null);
    setFormData({ email: '', name: '', description: '', distribution_list: '', active: true });
    setDlFormData({ dlName: '', selectedEmails: [] });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading email list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Email & Distribution List Administration</h1>
          <p>Manage email addresses and distribution lists for summary report distribution</p>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'emails' ? 'active' : ''}`}
            onClick={() => setActiveTab('emails')}
          >
            📧 Email Addresses
          </button>
          <button 
            className={`tab-btn ${activeTab === 'distribution-lists' ? 'active' : ''}`}
            onClick={() => setActiveTab('distribution-lists')}
          >
            📋 Distribution Lists
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Email Tab Content */}
        {activeTab === 'emails' && (
          <div className="tab-content">
            <div className="admin-actions">
              <button 
                className="add-email-btn primary"
                onClick={() => setShowAddModal(true)}
              >
                ➕ Add Email Address
              </button>
              <button 
                className="refresh-btn"
                onClick={fetchEmails}
              >
                🔄 Refresh
              </button>
            </div>

            <div className="emails-section">
              {emails.length === 0 ? (
                <div className="no-emails">
                  <div className="no-emails-icon">📧</div>
                  <h3>No Email Addresses</h3>
                  <p>No email addresses have been added yet. Click "Add Email Address" to get started.</p>
                </div>
              ) : (
                <div className="emails-table">
                  <div className="table-header">
                    <div className="header-cell">Email Address</div>
                    <div className="header-cell">Name</div>
                    <div className="header-cell">Description</div>
                    <div className="header-cell">Distribution List</div>
                    <div className="header-cell">Status</div>
                    <div className="header-cell">Created</div>
                    <div className="header-cell">Actions</div>
                  </div>
                  {emails.map((email) => (
                    <div key={email.id} className="email-row">
                      <div className="email-cell email-address">{email.email}</div>
                      <div className="email-cell name">{email.name || '-'}</div>
                      <div className="email-cell description">{email.description || '-'}</div>
                      <div className="email-cell distribution-list">
                        {email.distribution_list ? (
                          <span className="dl-badge">{email.distribution_list}</span>
                        ) : (
                          <span className="no-dl">-</span>
                        )}
                      </div>
                      <div className="email-cell status">
                        <span className={`status-badge ${email.active ? 'active' : 'inactive'}`}>
                          {email.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="email-cell created">{formatDate(email.created_at)}</div>
                      <div className="email-cell actions">
                        <button 
                          className="edit-btn"
                          onClick={() => openEditModal(email)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteEmail(email.id, email.email)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Distribution Lists Tab Content */}
        {activeTab === 'distribution-lists' && (
          <div className="tab-content">
            <div className="admin-actions">
              <button 
                className="add-dl-btn primary"
                onClick={() => setShowDlModal(true)}
              >
                ➕ Create Distribution List
              </button>
              <button 
                className="refresh-btn"
                onClick={fetchDistributionLists}
                disabled={dlLoading}
              >
                🔄 Refresh
              </button>
            </div>

            <div className="distribution-lists-section">
              {dlLoading ? (
                <div className="loading-message">
                  <div className="spinner"></div>
                  <p>Loading distribution lists...</p>
                </div>
              ) : distributionLists.length === 0 ? (
                <div className="no-dls">
                  <div className="no-dls-icon">📋</div>
                  <h3>No Distribution Lists</h3>
                  <p>No distribution lists have been created yet. Click "Create Distribution List" to get started.</p>
                </div>
              ) : (
                <div className="dls-table">
                  <div className="table-header">
                    <div className="header-cell">Distribution List</div>
                    <div className="header-cell">Email Count</div>
                    <div className="header-cell">Created</div>
                    <div className="header-cell">Actions</div>
                  </div>
                  {distributionLists.map((dl) => (
                    <div key={dl.name} className="dl-row">
                      <div className="dl-cell dl-name">
                        <span className="dl-badge">{dl.name}</span>
                      </div>
                      <div className="dl-cell email-count">
                        <span className="count-badge">{dl.email_count || 0} emails</span>
                      </div>
                      <div className="dl-cell created">{formatDate(dl.created_at)}</div>
                      <div className="dl-cell actions">
                        <button 
                          className="edit-btn"
                          onClick={() => openEditDlModal(dl)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteDl(dl.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Distribution List Modal */}
        {showDlModal && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create Distribution List</h2>
                <button className="close-modal" onClick={closeModals}>✖</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Distribution List Name *</label>
                  <input
                    type="text"
                    value={dlFormData.dlName}
                    onChange={(e) => setDlFormData({...dlFormData, dlName: e.target.value})}
                    placeholder="e.g., Management Team, HR Department"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Select Email Addresses *</label>
                  <div className="email-selection">
                    {emails.length === 0 ? (
                      <p className="no-emails-available">No email addresses available. Please add some email addresses first.</p>
                    ) : (
                      <div className="email-checkboxes">
                        {emails.map((email) => (
                          <label key={email.id} className="email-checkbox">
                            <input
                              type="checkbox"
                              checked={dlFormData.selectedEmails.includes(email.id)}
                              onChange={(e) => handleEmailSelection(email.id, e.target.checked)}
                            />
                            <span className="email-info">
                              <span className="email-address">{email.email}</span>
                              {email.name && <span className="email-name">({email.name})</span>}
                              {!email.active && <span className="inactive-indicator">(Inactive)</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {dlFormData.selectedEmails.length > 0 && (
                  <div className="selected-count">
                    {dlFormData.selectedEmails.length} email(s) selected
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={closeModals}
                >
                  Cancel
                </button>
                <button 
                  className="save-btn"
                  onClick={handleCreateDl}
                  disabled={submitting || emails.length === 0}
                >
                  {submitting ? 'Creating...' : 'Create Distribution List'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Distribution List Modal */}
        {showEditDlModal && editingDl && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Distribution List</h2>
                <button className="close-modal" onClick={closeModals}>✖</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Distribution List Name *</label>
                  <input
                    type="text"
                    value={dlFormData.dlName}
                    onChange={(e) => setDlFormData({...dlFormData, dlName: e.target.value})}
                    placeholder="e.g., Management Team, HR Department"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Select Email Addresses *</label>
                  <div className="email-selection">
                    {emails.length === 0 ? (
                      <p className="no-emails-available">No email addresses available. Please add some email addresses first.</p>
                    ) : (
                      <div className="email-checkboxes">
                        {emails.map((email) => (
                          <label key={email.id} className="email-checkbox">
                            <input
                              type="checkbox"
                              checked={dlFormData.selectedEmails.includes(email.id)}
                              onChange={(e) => handleEmailSelection(email.id, e.target.checked)}
                            />
                            <span className="email-info">
                              <span className="email-address">{email.email}</span>
                              {email.name && <span className="email-name">({email.name})</span>}
                              {!email.active && <span className="inactive-indicator">(Inactive)</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {dlFormData.selectedEmails.length > 0 && (
                  <div className="selected-count">
                    {dlFormData.selectedEmails.length} email(s) selected
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={closeModals}
                >
                  Cancel
                </button>
                <button 
                  className="save-btn"
                  onClick={handleEditDl}
                  disabled={submitting || emails.length === 0}
                >
                  {submitting ? 'Updating...' : 'Update Distribution List'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Email Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Email Address</h2>
                <button className="close-modal" onClick={closeModals}>✖</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Display name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optional description"
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    />
                    Active (will receive summary emails)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={closeModals}
                >
                  Cancel
                </button>
                <button 
                  className="save-btn"
                  onClick={handleAddEmail}
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Email Modal */}
        {showEditModal && editingEmail && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Email Address</h2>
                <button className="close-modal" onClick={closeModals}>✖</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Display name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optional description"
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    />
                    Active (will receive summary emails)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={closeModals}
                >
                  Cancel
                </button>
                <button 
                  className="save-btn"
                  onClick={handleEditEmail}
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update Email'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
