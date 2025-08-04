const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../config/database');
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/resumes');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
// File filter to only accept specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
// Get all resource evaluations
router.get('/', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const evaluations = db.all(`
      SELECT * FROM resource_evaluations 
      ORDER BY created_date DESC
    `);
    
    res.json({
      success: true,
      data: evaluations,
      count: evaluations.length
    });
  } catch (error) {
    console.error('Error fetching resource evaluations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch resource evaluations',
      message: error.message 
    });
  }
});
// Get resource evaluation database schema
router.get('/schema', (req, res) => {
  const schema = {
    description: 'Resource Evaluation Database Schema',
    fields: {
      // Basic Info
      associateId: { 
        type: 'string', 
        required: true, 
        description: 'Unique identifier for the associate (6-9 digits)',
        validation: {
          pattern: '^\\d{6,9}$',
          minLength: 6,
          maxLength: 9,
          message: 'Must be between 6 and 9 digits'
        }
      },
      associateName: { 
        type: 'string', 
        required: true, 
        description: 'Full name of the associate (letters and spaces only)',
        validation: {
          pattern: '^[a-zA-Z\\s]+$',
          minLength: 2,
          message: 'Name can only contain letters and spaces, minimum 2 characters'
        }
      },
      email: {
        type: 'string',
        required: true,
        description: 'Email address of the associate',
        validation: {
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          message: 'Must be a valid email address format'
        }
      },
      countryCode: {
        type: 'string',
        required: false,
        description: 'Country code for phone number (default: +91)',
        validation: {
          pattern: '^\\+\\d{1,4}$',
          default: '+91',
          message: 'Must be a valid country code format (+1 to +9999)'
        }
      },
      phoneNumber: {
        type: 'string',
        required: true,
        description: 'Phone number (10 digits for +91, 7-15 digits for others)',
        validation: {
          pattern: '^\\d{7,15}$',
          message: 'Must be 7-15 digits (10 digits required for +91 India)'
        }
      },
      customerName: { type: 'string', required: true, description: 'Client/Customer name for the project' },
      resume: { 
        type: 'object', 
        required: true, 
        description: 'File information for uploaded resume (PDF, DOC, DOCX only)',
        validation: {
          allowedTypes: ['.pdf', '.doc', '.docx'],
          maxSize: '10MB',
          message: 'Only PDF, DOC, and DOCX files allowed, maximum 10MB'
        },
        properties: {
          filename: 'string',
          originalName: 'string', 
          path: 'string',
          size: 'number',
          uploadedAt: 'ISO date string'
        }
      },
      createdAt: { type: 'ISO date string', required: true, description: 'Record creation date' },
      updatedAt: { type: 'ISO date string', required: true, description: 'Last update date' },
      // Internal Evaluation 1
      internalEvaluation1Status: { type: 'boolean', required: false, description: 'Pass/Fail status for internal evaluation 1' },
      internalEvaluation1Feedback: { type: 'string', required: false, description: 'Feedback comments for internal evaluation 1' },
      // Internal Evaluation 2 (Optional)
      internalEvaluation2Status: { type: 'boolean', required: false, description: 'Pass/Fail status for internal evaluation 2' },
      internalEvaluation2Feedback: { type: 'string', required: false, description: 'Feedback comments for internal evaluation 2' },
      // Internal Evaluation 3 (Optional)
      internalEvaluation3Status: { type: 'boolean', required: false, description: 'Pass/Fail status for internal evaluation 3' },
      internalEvaluation3Feedback: { type: 'string', required: false, description: 'Feedback comments for internal evaluation 3' },
      // Client Interview
      clientInterviewStatus: { type: 'boolean', required: false, description: 'Pass/Fail status for client interview' },
      clientInterviewFeedback: { type: 'string', required: false, description: 'Client feedback from interview' },
      // Client Coding Assignment
      clientCodingEvaluationStatus: { type: 'boolean', required: false, description: 'Pass/Fail status for client coding assignment' },
      clientCodingEvaluationFeedback: { type: 'string', required: false, description: 'Client feedback on coding assignment' },
      // Overall Status
      status: { 
        type: 'string', 
        required: true, 
        description: 'Overall evaluation status',
        allowedValues: ['pending', 'in-progress', 'completed', 'rejected']
      }
    },
    validationRules: {
      associateId: 'Must be unique, 6-9 digits only',
      associateName: 'Letters and spaces only, no special characters',
      email: 'Must be unique, valid email format',
      phoneNumber: '10 digits for India (+91), 7-15 digits for other countries',
      resume: 'PDF, DOC, or DOCX files only, maximum 10MB'
    },
    workflow: {
      1: 'Create initial record with associateId, associateName, email, phone, resume upload',
      2: 'Complete Internal Evaluation 1 (enables Client tabs)',
      3: 'Optionally complete Internal Evaluations 2 & 3',
      4: 'Complete Client Interview',
      5: 'Complete Client Coding Assignment',
      6: 'Final status determination'
    }
  };
  res.json(schema);
});
// Get resource evaluation by ID
router.get('/:id', async (req, res) => {
  try {
    const evaluation = await new Promise((resolve, reject) => {
      db.getResourceEvaluationsDB().findOne({ _id: req.params.id }, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
    if (!evaluation) {
      return res.status(404).json({ error: 'Resource evaluation not found' });
    }
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resource evaluation' });
  }
});
// Get evaluations by resource ID
router.get('/resource/:resourceId', async (req, res) => {
  try {
    const evaluations = await new Promise((resolve, reject) => {
      db.getResourceEvaluationsDB().find({ resourceId: req.params.resourceId }, (err, docs) => {
        if (err) reject(err);
        else resolve(docs);
      });
    });
    // Sort by evaluation date (most recent first)
    evaluations.sort((a, b) => new Date(b.evaluationDate) - new Date(a.evaluationDate));
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resource evaluations' });
  }
});
// Get evaluation statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const evaluations = await new Promise((resolve, reject) => {
      db.getResourceEvaluationsDB().find({}, (err, docs) => {
        if (err) reject(err);
        else resolve(docs);
      });
    });
    const stats = {
      totalEvaluations: evaluations.length,
      pendingEvaluations: evaluations.filter(e => e.status === 'pending').length,
      completedEvaluations: evaluations.filter(e => e.status === 'completed').length,
      overdueEvaluations: evaluations.filter(e => e.status === 'overdue').length,
      inProgressEvaluations: evaluations.filter(e => e.status === 'in-progress').length
    };
    // Calculate average scores by category
    const completedEvals = evaluations.filter(e => e.status === 'completed' && e.scores);
    if (completedEvals.length > 0) {
      const avgScores = {
        technical: 0,
        communication: 0,
        teamwork: 0,
        leadership: 0,
        overall: 0
      };
      completedEvals.forEach(eval => {
        if (eval.scores) {
          avgScores.technical += eval.scores.technical || 0;
          avgScores.communication += eval.scores.communication || 0;
          avgScores.teamwork += eval.scores.teamwork || 0;
          avgScores.leadership += eval.scores.leadership || 0;
          avgScores.overall += eval.scores.overall || 0;
        }
      });
      Object.keys(avgScores).forEach(key => {
        avgScores[key] = Math.round((avgScores[key] / completedEvals.length) * 100) / 100;
      });
      stats.averageScores = avgScores;
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch evaluation statistics' });
  }
});

// Dashboard analytics endpoint
router.get('/dashboard/analytics', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    // Get all evaluations
    const evaluations = db.all(`
      SELECT * FROM resource_evaluations 
      ORDER BY created_date DESC
    `);
    
    const now = new Date();
    const totalEvaluations = evaluations.length;
    
    // Calculate active evaluations (where at least one status is pending or inprogress, but exclude if internal is fail)
    const activeEvaluations = evaluations.filter(e => 
      e.internal_evaluation_status !== 'fail' && (
        e.internal_evaluation_status === 'pending' || 
        e.internal_evaluation_status === 'inprogress' ||
        e.client_evaluation_status === 'pending' || 
        e.client_evaluation_status === 'inprogress'
      )
    );
    
    // Calculate completed evaluations (both internal and client complete)
    const completedEvaluations = evaluations.filter(e => 
      (e.internal_evaluation_status === 'pass' || e.internal_evaluation_status === 'fail') &&
      (e.client_evaluation_status === 'pass' || e.client_evaluation_status === 'fail')
    );
    
    // Aging analytics for active evaluations
    const agingAnalytics = {
      under7Days: 0,
      between7And14Days: 0,
      between15And30Days: 0,
      over30Days: 0
    };
    
    activeEvaluations.forEach(evaluation => {
      const createdDate = new Date(evaluation.created_date);
      const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) {
        agingAnalytics.under7Days++;
      } else if (daysDiff <= 14) {
        agingAnalytics.between7And14Days++;
      } else if (daysDiff <= 30) {
        agingAnalytics.between15And30Days++;
      } else {
        agingAnalytics.over30Days++;
      }
    });
    
    // Completion status analytics
    const completionStatus = {
      bothComplete: 0,
      internalOnly: 0,
      clientOnly: 0,
      neitherComplete: 0
    };
    
    evaluations.forEach(evaluation => {
      const internalComplete = (evaluation.internal_evaluation_status === 'pass' || evaluation.internal_evaluation_status === 'fail');
      const clientComplete = (evaluation.client_evaluation_status === 'pass' || evaluation.client_evaluation_status === 'fail');
      
      if (internalComplete && clientComplete) {
        completionStatus.bothComplete++;
      } else if (internalComplete && !clientComplete) {
        completionStatus.internalOnly++;
      } else if (!internalComplete && clientComplete) {
        completionStatus.clientOnly++;
      } else {
        completionStatus.neitherComplete++;
      }
    });
    
    // Pass/Fail analytics
    const passFailAnalytics = {
      internal: {
        pass: evaluations.filter(e => e.internal_evaluation_status === 'pass').length,
        fail: evaluations.filter(e => e.internal_evaluation_status === 'fail').length,
        pending: evaluations.filter(e => e.internal_evaluation_status !== 'pass' && e.internal_evaluation_status !== 'fail').length
      },
      client: {
        pass: evaluations.filter(e => e.client_evaluation_status === 'pass').length,
        fail: evaluations.filter(e => e.client_evaluation_status === 'fail').length,
        pending: evaluations.filter(e => e.client_evaluation_status !== 'pass' && e.client_evaluation_status !== 'fail').length
      },
      overall: {
        bothPass: evaluations.filter(e => e.internal_evaluation_status === 'pass' && e.client_evaluation_status === 'pass').length,
        internalPassClientFail: evaluations.filter(e => e.internal_evaluation_status === 'pass' && e.client_evaluation_status === 'fail').length,
        internalFailClientPass: evaluations.filter(e => e.internal_evaluation_status === 'fail' && e.client_evaluation_status === 'pass').length,
        bothFail: evaluations.filter(e => e.internal_evaluation_status === 'fail' && e.client_evaluation_status === 'fail').length,
        pending: evaluations.filter(e => 
          (e.internal_evaluation_status !== 'pass' && e.internal_evaluation_status !== 'fail') ||
          (e.client_evaluation_status !== 'pass' && e.client_evaluation_status !== 'fail')
        ).length
      }
    };
    
    // Recent activity (last 10 activities)
    const recentActivity = evaluations
      .slice(0, 10)
      .map(evaluation => {
        const createdDate = new Date(evaluation.created_date);
        const timeAgo = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        
        let activity = {
          icon: '📝',
          title: `New Evaluation Created`,
          description: `Associate ${evaluation.associate_name} (${evaluation.associate_id})`,
          time: timeAgo === 0 ? 'Today' : `${timeAgo} days ago`
        };
        
        // Determine activity type based on most recent status
        if (evaluation.internal_evaluation_status === 'pass' || evaluation.internal_evaluation_status === 'fail') {
          activity.icon = '🏢';
          activity.title = 'Internal Evaluation Completed';
          activity.description = `${evaluation.associate_name} - ${evaluation.internal_evaluation_status.toUpperCase()}`;
        }
        
        if (evaluation.client_evaluation_status === 'pass' || evaluation.client_evaluation_status === 'fail') {
          activity.icon = '🤝';
          activity.title = 'Client Evaluation Completed';
          activity.description = `${evaluation.associate_name} - ${evaluation.client_evaluation_status.toUpperCase()}`;
        }
        
        return activity;
      });
    
    const dashboardData = {
      totalEvaluations,
      activeEvaluations: activeEvaluations.length,
      completedEvaluations: completedEvaluations.length,
      agingAnalytics,
      completionStatus,
      passFailAnalytics,
      recentActivity
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard analytics',
      message: error.message 
    });
  }
});

// Create a new resource evaluation
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const {
      associateId,
      associateName,
      email,
      countryCode = '+91',
      phoneNumber,
      clientName,
      remarks
    } = req.body;
    
    // Validation Helper Functions
    const validateAssociateId = (id) => {
      if (!id) return 'Associate ID is required';
      const cleanId = id.toString().trim();
      if (!/^\d{6,9}$/.test(cleanId)) {
        return 'Associate ID must be between 6 and 9 digits';
      }
      return null;
    };
    
    const validateName = (name) => {
      if (!name) return 'Associate name is required';
      const cleanName = name.toString().trim();
      if (!/^[a-zA-Z\s]+$/.test(cleanName)) {
        return 'Name can only contain letters and spaces';
      }
      if (cleanName.length < 2) {
        return 'Name must be at least 2 characters long';
      }
      return null;
    };
    
    const validateEmail = (email) => {
      if (!email) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.toString().trim())) {
        return 'Please enter a valid email address';
      }
      return null;
    };
    
    const validatePhone = (countryCode, phoneNumber) => {
      if (!phoneNumber) return 'Phone number is required';
      const cleanPhone = phoneNumber.toString().trim();
      const cleanCountryCode = countryCode ? countryCode.toString().trim() : '+91';
      
      // Validate country code format
      if (!/^\+\d{1,4}$/.test(cleanCountryCode)) {
        return 'Invalid country code format';
      }
      
      // For +91 (India), validate 10 digits
      if (cleanCountryCode === '+91') {
        if (!/^\d{10}$/.test(cleanPhone)) {
          return 'Phone number must be exactly 10 digits for India (+91)';
        }
      } else {
        // For other countries, validate 7-15 digits
        if (!/^\d{7,15}$/.test(cleanPhone)) {
          return 'Phone number must be between 7 and 15 digits';
        }
      }
      return null;
    };
    
    // Validate all fields
    const validationErrors = [];
    
    const associateIdError = validateAssociateId(associateId);
    if (associateIdError) validationErrors.push(associateIdError);
    
    const nameError = validateName(associateName);
    if (nameError) validationErrors.push(nameError);
    
    const emailError = validateEmail(email);
    if (emailError) validationErrors.push(emailError);
    
    const phoneError = validatePhone(countryCode, phoneNumber);
    if (phoneError) validationErrors.push(phoneError);
    
    if (!clientName) {
      validationErrors.push('Client name is required');
    }
    
    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Handle file upload
    const resumeFile = req.file ? req.file.filename : null;
    
    // Insert new resource evaluation (removed unique constraints to allow duplicates)
    const result = db.run(`
      INSERT INTO resource_evaluations (
        associate_id, associate_name, email, country_code, phone_number, client_name, resume_file, remarks,
        internal_evaluation_status, client_evaluation_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
    `, [
      associateId.toString().trim(),
      associateName.toString().trim(),
      email.toString().trim().toLowerCase(),
      countryCode || '+91',
      phoneNumber.toString().trim(),
      clientName,
      resumeFile,
      remarks || null
    ]);
    
    // Get the inserted record
    const newEvaluation = db.get(`
      SELECT * FROM resource_evaluations 
      WHERE id = ?
    `, [result.lastInsertRowid]);
    
    res.status(201).json({
      success: true,
      message: 'Resource evaluation created successfully',
      data: newEvaluation
    });
  } catch (error) {
    console.error('Error creating resource evaluation:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create resource evaluation',
      message: error.message 
    });
  }
});
// Update a resource evaluation
router.put('/:id', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const { id } = req.params;
    const updateData = req.body;
    
    // Validation Helper Functions (same as POST route)
    const validateAssociateId = (id) => {
      if (!id) return null; // Not required for updates
      const cleanId = id.toString().trim();
      if (!/^\d{6,9}$/.test(cleanId)) {
        return 'Associate ID must be between 6 and 9 digits';
      }
      return null;
    };
    
    const validateName = (name) => {
      if (!name) return null; // Not required for updates
      const cleanName = name.toString().trim();
      if (!/^[a-zA-Z\s]+$/.test(cleanName)) {
        return 'Name can only contain letters and spaces';
      }
      if (cleanName.length < 2) {
        return 'Name must be at least 2 characters long';
      }
      return null;
    };
    
    const validateEmail = (email) => {
      if (!email) return null; // Not required for updates
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.toString().trim())) {
        return 'Please enter a valid email address';
      }
      return null;
    };
    
    const validatePhone = (phoneNumber) => {
      if (!phoneNumber) return null; // Not required for updates
      const cleanPhone = phoneNumber.toString().trim();
      
      // Basic phone validation for updates (7-15 digits)
      if (!/^\d{7,15}$/.test(cleanPhone)) {
        return 'Phone number must be between 7 and 15 digits';
      }
      return null;
    };
    
    // Validate fields if they are being updated
    const validationErrors = [];
    
    if (updateData.associate_id !== undefined) {
      const associateIdError = validateAssociateId(updateData.associate_id);
      if (associateIdError) validationErrors.push(associateIdError);
    }
    
    if (updateData.associate_name !== undefined) {
      const nameError = validateName(updateData.associate_name);
      if (nameError) validationErrors.push(nameError);
    }
    
    if (updateData.email !== undefined) {
      const emailError = validateEmail(updateData.email);
      if (emailError) validationErrors.push(emailError);
    }
    
    if (updateData.phone_number !== undefined) {
      const phoneError = validatePhone(updateData.phone_number);
      if (phoneError) validationErrors.push(phoneError);
    }
    
    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    // Build dynamic update query based on provided fields
    const allowedFields = [
      'associate_id', 'associate_name', 'email', 'country_code', 'phone_number', 'client_name',
      'internal_evaluation_status', 'internal_evaluation_date', 'internal_evaluation_feedback',
      'client_evaluation_status', 'client_evaluation_date', 'client_feedback'
    ];
    
    const updates = [];
    const values = [];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        // Clean and format the data
        if (field === 'email' && updateData[field]) {
          values.push(updateData[field].toString().trim().toLowerCase());
        } else if (field === 'associate_name' && updateData[field]) {
          values.push(updateData[field].toString().trim());
        } else if (field === 'phone_number' && updateData[field]) {
          values.push(updateData[field].toString().trim());
        } else {
          values.push(updateData[field]);
        }
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    // Add updated_at timestamp
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    // Execute update
    const result = db.run(`
      UPDATE resource_evaluations 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resource evaluation not found'
      });
    }
    
    // Get updated record
    const updatedEvaluation = db.get(`
      SELECT * FROM resource_evaluations 
      WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      message: 'Resource evaluation updated successfully',
      data: updatedEvaluation
    });
  } catch (error) {
    console.error('Error updating resource evaluation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update resource evaluation',
      message: error.message
    });
  }
});

// Delete a resource evaluation
router.delete('/:id', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const { id } = req.params;
    
    const result = db.run(`
      DELETE FROM resource_evaluations 
      WHERE id = ?
    `, [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resource evaluation not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Resource evaluation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resource evaluation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete resource evaluation',
      message: error.message
    });
  }
});
// Get evaluations by status
router.get('/status/:status', async (req, res) => {
  try {
    const status = req.params.status;
    const validStatuses = ['pending', 'in-progress', 'completed', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Valid statuses: ' + validStatuses.join(', ') });
    }
    const evaluations = await new Promise((resolve, reject) => {
      db.getResourceEvaluationsDB().find({ status }, (err, docs) => {
        if (err) reject(err);
        else resolve(docs);
      });
    });
    // Sort by evaluation date (most recent first)
    evaluations.sort((a, b) => new Date(b.evaluationDate) - new Date(a.evaluationDate));
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch evaluations by status' });
  }
});
// Update evaluation status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'in-progress', 'completed', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Valid statuses: ' + validStatuses.join(', ') });
    }
    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };
    // If marking as completed, set completion date
    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }
    const evaluation = await new Promise((resolve, reject) => {
      db.getResourceEvaluationsDB().update(
        { _id: req.params.id },
        { $set: updateData },
        { returnUpdatedDocs: true },
        (err, numReplaced, doc) => {
          if (err) reject(err);
          else resolve(doc);
        }
      );
    });
    if (!evaluation) {
      return res.status(404).json({ error: 'Resource evaluation not found' });
    }
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update evaluation status' });
  }
});
// Bulk operations
router.post('/bulk/create', async (req, res) => {
  try {
    const { evaluations } = req.body;
    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({ error: 'Evaluations array is required and must not be empty' });
    }
    const createdEvaluations = [];
    for (const evalData of evaluations) {
      const newEvaluation = {
        ...evalData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: evalData.status || 'pending'
      };
      const evaluation = await new Promise((resolve, reject) => {
        db.getResourceEvaluationsDB().insert(newEvaluation, (err, doc) => {
          if (err) reject(err);
          else resolve(doc);
        });
      });
      createdEvaluations.push(evaluation);
    }
    res.status(201).json({
      message: `${createdEvaluations.length} evaluations created successfully`,
      evaluations: createdEvaluations
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create bulk evaluations' });
  }
});
// Update evaluation fields by associate ID
router.patch('/associate/:associateId/evaluation', async (req, res) => {
  try {
    const { associateId } = req.params;
    const {
      evaluationType, // 'internal1', 'internal2', 'internal3', 'clientInterview', 'clientCoding'
      status,
      feedback,
      projectName
    } = req.body;
    if (!evaluationType) {
      return res.status(400).json({ error: 'Evaluation type is required' });
    }
    // Build update object based on evaluation type
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    switch (evaluationType) {
      case 'internal1':
        if (status !== undefined) updateData.internalEvaluation1Status = status;
        if (feedback !== undefined) updateData.internalEvaluation1Feedback = feedback;
        break;
      case 'internal2':
        if (status !== undefined) updateData.internalEvaluation2Status = status;
        if (feedback !== undefined) updateData.internalEvaluation2Feedback = feedback;
        break;
      case 'internal3':
        if (status !== undefined) updateData.internalEvaluation3Status = status;
        if (feedback !== undefined) updateData.internalEvaluation3Feedback = feedback;
        break;
      case 'project':
        if (projectName !== undefined) updateData.customerName = projectName;
        break;
      case 'clientInterview':
        if (status !== undefined) updateData.clientInterviewStatus = status;
        if (feedback !== undefined) updateData.clientInterviewFeedback = feedback;
        break;
      case 'clientCoding':
        if (status !== undefined) updateData.clientCodingEvaluationStatus = status;
        if (feedback !== undefined) updateData.clientCodingEvaluationFeedback = feedback;
        break;
      default:
        return res.status(400).json({ error: 'Invalid evaluation type' });
    }
    const evaluation = await new Promise((resolve, reject) => {
      db.getResourceEvaluationsDB().update(
        { associateId: associateId },
        { $set: updateData },
        { returnUpdatedDocs: true },
        (err, numReplaced, doc) => {
          if (err) reject(err);
          else resolve(doc);
        }
      );
    });
    if (!evaluation) {
      return res.status(404).json({ error: 'Resource evaluation not found for this associate' });
    }
    res.json({
      message: `${evaluationType} evaluation updated successfully`,
      evaluation
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update evaluation' });
  }
});
// Re-open a completed evaluation (move back to active)
router.put('/:id/reopen', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const { id } = req.params;
    const { reason, reopened_by } = req.body;
    
    // First, get the current evaluation record
    const currentEvaluation = db.get(`
      SELECT * FROM resource_evaluations 
      WHERE id = ?
    `, [id]);
    
    if (!currentEvaluation) {
      return res.status(404).json({
        success: false,
        error: 'Resource evaluation not found'
      });
    }
    
    // Check if the evaluation is actually completed
    const isCompleted = (
      (currentEvaluation.internal_evaluation_status === 'pass' && currentEvaluation.client_evaluation_status === 'pass') ||
      (currentEvaluation.internal_evaluation_status === 'fail') ||
      (currentEvaluation.internal_evaluation_status === 'pass' && currentEvaluation.client_evaluation_status === 'fail')
    );
    
    if (!isCompleted) {
      return res.status(400).json({
        success: false,
        error: 'This evaluation is not in a completed state and cannot be re-opened'
      });
    }
    
    // Create a historical backup of the current state before re-opening
    const historyData = {
      original_evaluation_id: currentEvaluation.id,
      associate_id: currentEvaluation.associate_id,
      associate_name: currentEvaluation.associate_name,
      email: currentEvaluation.email,
      country_code: currentEvaluation.country_code,
      phone_number: currentEvaluation.phone_number,
      client_name: currentEvaluation.client_name,
      resume_file: currentEvaluation.resume_file,
      internal_evaluation_status: currentEvaluation.internal_evaluation_status,
      internal_evaluation_date: currentEvaluation.internal_evaluation_date,
      internal_evaluation_feedback: currentEvaluation.internal_evaluation_feedback,
      client_evaluation_status: currentEvaluation.client_evaluation_status,
      client_evaluation_date: currentEvaluation.client_evaluation_date,
      client_feedback: currentEvaluation.client_feedback,
      completed_at: currentEvaluation.updated_at,
      reopened_at: new Date().toISOString(),
      reopened_by: reopened_by || 'System',
      reopened_reason: reason || 'Manual re-open'
    };
    
    // Insert into evaluation history table (create if not exists)
    db.run(`
      CREATE TABLE IF NOT EXISTS resource_evaluation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_evaluation_id INTEGER NOT NULL,
        associate_id TEXT NOT NULL,
        associate_name TEXT NOT NULL,
        email TEXT NOT NULL,
        country_code TEXT,
        phone_number TEXT,
        client_name TEXT NOT NULL,
        resume_file TEXT,
        internal_evaluation_status TEXT,
        internal_evaluation_date TEXT,
        internal_evaluation_feedback TEXT,
        client_evaluation_status TEXT,
        client_evaluation_date TEXT,
        client_feedback TEXT,
        completed_at TEXT,
        reopened_at TEXT NOT NULL,
        reopened_by TEXT NOT NULL,
        reopened_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert the historical record
    db.run(`
      INSERT INTO resource_evaluation_history (
        original_evaluation_id, associate_id, associate_name, email, country_code, 
        phone_number, client_name, resume_file, internal_evaluation_status, 
        internal_evaluation_date, internal_evaluation_feedback, client_evaluation_status, 
        client_evaluation_date, client_feedback, completed_at, reopened_at, 
        reopened_by, reopened_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      historyData.original_evaluation_id,
      historyData.associate_id,
      historyData.associate_name,
      historyData.email,
      historyData.country_code,
      historyData.phone_number,
      historyData.client_name,
      historyData.resume_file,
      historyData.internal_evaluation_status,
      historyData.internal_evaluation_date,
      historyData.internal_evaluation_feedback,
      historyData.client_evaluation_status,
      historyData.client_evaluation_date,
      historyData.client_feedback,
      historyData.completed_at,
      historyData.reopened_at,
      historyData.reopened_by,
      historyData.reopened_reason
    ]);
    
    // Reset the evaluation to pending state (making it active again)
    const result = db.run(`
      UPDATE resource_evaluations 
      SET 
        internal_evaluation_status = 'pending',
        client_evaluation_status = 'pending',
        internal_evaluation_date = NULL,
        client_evaluation_date = NULL,
        updated_at = ?
      WHERE id = ?
    `, [new Date().toISOString(), id]);
    
    if (result.changes === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update evaluation status'
      });
    }
    
    // Get the updated record
    const updatedEvaluation = db.get(`
      SELECT * FROM resource_evaluations 
      WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      message: 'Evaluation re-opened successfully and moved to active evaluations',
      data: {
        evaluation: updatedEvaluation,
        history_preserved: true,
        reopened_at: historyData.reopened_at
      }
    });
    
  } catch (error) {
    console.error('Error re-opening evaluation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to re-open evaluation',
      message: error.message
    });
  }
});
// Get evaluation history for a specific associate
router.get('/history/:associateId', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const { associateId } = req.params;
    
    // Get current active/pending evaluations for this associate
    const currentEvaluations = db.all(`
      SELECT *, 'current' as record_type, created_at as evaluation_date
      FROM resource_evaluations 
      WHERE associate_id = ?
      ORDER BY created_date DESC
    `, [associateId]);
    
    // Get historical evaluations for this associate
    const historicalEvaluations = db.all(`
      SELECT *, 'historical' as record_type, completed_at as evaluation_date
      FROM resource_evaluation_history 
      WHERE associate_id = ?
      ORDER BY completed_at DESC
    `, [associateId]);
    
    // Combine and sort all records by date
    const allEvaluations = [...currentEvaluations, ...historicalEvaluations]
      .sort((a, b) => new Date(b.evaluation_date) - new Date(a.evaluation_date));
    
    res.json({
      success: true,
      data: {
        associate_id: associateId,
        total_evaluations: allEvaluations.length,
        current_evaluations: currentEvaluations.length,
        historical_evaluations: historicalEvaluations.length,
        evaluations: allEvaluations
      }
    });
    
  } catch (error) {
    console.error('Error fetching evaluation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch evaluation history',
      message: error.message
    });
  }
});

// Get all evaluation history records (for administrative purposes)
router.get('/admin/history', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const historyRecords = db.all(`
      SELECT * FROM resource_evaluation_history 
      ORDER BY reopened_at DESC
    `);
    
    res.json({
      success: true,
      data: historyRecords,
      count: historyRecords.length
    });
    
  } catch (error) {
    console.error('Error fetching evaluation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch evaluation history',
      message: error.message
    });
  }
});

// Convert resume endpoint
router.post('/convert-resume', async (req, res) => {
  try {
    const { evaluationId, resumeFile } = req.body;
    
    if (!evaluationId || !resumeFile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: evaluationId and resumeFile'
      });
    }

    await db.ensureInitialized();
    
    // Get evaluation details
    const evaluation = db.get('SELECT * FROM resource_evaluations WHERE id = ?', [evaluationId]);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    // Check if resume file exists
    const originalFilePath = path.join(__dirname, '../uploads/resumes', resumeFile);
    if (!fs.existsSync(originalFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found'
      });
    }

    // For this demo, we'll create a simple converted file
    // In a real implementation, you would use libraries like:
    // - mammoth (for .docx to HTML conversion)
    // - pdf-lib (for PDF processing)
    // - docx (for creating Word documents)
    
    const originalExt = path.extname(resumeFile).toLowerCase();
    const baseName = path.basename(resumeFile, originalExt);
    
    // Create a converted filename
    const convertedFileName = `Converted_${evaluation.associate_name.replace(/\s+/g, '_')}_${evaluation.associate_id}.docx`;
    
    // For demonstration, we'll create a simple text file with standard format
    const convertedContent = `
PROFESSIONAL RESUME

Name: ${evaluation.associate_name}
Associate ID: ${evaluation.associate_id}
Email: ${evaluation.email}
Phone: ${evaluation.country_code} ${evaluation.phone_number}
Client: ${evaluation.client_name}

Evaluation Date: ${new Date(evaluation.created_date).toDateString()}
Internal Status: ${evaluation.internal_evaluation_status}
Client Status: ${evaluation.client_evaluation_status}

Resume Type: ${originalExt.substring(1).toUpperCase()}
Original File: ${resumeFile}

---
CONVERTED TO STANDARD FORMAT
This is a demonstration of resume conversion functionality.
In a production environment, this would contain the actual converted content
from the original resume file using appropriate document processing libraries.

Conversion performed on: ${new Date().toISOString()}
---
`;

    // Create the converted file as a simple text file for demo
    // In production, you would generate an actual Word document
    const buffer = Buffer.from(convertedContent, 'utf8');

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${convertedFileName}"`);
    res.setHeader('Content-Length', buffer.length);

    // Log the conversion activity
    console.log(`Resume conversion requested for evaluation ID: ${evaluationId}, Associate: ${evaluation.associate_name}`);

    // Send the converted file
    res.send(buffer);

  } catch (error) {
    console.error('Error converting resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert resume',
      error: error.message
    });
  }
});

module.exports = router;
