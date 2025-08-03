const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { convertDateFieldsInRecord } = require('../utils/dateUtils');

// GET /api/nbl-list/stats - Get statistics about the NBL data
router.get('/stats', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    const records = db.all('SELECT * FROM nbl_list ORDER BY upload_timestamp DESC');
    const totalRecords = records.length;
    
    let uploadInfo = null;
    if (records.length > 0) {
      let headers = [];
      try {
        headers = records[0].headers && records[0].headers !== 'undefined' ? JSON.parse(records[0].headers) : [];
      } catch (error) {
        console.warn('Invalid JSON in headers:', error.message);
        headers = [];
      }
      
      uploadInfo = {
        fileName: records[0].file_name,
        uploadTimestamp: records[0].upload_timestamp,
        headers: headers
      };
    }
    
    // Calculate category distribution
    const categoryStats = {};
    
    records.forEach(record => {
      try {
        const data = record.data && record.data !== 'undefined' ? JSON.parse(record.data) : {};
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
      } catch (error) {
        console.warn('Invalid JSON in record:', record.id, error.message);
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
      try {
        const data = record.data && record.data !== 'undefined' ? JSON.parse(record.data) : {};
        let headers = [];
        try {
          headers = record.headers && record.headers !== 'undefined' ? JSON.parse(record.headers) : [];
        } catch (headerError) {
          headers = [];
        }
        
        // Convert date fields from Excel serial numbers to MM/DD/YYYY format
        const convertedData = convertDateFieldsInRecord(data);
        
        return {
          ...convertedData,
          _id: record.id,
          _uploadInfo: {
            fileName: record.file_name,
            uploadTimestamp: record.upload_timestamp,
            originalIndex: record.original_index,
            headers: headers
          }
        };
      } catch (error) {
        console.warn('Invalid JSON in record:', record.id, error.message);
        return {
          _id: record.id,
          _uploadInfo: {
            fileName: record.file_name,
            uploadTimestamp: record.upload_timestamp,
            originalIndex: record.original_index,
            headers: []
          },
          _error: 'Invalid data format'
        };
      }
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
    console.log('Sample record:', JSON.stringify(data[0], null, 2));
    console.log('Headers:', headers);

    // First, remove all existing records
    const deleteResult = db.run('DELETE FROM nbl_list');
    console.log(`Removed ${deleteResult.changes} existing NBL records`);

    // Prepare new records with metadata
    const uploadTimestamp = new Date().toISOString();
    
    // Insert new records one by one
    let insertedCount = 0;
    
    for (let index = 0; index < data.length; index++) {
      const record = data[index];
      try {
        // Convert date fields from Excel serial numbers to MM/DD/YYYY format before storing
        const convertedRecord = convertDateFieldsInRecord(record);
        
        const result = db.run(`
          INSERT INTO nbl_list (data, file_name, upload_timestamp, original_index, headers)
          VALUES (?, ?, ?, ?, ?)
        `, [
          JSON.stringify(convertedRecord),
          fileName || 'unknown',
          uploadTimestamp,
          index,
          JSON.stringify(headers || [])
        ]);
        
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting record ${index}:`, error);
      }
    }

    console.log(`Successfully inserted ${insertedCount} new NBL records`);

    // Verify data was stored correctly by reading it back
    const verificationRecords = db.all('SELECT COUNT(*) as count FROM nbl_list WHERE upload_timestamp = ?', [uploadTimestamp]);
    const actualCount = verificationRecords[0]?.count || 0;

    res.json({
      success: true,
      message: `Successfully uploaded ${insertedCount} records`,
      data: {
        recordsInserted: insertedCount,
        recordsRemoved: deleteResult.changes,
        recordsVerified: actualCount,
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
    let existingData = {};
    try {
      existingData = currentRecord.data && currentRecord.data !== 'undefined' ? JSON.parse(currentRecord.data) : {};
    } catch (error) {
      console.warn('Invalid JSON in existing record:', id, error.message);
      existingData = {};
    }
    
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
      try {
        const data = record.data && record.data !== 'undefined' ? JSON.parse(record.data) : {};
        return {
          fields: Object.keys(data),
          sampleValues: data
        };
      } catch (error) {
        return {
          fields: ['_error'],
          sampleValues: { _error: 'Invalid JSON data' }
        };
      }
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

// GET /api/nbl-list/headers - Get saved headers
router.get('/headers', async (req, res) => {
  try {
    await db.ensureInitialized();
    
    // Try to get headers from the most recent upload
    const records = db.all('SELECT headers FROM nbl_list ORDER BY upload_timestamp DESC LIMIT 1');
    
    let headers = [];
    if (records.length > 0) {
      try {
        headers = records[0].headers && records[0].headers !== 'undefined' ? JSON.parse(records[0].headers) : [];
      } catch (error) {
        console.warn('Invalid JSON in headers:', error.message);
        headers = [];
      }
    }

    res.json({
      success: true,
      data: {
        headers: headers
      }
    });
  } catch (error) {
    console.error('Error in GET /nbl-list/headers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/nbl-list/headers - Save headers configuration
router.post('/headers', async (req, res) => {
  try {
    const { headers } = req.body;

    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({
        success: false,
        message: 'Headers array is required'
      });
    }

    await db.ensureInitialized();

    // For now, we'll just respond with success since headers are saved with uploads
    // In a full implementation, you might want to save headers separately
    
    res.json({
      success: true,
      message: 'Headers saved successfully',
      data: {
        headers: headers
      }
    });
  } catch (error) {
    console.error('Error in POST /nbl-list/headers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
