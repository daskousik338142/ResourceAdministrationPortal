import React, { useState, useEffect } from 'react';

const ResourceEvaluation = () => {
  const [associateName, setAssociateName] = useState('');
  const [associateId, setAssociateId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluationSectionEnabled, setIsEvaluationSectionEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('internal1');
  
  // Error states
  const [errors, setErrors] = useState({});
  
  // Evaluation states
  const [internal1Status, setInternal1Status] = useState(false);
  const [internal1Feedback, setInternal1Feedback] = useState('');
  const [internal1Completed, setInternal1Completed] = useState(false);
  const [internal2Status, setInternal2Status] = useState(false);
  const [internal2Feedback, setInternal2Feedback] = useState('');
  const [internal3Status, setInternal3Status] = useState(false);
  const [internal3Feedback, setInternal3Feedback] = useState('');
  const [clientInterviewStatus, setClientInterviewStatus] = useState(false);
  const [clientInterviewFeedback, setClientInterviewFeedback] = useState('');
  const [clientCodingStatus, setClientCodingStatus] = useState(false);
  const [clientCodingFeedback, setClientCodingFeedback] = useState('');

  // Validation functions
  const validateField = (fieldName, value) => {
    const newErrors = { ...errors };
    
    switch (fieldName) {
      case 'associateName':
        if (!value || !value.trim()) {
          newErrors.associateName = 'Associate name cannot be blank';
        } else if (/[^a-zA-Z\s]/.test(value.trim())) {
          newErrors.associateName = 'Associate name cannot contain special characters or numbers';
        } else {
          delete newErrors.associateName;
        }
        break;
      case 'associateId':
        if (!value || !value.trim()) {
          newErrors.associateId = 'Associate ID cannot be blank';
        } else if (value.trim().length < 6) {
          newErrors.associateId = 'Associate ID must be at least 6 characters';
        } else if (/[^a-zA-Z0-9]/.test(value.trim())) {
          newErrors.associateId = 'Associate ID cannot contain special characters';
        } else {
          delete newErrors.associateId;
        }
        break;
      case 'customerName':
        if (!value || value === '') {
          newErrors.customerName = 'Customer name must be selected';
        } else {
          delete newErrors.customerName;
        }
        break;
      case 'uploadedFile':
        if (!value) {
          newErrors.uploadedFile = 'A file must be uploaded';
        } else {
          delete newErrors.uploadedFile;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAssociateNameChange = (e) => {
    const value = e.target.value;
    setAssociateName(value);
    // Clear error when user starts typing
    if (errors.associateName) {
      const newErrors = { ...errors };
      delete newErrors.associateName;
      setErrors(newErrors);
    }
  };

  const handleAssociateNameBlur = (e) => {
    const value = e.target.value;
    validateField('associateName', value);
  };

  const handleAssociateIdChange = (e) => {
    const value = e.target.value;
    setAssociateId(value);
    // Clear error when user starts typing
    if (errors.associateId) {
      const newErrors = { ...errors };
      delete newErrors.associateId;
      setErrors(newErrors);
    }
  };

  const handleAssociateIdBlur = (e) => {
    const value = e.target.value;
    validateField('associateId', value);
  };

  const handleCustomerNameChange = (e) => {
    const value = e.target.value;
    setCustomerName(value);
    validateField('customerName', value);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      validateField('uploadedFile', file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate all fields
    const isNameValid = validateField('associateName', associateName);
    const isIdValid = validateField('associateId', associateId);
    const isCustomerValid = validateField('customerName', customerName);
    const isFileValid = validateField('uploadedFile', uploadedFile);
    
    if (!isNameValid || !isIdValid || !isCustomerValid || !isFileValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('associateId', associateId);
      formData.append('associateName', associateName);
      formData.append('customerName', customerName);
      if (uploadedFile) {
        formData.append('resume', uploadedFile);
      }

      const response = await fetch('/api/resource-evaluations', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'Resource evaluation record created successfully!');
        
        // Enable the evaluation section after successful submission
        setIsEvaluationSectionEnabled(true);
        
        // Don't reset form - keep the data for evaluation process
      } else {
        const error = await response.json();
        alert('Error creating record: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error creating record: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEvaluationSubmit = async (evaluationType) => {
    try {
      let requestData = {
        evaluationType
      };

      // Build request data based on evaluation type
      switch (evaluationType) {
        case 'internal1':
          // Validate that both status is checked and feedback is provided
          if (!internal1Status || !internal1Feedback.trim()) {
            alert('Please check the status and provide feedback before submitting Internal Evaluation 1');
            return;
          }
          requestData.status = internal1Status;
          requestData.feedback = internal1Feedback;
          break;
        case 'internal2':
          requestData.status = internal2Status;
          requestData.feedback = internal2Feedback;
          break;
        case 'internal3':
          requestData.status = internal3Status;
          requestData.feedback = internal3Feedback;
          break;
        case 'clientInterview':
          requestData.status = clientInterviewStatus;
          requestData.feedback = clientInterviewFeedback;
          break;
        case 'clientCoding':
          requestData.status = clientCodingStatus;
          requestData.feedback = clientCodingFeedback;
          break;
        default:
          console.error('Unknown evaluation type:', evaluationType);
          return;
      }

      const response = await fetch(`/api/resource-evaluations/associate/${associateId}/evaluation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${evaluationType} evaluation submitted successfully!`);
        
        // Mark internal evaluation 1 as completed when it's successfully submitted
        if (evaluationType === 'internal1') {
          setInternal1Completed(true);
        }
      } else {
        const error = await response.json();
        alert('Error updating evaluation: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('Error submitting evaluation: ' + error.message);
    }
  };

  // Effect to ensure active tab is always enabled
  useEffect(() => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (currentTab && !currentTab.enabled) {
      // Switch to the first enabled tab
      const firstEnabledTab = tabs.find(tab => tab.enabled);
      if (firstEnabledTab) {
        setActiveTab(firstEnabledTab.id);
      }
    }
  }, [internal1Completed, activeTab]);

  const tabs = [
    {
      id: 'internal1',
      label: 'Internal Evaluation 1',
      status: internal1Status,
      setStatus: setInternal1Status,
      feedback: internal1Feedback,
      setFeedback: setInternal1Feedback,
      enabled: true
    },
    {
      id: 'internal2',
      label: 'Internal Evaluation 2',
      status: internal2Status,
      setStatus: setInternal2Status,
      feedback: internal2Feedback,
      setFeedback: setInternal2Feedback,
      enabled: true,
      optional: true
    },
    {
      id: 'internal3',
      label: 'Internal Evaluation 3',
      status: internal3Status,
      setStatus: setInternal3Status,
      feedback: internal3Feedback,
      setFeedback: setInternal3Feedback,
      enabled: true,
      optional: true
    },
    {
      id: 'clientInterview',
      label: 'Client Interview',
      status: clientInterviewStatus,
      setStatus: setClientInterviewStatus,
      feedback: clientInterviewFeedback,
      setFeedback: setClientInterviewFeedback,
      enabled: internal1Completed
    },
    {
      id: 'clientCoding',
      label: 'Client Coding Evaluation',
      status: clientCodingStatus,
      setStatus: setClientCodingStatus,
      feedback: clientCodingFeedback,
      setFeedback: setClientCodingFeedback,
      enabled: internal1Completed
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ 
        color: '#2c3e50', 
        marginBottom: '30px', 
        fontSize: '2rem',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        Associate Details
      </h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' 
        }}>
        <div style={{ marginBottom: errors.associateName ? '45px' : '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500',
            color: '#2c3e50'
          }}>
            Associate Name
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={associateName}
              onChange={handleAssociateNameChange}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${errors.associateName ? '#e74c3c' : '#87ceeb'}`,
                borderRadius: '6px',
                fontSize: '16px',
                transition: 'border-color 0.2s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!errors.associateName) {
                  e.target.style.borderColor = '#27ae60';
                }
              }}
              onBlur={(e) => {
                handleAssociateNameBlur(e);
              }}
              placeholder="Enter associate name"
            />
            {errors.associateName && (
              <div style={{ 
                color: '#e74c3c', 
                fontSize: '14px', 
                marginTop: '5px',
                position: 'absolute',
                left: '0',
                right: '0'
              }}>
                {errors.associateName}
              </div>
            )}
          </div>
        </div>
        
        <div style={{ marginBottom: errors.associateId ? '45px' : '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500',
            color: '#2c3e50'
          }}>
            Associate ID
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={associateId}
              onChange={handleAssociateIdChange}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${errors.associateId ? '#e74c3c' : '#87ceeb'}`,
                borderRadius: '6px',
                fontSize: '16px',
                transition: 'border-color 0.2s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!errors.associateId) {
                  e.target.style.borderColor = '#27ae60';
                }
              }}
              onBlur={(e) => {
                handleAssociateIdBlur(e);
              }}
              placeholder="Enter associate ID"
            />
            {errors.associateId && (
              <div style={{ 
                color: '#e74c3c', 
                fontSize: '14px', 
                marginTop: '5px',
                position: 'absolute',
                left: '0',
                right: '0'
              }}>
                {errors.associateId}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: errors.customerName ? '45px' : '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500',
            color: '#2c3e50'
          }}>
            Customer Name
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={customerName}
              onChange={handleCustomerNameChange}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${errors.customerName ? '#e74c3c' : '#87ceeb'}`,
                borderRadius: '6px',
                fontSize: '16px',
                transition: 'border-color 0.2s ease',
                backgroundColor: 'white',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!errors.customerName) {
                  e.target.style.borderColor = '#27ae60';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.customerName ? '#e74c3c' : '#87ceeb';
              }}
            >
            <option value="">Select a customer</option>
            <option value="John Hancock Life Insurance Company- USA">John Hancock Life Insurance Company- USA</option>
            <option value="Manulife Financial">Manulife Financial</option>
            <option value="Manulife Japan">Manulife Japan</option>
            <option value="Manulife (Singapore) Pte Ltd">Manulife (Singapore) Pte Ltd</option>
            <option value="Manulife Hong Kong">Manulife Hong Kong</option>
            <option value="Manulife Financial Asia Limited">Manulife Financial Asia Limited</option>
            <option value="Manulife">Manulife</option>
            <option value="John Hancock Retirement Plan ServicesLLC">John Hancock Retirement Plan ServicesLLC</option>
            <option value="The Manufacturers Life Insurance Company">The Manufacturers Life Insurance Company</option>
          </select>
          {errors.customerName && (
            <div style={{ 
              color: '#e74c3c', 
              fontSize: '14px', 
              marginTop: '5px',
              position: 'absolute',
              left: '0',
              right: '0'
            }}>
              {errors.customerName}
            </div>
          )}
          </div>
        </div>

        <div style={{ marginBottom: errors.uploadedFile ? '45px' : '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500',
            color: '#2c3e50'
          }}>
            Upload Resume
          </label>
          <div style={{ 
            border: `2px dashed ${errors.uploadedFile ? '#e74c3c' : '#87ceeb'}`, 
            borderRadius: '6px', 
            padding: '20px', 
            textAlign: 'center',
            backgroundColor: '#f8f9fa'
          }}>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.docx,.doc"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label 
              htmlFor="file-upload" 
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#3498db',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background-color 0.2s ease'
              }}
            >
              📁 Upload Resume
            </label>
            <p style={{ 
              margin: '10px 0 0 0', 
              color: '#7f8c8d', 
              fontSize: '14px' 
            }}>
              Accepted formats: PDF, PPT, PPTX, DOCX, DOC
            </p>
            {uploadedFile && (
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#e8f5e8', 
                borderRadius: '4px',
                color: '#27ae60'
              }}>
                ✅ File selected: {uploadedFile.name}
              </div>
            )}
          </div>
          {errors.uploadedFile && (
            <div style={{ 
              color: '#e74c3c', 
              fontSize: '14px', 
              marginTop: '8px',
              textAlign: 'left'
            }}>
              {errors.uploadedFile}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            type="submit"
            disabled={isSubmitting || !associateName || !associateId || !uploadedFile || !customerName || Object.keys(errors).length > 0}
            style={{
              padding: '12px 30px',
              backgroundColor: (isSubmitting || !associateName || !associateId || !uploadedFile || !customerName || Object.keys(errors).length > 0) ? '#95a5a6' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: (isSubmitting || !associateName || !associateId || !uploadedFile || !customerName || Object.keys(errors).length > 0) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!isSubmitting && associateName && associateId && uploadedFile && customerName && Object.keys(errors).length === 0) {
                e.target.style.backgroundColor = '#229954';
              }
            }}
            onMouseOut={(e) => {
              if (!isSubmitting && associateName && associateId && uploadedFile && customerName && Object.keys(errors).length === 0) {
                e.target.style.backgroundColor = '#27ae60';
              }
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          {!isEvaluationSectionEnabled && (
            <p style={{ 
              marginTop: '10px', 
              color: '#7f8c8d', 
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              Complete the form above to enable evaluation sections
            </p>
          )}
        </div>
        </div>
      </form>

      {/* Tabbed Evaluation Section */}
      {isEvaluationSectionEnabled && (
        <div style={{ 
          background: 'white', 
          marginTop: '30px',
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <h2 style={{ 
            color: '#2c3e50', 
            margin: '0',
            padding: '20px 30px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e1e8ed',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Evaluation Progress
          </h2>
          
          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #e1e8ed',
            backgroundColor: '#f8f9fa'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => tab.enabled ? setActiveTab(tab.id) : null}
                disabled={!tab.enabled}
                style={{
                  flex: 1,
                  padding: '15px 10px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? '#3498db' : 'transparent',
                  color: activeTab === tab.id ? 'white' : (tab.enabled ? '#2c3e50' : '#bdc3c7'),
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: tab.enabled ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  borderBottom: activeTab === tab.id ? '3px solid #2980b9' : '3px solid transparent',
                  position: 'relative'
                }}
              >
                {tab.label}
                {tab.optional && (
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 'normal',
                    marginLeft: '5px',
                    color: tab.enabled ? '#7f8c8d' : '#bdc3c7'
                  }}>
                    (Optional)
                  </span>
                )}
                {!tab.enabled && (
                  <span style={{ 
                    fontSize: '12px', 
                    display: 'block',
                    fontWeight: 'normal',
                    color: '#e74c3c'
                  }}>
                    Complete Internal Evaluation 1 first
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '30px' }}>
            {tabs.map((tab) => (
              activeTab === tab.id && tab.enabled && (
                <div key={tab.id}>
                  <h3 style={{ 
                    color: '#2c3e50', 
                    marginBottom: '20px',
                    fontSize: '1.2rem',
                    fontWeight: '600'
                  }}>
                    {tab.label}
                    {tab.optional && (
                      <span style={{ 
                        fontSize: '1rem', 
                        fontWeight: 'normal',
                        marginLeft: '10px',
                        color: '#7f8c8d'
                      }}>
                        (Optional)
                      </span>
                    )}
                  </h3>
                  
                  {tab.isProject ? (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontWeight: '500',
                        color: '#2c3e50'
                      }}>
                        Project Evaluated For
                      </label>
                      <input
                        type="text"
                        value={tab.feedback}
                        onChange={(e) => tab.setFeedback(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e1e8ed',
                          borderRadius: '6px',
                          fontSize: '16px',
                          transition: 'border-color 0.2s ease'
                        }}
                        placeholder="Enter project name"
                      />
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '16px',
                          fontWeight: '500',
                          color: '#2c3e50',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={tab.status}
                            onChange={(e) => tab.setStatus(e.target.checked)}
                            style={{
                              marginRight: '10px',
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer'
                            }}
                          />
                          {tab.label} Completed
                        </label>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px', 
                          fontWeight: '500',
                          color: '#2c3e50'
                        }}>
                          Feedback
                        </label>
                        <textarea
                          value={tab.feedback}
                          onChange={(e) => tab.setFeedback(e.target.value)}
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #e1e8ed',
                            borderRadius: '6px',
                            fontSize: '16px',
                            transition: 'border-color 0.2s ease',
                            resize: 'vertical'
                          }}
                          placeholder="Enter feedback..."
                        />
                      </div>
                    </>
                  )}

                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleEvaluationSubmit(tab.id)}
                      style={{
                        padding: '10px 25px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
                    >
                      Submit {tab.label}
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceEvaluation;
