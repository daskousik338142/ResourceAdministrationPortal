const express = require('express');
const router = express.Router();
const db = require('../config/database');
// Initialize database when routes are loaded
const initializeEmailListDB = async () => {
  try {
    await db.ensureInitialized();
  } catch (error) {
  }
};
initializeEmailListDB();
// GET /api/email-list - Get all email addresses
router.get('/', (req, res) => {
  try {
    const docs = db.findEmailListRecords({});
    // Sort by createdAt descending (newest first)
    const sortedDocs = docs.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    res.json({
      success: true,
      data: sortedDocs,
      count: sortedDocs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
// POST /api/email-list - Add new email address
router.post('/', (req, res) => {
  try {
    const { email, name, description } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    // Check if email already exists
    const existing = db.findEmailListRecord({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email address already exists'
      });
    }
    // Create new email record
    const newEmail = {
      email: email.toLowerCase(),
      name: name || '',
      description: description || '',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const doc = db.insertEmailListRecord(newEmail);
    res.status(201).json({
      success: true,
      data: doc,
      message: 'Email address added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
// PUT /api/email-list/:id - Update email address
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, description, active } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    // Check if email already exists (excluding current record)
    emailListDB.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: id } 
    }, (err, existing) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error checking existing email',
          error: err.message
        });
      }
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email address already exists'
        });
      }
      // Update email record
      const updateData = {
        email: email.toLowerCase(),
        name: name || '',
        description: description || '',
        active: active !== undefined ? active : true,
        updatedAt: new Date().toISOString()
      };
      emailListDB.update({ _id: id }, { $set: updateData }, {}, (err, numReplaced) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error updating email address',
            error: err.message
          });
        }
        if (numReplaced === 0) {
          return res.status(404).json({
            success: false,
            message: 'Email address not found'
          });
        }
        // Get updated record
        emailListDB.findOne({ _id: id }, (err, doc) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Error fetching updated email',
              error: err.message
            });
          }
          res.json({
            success: true,
            data: doc,
            message: 'Email address updated successfully'
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
// DELETE /api/email-list/:id - Delete email address
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    emailListDB.remove({ _id: id }, {}, (err, numRemoved) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error deleting email address',
          error: err.message
        });
      }
      if (numRemoved === 0) {
        return res.status(404).json({
          success: false,
          message: 'Email address not found'
        });
      }
      res.json({
        success: true,
        message: 'Email address deleted successfully'
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
// GET /api/email-list/active - Get only active email addresses
router.get('/active', (req, res) => {
  try {
    emailListDB.find({ active: true }, (err, docs) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error fetching active emails',
          error: err.message
        });
      }
      res.json({
        success: true,
        data: docs,
        count: docs.length
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
// POST /api/email-list/send-summary - Send summary to all active emails
router.post('/send-summary', async (req, res) => {
  try {
    const { summaryData } = req.body;
    if (!summaryData) {
      return res.status(400).json({
        success: false,
        message: 'Summary data is required'
      });
    }
    // Get all active email addresses
    emailListDB.find({ active: true }, async (err, emails) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error fetching email recipients',
          error: err.message
        });
      }
      if (emails.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active email recipients found'
        });
      }
      const emailService = req.app.locals.emailService;
      if (!emailService) {
        return res.status(503).json({
          success: false,
          message: 'Email service not available'
        });
      }
      const results = [];
      const recipients = emails.map(e => e.email);
      try {
        for (const email of emails) {
          const result = await emailService.sendNBLSummaryEmail(email.email, summaryData);
          results.push({
            email: email.email,
            name: email.name,
            success: result.success,
            error: result.error || null
          });
        }
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;
        res.json({
          success: true,
          message: `Summary emails sent to ${successCount} recipients${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
          results: results,
          summary: {
            total: results.length,
            success: successCount,
            failed: failureCount
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error sending summary emails',
          error: error.message
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
module.exports = router;
