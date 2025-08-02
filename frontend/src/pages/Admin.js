import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/admin.css';

const Admin = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    description: '',
    active: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmails();
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
      const response = await api.updateEmailInList(editingEmail._id, formData);
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
      active: email.active
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingEmail(null);
    setFormData({ email: '', name: '', description: '', active: true });
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
          <h1>Email List Administration</h1>
          <p>Manage email addresses for summary report distribution</p>
        </div>

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

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

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
                <div className="header-cell">Status</div>
                <div className="header-cell">Created</div>
                <div className="header-cell">Actions</div>
              </div>
              {emails.map((email) => (
                <div key={email._id} className="email-row">
                  <div className="email-cell email-address">{email.email}</div>
                  <div className="email-cell name">{email.name || '-'}</div>
                  <div className="email-cell description">{email.description || '-'}</div>
                  <div className="email-cell status">
                    <span className={`status-badge ${email.active ? 'active' : 'inactive'}`}>
                      {email.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="email-cell created">{formatDate(email.createdAt)}</div>
                  <div className="email-cell actions">
                    <button 
                      className="edit-btn"
                      onClick={() => openEditModal(email)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteEmail(email._id, email.email)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
