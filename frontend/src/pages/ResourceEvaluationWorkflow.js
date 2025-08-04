import React, { useState, useEffect } from 'react';
import '../styles/resource-evaluation.css';

const ResourceEvaluationWorkflow = () => {
  const [formData, setFormData] = useState({
    associateId: '',
    associateName: '',
    email: '',
    countryCode: '+91',
    phoneNumber: '',
    clientName: '',
    resumeFile: null,
    remarks: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manulife client companies list
  const clientCompanies = [
    'John Hancock Life Insurance Company- USA',
    'Manulife Financial',
    'Manulife Japan',
    'Manulife (Singapore) Pte Ltd',
    'Manulife-Sinochem Life Insurance Co. Ltd',
    'Manulife Hong Kong',
    'Manulife Financial Asia Limited',
    'Manulife',
    'Manulife Insurance Berhad',
    'The Manufacturers Life Ins Co(Phils.)Inc',
    'John Hancock Retirement Plan ServicesLLC',
    'The Manufacturers Life Insurance Company'
  ];

  useEffect(() => {
    // Reset form to blank state on component mount
    resetForm();
  }, []);

  const resetForm = () => {
    setFormData({
      associateId: '',
      associateName: '',
      email: '',
      countryCode: '+91',
      phoneNumber: '',
      clientName: '',
      resumeFile: null,
      remarks: ''
    });
    setErrors({});
    setIsSubmitting(false);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Associate ID validation (6-9 digits)
    if (!formData.associateId.trim()) {
      newErrors.associateId = 'Associate ID is required';
    } else if (!/^\d{6,9}$/.test(formData.associateId.trim())) {
      newErrors.associateId = 'Associate ID must be 6-9 digits only';
    }
    
    // Associate Name validation (no special characters)
    if (!formData.associateName.trim()) {
      newErrors.associateName = 'Associate Name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.associateName.trim())) {
      newErrors.associateName = 'Associate Name cannot contain special characters or numbers';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    }
    
    // Country code validation
    if (!formData.countryCode.trim()) {
      newErrors.countryCode = 'Country code is required';
    } else if (!/^\+\d{1,4}$/.test(formData.countryCode.trim())) {
      newErrors.countryCode = 'Country code must start with + followed by 1-4 digits';
    }
    
    // Client Name validation
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client Name is required';
    }
    
    // File validation (Required)
    if (!formData.resumeFile) {
      newErrors.resumeFile = 'Resume file is required';
    } else {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['.pdf', '.doc', '.docx'];
      const fileName = formData.resumeFile.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
      
      if (!allowedTypes.includes(formData.resumeFile.type) && !allowedExtensions.includes(fileExtension)) {
        newErrors.resumeFile = 'Only PDF, DOC, and DOCX files are allowed';
      }
      
      // Check file size (10MB limit)
      if (formData.resumeFile.size > 10 * 1024 * 1024) {
        newErrors.resumeFile = 'File size must be less than 10MB';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append('associateId', formData.associateId);
      formDataToSend.append('associateName', formData.associateName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('countryCode', formData.countryCode);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('clientName', formData.clientName);
      formDataToSend.append('remarks', formData.remarks);
      
      if (formData.resumeFile) {
        formDataToSend.append('resume', formData.resumeFile);
      }

      const response = await fetch('/api/resource-evaluations', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Resource evaluation created successfully! You can manage evaluations in the Resource Evaluation History page.');
        resetForm(); // Reset form to blank state for next entry
      } else {
        alert('Error creating evaluation: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating evaluation:', error);
      alert('Error creating evaluation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="resource-evaluation-workflow-container">
      <div className="page-header">
        <h1>Resource Evaluation Workflow</h1>
      </div>

      <div className="evaluation-form-container">
        <h2>Create New Resource Evaluation</h2>
        <form onSubmit={handleSubmit} className="evaluation-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="associateId">Associate ID *</label>
              <input
                type="text"
                id="associateId"
                value={formData.associateId}
                onChange={(e) => setFormData({...formData, associateId: e.target.value})}
                className={errors.associateId ? 'error' : ''}
                placeholder="Enter 6-9 digit associate ID"
              />
              {errors.associateId && <span className="error-text">{errors.associateId}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="associateName">Associate Name *</label>
              <input
                type="text"
                id="associateName"
                value={formData.associateName}
                onChange={(e) => setFormData({...formData, associateName: e.target.value})}
                className={errors.associateName ? 'error' : ''}
                placeholder="Enter full name"
              />
              {errors.associateName && <span className="error-text">{errors.associateName}</span>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={errors.email ? 'error' : ''}
                placeholder="example@company.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number *</label>
              <div className="phone-input-container">
                <select
                  id="countryCode"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                  className={`country-code-select ${errors.countryCode ? 'error' : ''}`}
                >
                  <option value="+91">+91 (India)</option>
                  <option value="+1">+1 (USA/Canada)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+61">+61 (Australia)</option>
                  <option value="+65">+65 (Singapore)</option>
                  <option value="+86">+86 (China)</option>
                  <option value="+81">+81 (Japan)</option>
                  <option value="+852">+852 (Hong Kong)</option>
                  <option value="+60">+60 (Malaysia)</option>
                  <option value="+63">+63 (Philippines)</option>
                </select>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className={errors.phoneNumber ? 'error' : ''}
                  placeholder="1234567890"
                  maxLength="10"
                />
              </div>
              {(errors.countryCode || errors.phoneNumber) && (
                <span className="error-text">{errors.countryCode || errors.phoneNumber}</span>
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientName">Client Name *</label>
              <select
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                className={errors.clientName ? 'error' : ''}
              >
                <option value="">Select a client company...</option>
                {clientCompanies.map((company, index) => (
                  <option key={index} value={company}>
                    {company}
                  </option>
                ))}
              </select>
              {errors.clientName && <span className="error-text">{errors.clientName}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="resumeFile">Resume File (PDF, DOC, DOCX only) *</label>
              <input
                type="file"
                id="resumeFile"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFormData({...formData, resumeFile: e.target.files[0]})}
                className={errors.resumeFile ? 'error' : ''}
                required
              />
              <small className="file-help-text">
                Required: PDF, DOC, DOCX (Max size: 10MB)
              </small>
              {errors.resumeFile && <span className="error-text">{errors.resumeFile}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="remarks">Remarks (Optional)</label>
              <textarea
                id="remarks"
                placeholder="Additional information or notes about this evaluation..."
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                rows="4"
                maxLength="1000"
              />
              <small className="help-text">
                Optional: Additional notes or comments (max 1000 characters)
              </small>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Evaluation Record'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Reset Form
            </button>
          </div>
        </form>
        
        <div className="workflow-info">
          <h3>Next Steps</h3>
          <p>After creating an evaluation record:</p>
          <ul>
            <li>Navigate to <strong>Resource Evaluation History</strong> to manage evaluations</li>
            <li>Use the <strong>Active Evaluations</strong> section to conduct evaluations</li>
            <li>View completed evaluations in the <strong>Completed Evaluations</strong> section</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResourceEvaluationWorkflow;