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
router.get('/', async (req, res) => {
  try {
    await db.ensureInitialized();
    const docs = await db.findEmailListRecords({});
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
router.post('/', async (req, res) => {
  try {
    await db.ensureInitialized();
    const { email, name, description } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    // Check if email already exists
    const existing = await db.findEmailListRecord({ email: email.toLowerCase() });
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
      message: 'Email address added successfully',
      data: doc
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
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, description, active } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    // Check if email already exists (excluding current record)
    const existingEmails = await db.findEmailListRecords({ email: email.toLowerCase() });
    const existing = existingEmails.find(e => e._id !== id);
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
    const result = await db.updateEmailListRecord({ _id: id }, updateData);
    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email address not found'
      });
    }
    // Get updated record
    const doc = await db.findEmailListRecord({ _id: id });
    res.json({
      success: true,
      message: 'Email address updated successfully',
      data: doc
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
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.removeEmailListRecord({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email address not found'
      });
    }
    res.json({
      success: true,
      message: 'Email address deleted successfully',
      deletedCount: result.deletedCount || 0
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
router.get('/active', async (req, res) => {
  try {
    await db.ensureInitialized();
    const docs = await db.findEmailListRecords({ active: true });
    res.json({
      success: true,
      data: docs,
      count: docs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
// POST /api/email-list/bulk-add - Add multiple email addresses
router.post('/bulk-add', async (req, res) => {
  try {
    await db.ensureInitialized();
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({
        success: false,
        message: 'Emails array is required'
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const results = {
      added: [],
      skipped: [],
      errors: []
    };
    const activeEmails = await db.findEmailListRecords({ active: true });
    for (const emailData of emails) {
      try {
        const email = emailData.email || emailData;
        const name = emailData.name || '';
        const description = emailData.description || '';
        // Validate email format
        if (!emailRegex.test(email)) {
          results.errors.push({
            email: email,
            error: 'Invalid email format'
          });
          continue;
        }
        // Check if email already exists
        const existing = activeEmails.find(e => e.email === email.toLowerCase());
        if (existing) {
          results.skipped.push({
            email: email,
            reason: 'Email already exists'
          });
          continue;
        }
        // Add new email
        const newEmail = {
          email: email.toLowerCase(),
          name: name,
          description: description,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const doc = db.insertEmailListRecord(newEmail);
        results.added.push(doc);
      } catch (error) {
        results.errors.push({
          email: emailData.email || emailData,
          error: error.message
        });
      }
    }
    res.json({
      success: true,
      message: `Bulk add completed. Added: ${results.added.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`,
      results: results
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
