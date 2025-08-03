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
  const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, and PPTX files are allowed.'), false);
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
    const evaluations = await new Promise((resolve, reject) => {
      db.getResourceEvaluationsDB().find({}, (err, docs) => {
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
// Get resource evaluation database schema
router.get('/schema', (req, res) => {
  const schema = {
    description: 'Resource Evaluation Database Schema',
    fields: {
      // Basic Info
      associateId: { type: 'string', required: true, description: 'Unique identifier for the associate' },
      associateName: { type: 'string', required: true, description: 'Full name of the associate' },
      customerName: { type: 'string', required: false, description: 'Client/Customer name for the project' },
      resume: { 
        type: 'object', 
        required: true, 
        description: 'File information for uploaded resume',
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
    workflow: {
      1: 'Create initial record with associateId, associateName, resume upload',
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
// Create a new resource evaluation
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const {
      associateId,
      associateName,
      customerName
    } = req.body;
    // Validate required fields
    if (!associateId || !associateName) {
      return res.status(400).json({ 
        error: 'Missing required fields: associateId, associateName' 
      });
    }
    // Check if associate ID already exists
    const existingEvaluation = await new Promise((resolve, reject) => {
      db.getResourceEvaluationsDB().findOne({ associateId: associateId }, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
    if (existingEvaluation) {
      return res.status(400).json({ 
        error: 'Associate ID already exists in the system' 
      });
    }
    const newEvaluation = {
      associateId,
      associateName,
      resume: req.file ? {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      } : null,
      // Optional evaluation fields - will be updated later during evaluation process
      internalEvaluation1Status: null,
      internalEvaluation1Feedback: '',
      internalEvaluation2Status: null,
      internalEvaluation2Feedback: '',
      internalEvaluation3Status: null,
      internalEvaluation3Feedback: '',
      customerName: customerName || '',
      clientInterviewStatus: null,
      clientInterviewFeedback: '',
      clientCodingEvaluationStatus: null,
      clientCodingEvaluationFeedback: '',
      // Metadata
      status: 'pending', // overall evaluation status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const evaluation = await new Promise((resolve, reject) => {
      db.getResourceEvaluationsDB().insert(newEvaluation, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
    res.status(201).json({
      message: 'Resource evaluation created successfully',
      evaluation: {
        ...evaluation,
        // Don't send the full file path for security
        resume: evaluation.resume ? {
          filename: evaluation.resume.filename,
          originalName: evaluation.resume.originalName,
          size: evaluation.resume.size,
          uploadedAt: evaluation.resume.uploadedAt
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create resource evaluation: ' + error.message });
  }
});
// Update a resource evaluation
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
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
    res.status(500).json({ error: 'Failed to update resource evaluation' });
  }
});
// Delete a resource evaluation
router.delete('/:id', async (req, res) => {
  try {
    const numRemoved = await new Promise((resolve, reject) => {
      db.getResourceEvaluationsDB().remove({ _id: req.params.id }, {}, (err, numRemoved) => {
        if (err) reject(err);
        else resolve(numRemoved);
      });
    });
    if (numRemoved === 0) {
      return res.status(404).json({ error: 'Resource evaluation not found' });
    }
    res.json({ message: 'Resource evaluation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resource evaluation' });
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
module.exports = router;
