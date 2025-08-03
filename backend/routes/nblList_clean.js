const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/nbl-list/stats - Get statistics about the NBL data
router.get('/stats', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const records = db.all('SELECT * FROM nbl_list ORDER BY upload_timestamp DESC');
    const totalRecords = records.length;
    
    let uploadInfo = null;
    if (records.length > 0) {
      uploadInfo = {
        fileName: records[0].file_name,
        uploadTimestamp: records[0].upload_timestamp,
        headers: records[0].headers ? JSON.parse(records[0].headers) : []
      };
    }
    
    // Calculate category distribution
    const categoryStats = {};
    
    records.forEach(record => {
      const data = JSON.parse(record.data);
      const nblCategory = data['NBL Category'];
      
      if (nblCategory && typeof nblCategory === 'string' && nblCategory.trim()) {
        let normalizedCategory = nblCategory.trim();
        const lowerCategory = normalizedCategory.toLowerCase();
        
        if (lowerCategory.includes('nbl for') && lowerCategory.includes('month')) {
          normalizedCategory = 'NBL for month';
        } else if (lowerCategory.includes('awaiting') && lowerCategory.includes('bill')) {
          normalizedCategory = 'Awaiting Billing';
        } else if (lowerCategory === 'nbl') {
          normalizedCategory = 'NBL';
        } else if (lowerCategory === 'billed') {
          normalizedCategory = 'Billed';
        }
        
        categoryStats[normalizedCategory] = (categoryStats[normalizedCategory] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: {
        totalRecords,
        lastUpload: uploadInfo,
        categoryStats: categoryStats
      }
    });
  } catch (error) {
    console.error('Error in GET /nbl-list/stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/nbl-list - Get all NBL records
router.get('/', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const records = db.all('SELECT * FROM nbl_list ORDER BY upload_timestamp DESC');
    
    // Convert records to the format expected by frontend
    const formattedRecords = records.map(record => {
      const data = JSON.parse(record.data);
      return {
        ...data,
        _id: record.id,
        _uploadInfo: {
          fileName: record.file_name,
          uploadTimestamp: record.upload_timestamp,
          originalIndex: record.original_index,
          headers: record.headers ? JSON.parse(record.headers) : []
        }
      };
    });

    res.json({
      success: true,
      data: formattedRecords,
      count: formattedRecords.length
    });
  } catch (error) {
    console.error('Error in GET /nbl-list:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/nbl-list/upload - Upload new NBL data (replace all existing records)
router.post('/upload', async (req, res) => {
  try {
    console.log('NBL Upload request received');
    const { data, fileName, headers } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of records.'
      });
    }

    await db.ensureInitialized();

    console.log(`Processing upload: ${data.length} records from file "${fileName}"`);

    // First, remove all existing records
    const deleteResult = db.run('DELETE FROM nbl_list');
    console.log(`Removed ${deleteResult.changes} existing NBL records`);

    // Prepare new records with metadata
    const uploadTimestamp = new Date().toISOString();
    
    // Insert new records
    const insertStmt = db.prepare(`
      INSERT INTO nbl_list (data, file_name, upload_timestamp, original_index, headers)
      VALUES (?, ?, ?, ?, ?)
    `);

    let insertedCount = 0;
    data.forEach((record, index) => {
      const result = insertStmt.run(
        JSON.stringify(record),
        fileName || 'unknown',
        uploadTimestamp,
        index,
        JSON.stringify(headers || [])
      );
      if (result.changes > 0) insertedCount++;
    });

    insertStmt.finalize();

    console.log(`Successfully inserted ${insertedCount} new NBL records`);

    res.json({
      success: true,
      message: `Successfully uploaded ${insertedCount} records`,
      data: {
        recordsInserted: insertedCount,
        recordsRemoved: deleteResult.changes,
        uploadTimestamp,
        fileName: fileName || 'unknown'
      }
    });
  } catch (error) {
    console.error('Error in POST /nbl-list/upload:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PUT /api/nbl-list/:id - Update a specific NBL record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove any fields that shouldn't be updated
    delete updateData._id;
    delete updateData._uploadInfo;

    // Add update timestamp to the data
    updateData._lastModified = new Date().toISOString();

    await db.ensureInitialized();

    // Get current record
    const currentRecord = db.get('SELECT * FROM nbl_list WHERE id = ?', [id]);
    
    if (!currentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    // Merge the update data with existing data
    const existingData = JSON.parse(currentRecord.data);
    const updatedData = { ...existingData, ...updateData };

    // Update the record
    const result = db.run(
      'UPDATE nbl_list SET data = ? WHERE id = ?',
      [JSON.stringify(updatedData), id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    res.json({
      success: true,
      message: 'Record updated successfully',
      data: { recordsUpdated: result.changes }
    });
  } catch (error) {
    console.error('Error in PUT /nbl-list/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/nbl-list - Clear all NBL records
router.delete('/', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const result = db.run('DELETE FROM nbl_list');

    console.log(`Successfully removed ${result.changes} records`);
    res.json({
      success: true,
      message: `Successfully removed ${result.changes} records.`,
      data: { 
        recordsRemoved: result.changes
      }
    });
  } catch (error) {
    console.error('Error in DELETE /nbl-list:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Debug endpoint to check data structure
router.get('/debug', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const records = db.all('SELECT * FROM nbl_list LIMIT 3');
    
    // Return first few records and their field names
    const sampleData = records.map(record => {
      const data = JSON.parse(record.data);
      return {
        fields: Object.keys(data),
        sampleValues: data
      };
    });
    
    res.json({
      totalRecords: db.get('SELECT COUNT(*) as count FROM nbl_list').count,
      sampleData: sampleData
    });
  } catch (error) {
    console.error('Error in GET /nbl-list/debug:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
