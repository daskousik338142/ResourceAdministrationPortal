import React, { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const ResourceModal = ({ resource, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'equipment',
    description: '',
    availability: true,
    location: '',
    capacity: '',
    specifications: {}
  });
  const [errors, setErrors] = useState({});

  const isEditing = !!resource;

  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name || '',
        type: resource.type || 'equipment',
        description: resource.description || '',
        availability: resource.availability ?? true,
        location: resource.location || '',
        capacity: resource.capacity || '',
        specifications: resource.specifications || {}
      });
    }
  }, [resource]);

  const createMutation = useMutation(
    (data) => api.createResource(data),
    {
      onSuccess: () => {
        toast.success('Resource created successfully');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create resource');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => api.updateResource(id, data),
    {
      onSuccess: () => {
        toast.success('Resource updated successfully');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update resource');
      }
    }
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Resource name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Resource type is required';
    }

    if (formData.capacity && isNaN(formData.capacity)) {
      newErrors.capacity = 'Capacity must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined
    };

    // Remove empty values
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === '' || submitData[key] === undefined) {
        delete submitData[key];
      }
    });

    if (isEditing) {
      updateMutation.mutate({ id: resource._id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Resource' : 'Add New Resource'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Resource Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Enter resource name"
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="type" className="form-label">Type *</label>
              <select
                id="type"
                name="type"
                className={`form-select ${errors.type ? 'error' : ''}`}
                value={formData.type}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="equipment">Equipment</option>
                <option value="room">Room</option>
                <option value="vehicle">Vehicle</option>
                <option value="software">Software</option>
                <option value="other">Other</option>
              </select>
              {errors.type && <div className="form-error">{errors.type}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="location" className="form-label">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Enter location"
              />
            </div>

            <div className="form-group">
              <label htmlFor="capacity" className="form-label">Capacity</label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                className={`form-input ${errors.capacity ? 'error' : ''}`}
                value={formData.capacity}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Enter capacity"
                min="1"
              />
              {errors.capacity && <div className="form-error">{errors.capacity}</div>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Enter resource description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="availability"
                checked={formData.availability}
                onChange={handleChange}
                disabled={isLoading}
              />
              Available for booking
            </label>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (isEditing ? 'Update Resource' : 'Create Resource')}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 0;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0 24px;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .close-btn:hover {
          background-color: #f5f5f5;
        }

        form {
          padding: 0 24px 24px 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #333;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e0e0e0;
        }

        @media (max-width: 768px) {
          .modal-overlay {
            padding: 10px;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ResourceModal;
