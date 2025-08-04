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
    const { email, name, description, distribution_list, active = true } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
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
      INSERT INTO email_list (email, name, description, distribution_list, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      email,
      name,
      description || null,
      distribution_list || null,
      active ? 1 : 0,
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
        description,
        distribution_list,
        active
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
    const { email, name, description, distribution_list, active = true } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
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
      SET email = ?, name = ?, description = ?, distribution_list = ?, active = ?, updated_at = ?
      WHERE id = ?
    `, [
      email,
      name,
      description || null,
      distribution_list || null,
      active ? 1 : 0,
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
        const { email, name, description, active = true } = emailData;

        if (!email) {
          errors.push({ email: emailData, error: 'Email is required' });
          continue;
        }

        if (!name) {
          errors.push({ email: emailData, error: 'Name is required' });
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
          INSERT INTO email_list (email, name, description, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          email,
          name,
          description || null,
          active ? 1 : 0,
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

// Distribution List Management Routes

// GET /api/email-list/dl/list - Get all unique distribution lists
router.get('/dl/list', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const distributionLists = db.all(`
      SELECT DISTINCT distribution_list as name, 
             COUNT(*) as email_count,
             GROUP_CONCAT(email) as emails
      FROM email_list 
      WHERE distribution_list IS NOT NULL AND distribution_list != ''
      GROUP BY distribution_list
      ORDER BY distribution_list
    `);
    
    res.json({
      success: true,
      data: distributionLists.map(dl => ({
        name: dl.name,
        emailCount: dl.email_count,
        emails: dl.emails ? dl.emails.split(',') : []
      }))
    });
  } catch (error) {
    console.error('Error fetching distribution lists:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/email-list/dl/:name - Get emails in a specific distribution list
router.get('/dl/:name', async (req, res) => {
  try {
    const { name } = req.params;
    await db.ensureInitialized();
    
    const emails = db.all(`
      SELECT * FROM email_list 
      WHERE distribution_list = ? 
      ORDER BY name
    `, [name]);
    
    res.json({
      success: true,
      data: {
        name: name,
        emails: emails
      }
    });
  } catch (error) {
    console.error('Error fetching distribution list emails:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/email-list/dl/create - Create/Update distribution list
router.post('/dl/create', async (req, res) => {
  try {
    const { dlName, emailIds } = req.body;
    
    if (!dlName) {
      return res.status(400).json({
        success: false,
        message: 'Distribution list name is required'
      });
    }
    
    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one email must be selected'
      });
    }
    
    await db.ensureInitialized();
    
    // First, remove any existing assignments for this DL name
    db.run('UPDATE email_list SET distribution_list = NULL WHERE distribution_list = ?', [dlName]);
    
    // Then assign the DL name to selected emails
    const placeholders = emailIds.map(() => '?').join(',');
    db.run(`
      UPDATE email_list 
      SET distribution_list = ?, updated_at = ?
      WHERE id IN (${placeholders})
    `, [dlName, new Date().toISOString(), ...emailIds]);
    
    res.json({
      success: true,
      message: `Distribution list "${dlName}" created successfully`,
      data: {
        dlName,
        emailCount: emailIds.length
      }
    });
  } catch (error) {
    console.error('Error creating distribution list:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PUT /api/email-list/dl/:name - Update distribution list
router.put('/dl/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { newName, emailIds } = req.body;
    
    if (!newName) {
      return res.status(400).json({
        success: false,
        message: 'Distribution list name is required'
      });
    }
    
    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one email must be selected'
      });
    }
    
    await db.ensureInitialized();
    
    // Clear existing assignments for old name
    db.run('UPDATE email_list SET distribution_list = NULL WHERE distribution_list = ?', [name]);
    
    // If new name is different, also clear any existing assignments for new name
    if (name !== newName) {
      db.run('UPDATE email_list SET distribution_list = NULL WHERE distribution_list = ?', [newName]);
    }
    
    // Assign new DL name to selected emails
    const placeholders = emailIds.map(() => '?').join(',');
    db.run(`
      UPDATE email_list 
      SET distribution_list = ?, updated_at = ?
      WHERE id IN (${placeholders})
    `, [newName, new Date().toISOString(), ...emailIds]);
    
    res.json({
      success: true,
      message: `Distribution list updated successfully`,
      data: {
        oldName: name,
        newName: newName,
        emailCount: emailIds.length
      }
    });
  } catch (error) {
    console.error('Error updating distribution list:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/email-list/dl/:name - Delete distribution list
router.delete('/dl/:name', async (req, res) => {
  try {
    const { name } = req.params;
    await db.ensureInitialized();
    
    // Remove DL assignment from all emails
    const result = db.run(`
      UPDATE email_list 
      SET distribution_list = NULL, updated_at = ?
      WHERE distribution_list = ?
    `, [new Date().toISOString(), name]);
    
    res.json({
      success: true,
      message: `Distribution list "${name}" deleted successfully`,
      data: {
        emailsUpdated: result.changes
      }
    });
  } catch (error) {
    console.error('Error deleting distribution list:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/email-list/dl/remove-email - Remove email from distribution list
router.post('/dl/remove-email', async (req, res) => {
  try {
    const { emailId } = req.body;
    
    if (!emailId) {
      return res.status(400).json({
        success: false,
        message: 'Email ID is required'
      });
    }
    
    await db.ensureInitialized();
    
    const result = db.run(`
      UPDATE email_list 
      SET distribution_list = NULL, updated_at = ?
      WHERE id = ?
    `, [new Date().toISOString(), emailId]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Email removed from distribution list'
    });
  } catch (error) {
    console.error('Error removing email from distribution list:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
