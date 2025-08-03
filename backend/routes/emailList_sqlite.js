const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/email-list - Get all email list entries
router.get('/', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const emails = db.all('SELECT * FROM email_list ORDER BY created_at DESC');
    
    res.json({
      success: true,
      data: emails,
      count: emails.length
    });
  } catch (error) {
    console.error('Error in GET /email-list:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/email-list - Add new email to list
router.post('/', async (req, res) => {
  try {
    const { email, name, notes } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    await db.ensureInitialized();

    // Check if email already exists
    const existingEmail = db.get('SELECT * FROM email_list WHERE email = ?', [email]);
    
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists in the list'
      });
    }

    // Insert new email
    const result = db.run(`
      INSERT INTO email_list (email, name, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
      email,
      name || null,
      notes || null,
      new Date().toISOString(),
      new Date().toISOString()
    ]);

    res.status(201).json({
      success: true,
      message: 'Email added successfully',
      data: {
        id: result.lastInsertRowid,
        email,
        name,
        notes
      }
    });
  } catch (error) {
    console.error('Error in POST /email-list:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PUT /api/email-list/:id - Update email entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, notes } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    await db.ensureInitialized();

    // Check if email exists with different ID
    const existingEmail = db.get('SELECT * FROM email_list WHERE email = ? AND id != ?', [email, id]);
    
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists in the list'
      });
    }

    // Update email
    const result = db.run(`
      UPDATE email_list 
      SET email = ?, name = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `, [
      email,
      name || null,
      notes || null,
      new Date().toISOString(),
      id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    res.json({
      success: true,
      message: 'Email updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /email-list/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/email-list/:id - Delete email entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.ensureInitialized();

    const result = db.run('DELETE FROM email_list WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    res.json({
      success: true,
      message: 'Email deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /email-list/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/email-list/bulk - Bulk import emails
router.post('/bulk', async (req, res) => {
  try {
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({
        success: false,
        message: 'Emails array is required'
      });
    }

    await db.ensureInitialized();

    let addedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process each email
    for (const emailData of emails) {
      try {
        const { email, name, notes } = emailData;

        if (!email) {
          errors.push({ email: emailData, error: 'Email is required' });
          continue;
        }

        // Check if email already exists
        const existingEmail = db.get('SELECT * FROM email_list WHERE email = ?', [email]);
        
        if (existingEmail) {
          skippedCount++;
          continue;
        }

        // Insert new email
        db.run(`
          INSERT INTO email_list (email, name, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `, [
          email,
          name || null,
          notes || null,
          new Date().toISOString(),
          new Date().toISOString()
        ]);

        addedCount++;
      } catch (error) {
        errors.push({ email: emailData, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Bulk import completed. Added: ${addedCount}, Skipped: ${skippedCount}`,
      data: {
        addedCount,
        skippedCount,
        errors
      }
    });
  } catch (error) {
    console.error('Error in POST /email-list/bulk:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/email-list - Clear all emails
router.delete('/', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const result = db.run('DELETE FROM email_list');

    res.json({
      success: true,
      message: `Successfully removed ${result.changes} email entries`,
      data: { 
        recordsRemoved: result.changes
      }
    });
  } catch (error) {
    console.error('Error in DELETE /email-list:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
