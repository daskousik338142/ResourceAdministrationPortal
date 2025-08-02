const express = require('express');
const router = express.Router();
const database = require('../config/database');

const nblListDB = database.getNBLListDB();

// GET /api/nbl-list/stats - Get statistics about the NBL data (must be before general GET route)
router.get('/stats', async (req, res) => {
  try {
    nblListDB.find({}, (err, docs) => {
      if (err) {
        console.error('Error fetching NBL stats:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching statistics',
          error: err.message
        });
      }

      console.log(`Found ${docs.length} records in database`);
      
      const totalRecords = docs.length;
      const uploadInfo = docs.length > 0 ? docs[0]._uploadInfo : null;
      
      // Calculate category distribution - only look for primary NBL Category field
      const categoryStats = {};
      
      docs.forEach(record => {
        // Only look for the primary "NBL Category" field, ignore secondary
        const nblCategory = record['NBL Category'];
        
        if (nblCategory && typeof nblCategory === 'string' && nblCategory.trim()) {
          // Normalize the category: trim spaces, convert to lowercase for comparison, then standardize
          let normalizedCategory = nblCategory.trim();
          
          // Standardize common variations by converting to lowercase and checking patterns
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
          // If no pattern matches, keep the trimmed original
          
          categoryStats[normalizedCategory] = (categoryStats[normalizedCategory] || 0) + 1;
        }
      });

      console.log('Category stats (NBL Category only, normalized):', categoryStats);
      
      res.json({
        success: true,
        data: {
          totalRecords,
          lastUpload: uploadInfo ? {
            fileName: uploadInfo.fileName,
            timestamp: uploadInfo.uploadTimestamp,
            headers: uploadInfo.headers
          } : null,
          categoryStats: categoryStats
        }
      });
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
    nblListDB.find({}, (err, docs) => {
      if (err) {
        console.error('Error fetching NBL records:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching NBL records',
          error: err.message
        });
      }

      // Sort by upload timestamp (most recent first)
      const sortedDocs = docs.sort((a, b) => 
        new Date(b.uploadTimestamp) - new Date(a.uploadTimestamp)
      );

      res.json({
        success: true,
        data: sortedDocs,
        count: sortedDocs.length
      });
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
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body data type:', typeof req.body.data);
    console.log('Request body data length:', req.body.data ? req.body.data.length : 'undefined');
    
    const { data, fileName, headers } = req.body;

    if (!data || !Array.isArray(data)) {
      console.log('Invalid data format received:', typeof data);
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of records.'
      });
    }

    console.log(`Processing upload: ${data.length} records from file "${fileName}"`);

    // Filter out records that are mostly empty (more than 50% empty values)
    const filteredData = data.filter(record => {
      const values = Object.values(record);
      const nonEmptyValues = values.filter(value => 
        value !== null && 
        value !== undefined && 
        value !== '' && 
        value.toString().trim() !== ''
      );
      
      // Keep records that have at least 50% non-empty values
      const nonEmptyPercentage = (nonEmptyValues.length / values.length) * 100;
      console.log(`Record has ${nonEmptyPercentage.toFixed(1)}% non-empty values`);
      return nonEmptyPercentage >= 50;
    });

    console.log(`Filtered ${data.length} records down to ${filteredData.length} quality records`);

    // First, remove all existing records
    nblListDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) {
        console.error('Error removing existing NBL records:', err);
        return res.status(500).json({
          success: false,
          message: 'Error clearing existing records',
          error: err.message
        });
      }

      console.log(`Removed ${numRemoved} existing NBL records`);

      // Prepare new records with metadata and clean empty values
      const uploadTimestamp = new Date().toISOString();
      const recordsToInsert = filteredData.map((record, index) => {
        // Clean the record by converting empty values to null or removing them
        const cleanedRecord = {};
        Object.keys(record).forEach(key => {
          const value = record[key];
          if (value !== null && value !== undefined && value !== '' && value.toString().trim() !== '') {
            cleanedRecord[key] = value;
          } else {
            cleanedRecord[key] = null; // Use null instead of empty string for better data quality
          }
        });

        return {
          ...cleanedRecord,
          _uploadInfo: {
            fileName: fileName || 'unknown',
            uploadTimestamp,
            originalIndex: index,
            headers: headers || []
          }
        };
      });

      console.log('Sample record to insert:', JSON.stringify(recordsToInsert[0], null, 2));

      // Insert new records
      nblListDB.insert(recordsToInsert, (err, newDocs) => {
        if (err) {
          console.error('Error inserting new NBL records:', err);
          return res.status(500).json({
            success: false,
            message: 'Error inserting new records',
            error: err.message
          });
        }

        console.log(`Successfully inserted ${newDocs.length} new NBL records`);

        res.json({
          success: true,
          message: `Successfully uploaded ${newDocs.length} records`,
          data: {
            recordsInserted: newDocs.length,
            recordsRemoved: numRemoved,
            uploadTimestamp,
            fileName: fileName || 'unknown'
          }
        });
      });
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

    // Add update timestamp
    updateData._lastModified = new Date().toISOString();

    nblListDB.update({ _id: id }, { $set: updateData }, {}, (err, numReplaced) => {
      if (err) {
        console.error('Error updating NBL record:', err);
        return res.status(500).json({
          success: false,
          message: 'Error updating record',
          error: err.message
        });
      }

      if (numReplaced === 0) {
        return res.status(404).json({
          success: false,
          message: 'Record not found'
        });
      }

      res.json({
        success: true,
        message: 'Record updated successfully',
        data: { recordsUpdated: numReplaced }
      });
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

// DELETE /api/nbl-list - Clear all NBL records but preserve headers
router.delete('/', async (req, res) => {
  try {
    // First, get existing headers to preserve them
    nblListDB.findOne({ _id: 'HEADERS_CONFIG' }, (err, headerDoc) => {
      if (err) {
        console.error('Error fetching headers before clear:', err);
      }
      
      // Remove all records except the headers config
      nblListDB.remove({ _id: { $ne: 'HEADERS_CONFIG' } }, { multi: true }, (err, numRemoved) => {
        if (err) {
          console.error('Error removing NBL records:', err);
          return res.status(500).json({
            success: false,
            message: 'Error removing records',
            error: err.message
          });
        }

        console.log(`Successfully removed ${numRemoved} records, preserved headers`);
        res.json({
          success: true,
          message: `Successfully removed ${numRemoved} records. Headers preserved for future uploads.`,
          data: { 
            recordsRemoved: numRemoved,
            headersPreserved: headerDoc ? headerDoc.headers : null
          }
        });
      });
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
    nblListDB.find({}, (err, docs) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Return first few records and their field names
      const sampleData = docs.slice(0, 3).map(doc => {
        const { _uploadInfo, _id, ...cleanDoc } = doc;
        return {
          fields: Object.keys(cleanDoc),
          sampleValues: cleanDoc
        };
      });
      
      res.json({
        totalRecords: docs.length,
        sampleData: sampleData
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get records by NBL category
router.get('/category/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    
    nblListDB.find({}, (err, docs) => {
      if (err) {
        console.error('Error fetching records by category:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching records',
          error: err.message
        });
      }

      // Filter records by normalized category name
      const filteredRecords = docs.filter(record => {
        const nblCategory = record['NBL Category'];
        
        if (nblCategory && typeof nblCategory === 'string' && nblCategory.trim()) {
          let normalizedCategory = nblCategory.trim();
          const lowerCategory = normalizedCategory.toLowerCase();
          
          // Apply same normalization as in stats endpoint
          if (lowerCategory.includes('nbl for') && lowerCategory.includes('month')) {
            normalizedCategory = 'NBL for month';
          } else if (lowerCategory.includes('awaiting') && lowerCategory.includes('bill')) {
            normalizedCategory = 'Awaiting Billing';
          } else if (lowerCategory === 'nbl') {
            normalizedCategory = 'NBL';
          } else if (lowerCategory === 'billed') {
            normalizedCategory = 'Billed';
          }
          
          return normalizedCategory === categoryName;
        }
        return false;
      });

      // Remove internal fields for cleaner response
      const cleanRecords = filteredRecords.map(record => {
        const { _uploadInfo, _id, ...cleanRecord } = record;
        return cleanRecord;
      });

      res.json({
        success: true,
        data: {
          category: categoryName,
          totalRecords: cleanRecords.length,
          records: cleanRecords
        }
      });
    });
  } catch (error) {
    console.error('Error in GET /nbl-list/category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category records',
      error: error.message
    });
  }
});

// Get detailed breakdown for summary table
router.get('/breakdown', async (req, res) => {
  try {
    nblListDB.find({}, (err, docs) => {
      if (err) {
        console.error('Error fetching breakdown data:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching breakdown data',
          error: err.message
        });
      }

      const totalRecords = docs.length;
      
      // Count GenC/PA records (Secondary NBL Category contains "GenC /PA")
      const gencPaRecords = docs.filter(record => {
        const secondaryCategory = record['NBL Secondary Category'];
        return secondaryCategory && 
               typeof secondaryCategory === 'string' && 
               secondaryCategory.toLowerCase().includes('genc') && 
               secondaryCategory.toLowerCase().includes('pa');
      });
      
      const gencPaCount = gencPaRecords.length;
      const nonGencCount = totalRecords - gencPaCount;
      
      // Count Billed records
      const billedRecords = docs.filter(record => {
        const nblCategory = record['NBL Category'];
        return nblCategory && nblCategory.trim().toLowerCase() === 'billed';
      });
      
      // Count Awaiting Billing records
      const awaitingBillingRecords = docs.filter(record => {
        const nblCategory = record['NBL Category'];
        return nblCategory && 
               typeof nblCategory === 'string' && 
               nblCategory.toLowerCase().includes('awaiting') && 
               nblCategory.toLowerCase().includes('bill');
      });
      
      // Count NBL for the month records
      const nblForMonthRecords = docs.filter(record => {
        const nblCategory = record['NBL Category'];
        return nblCategory && 
               typeof nblCategory === 'string' && 
               nblCategory.toLowerCase().includes('nbl for') && 
               nblCategory.toLowerCase().includes('month');
      });
      
      // Get secondary categories breakdown for NBL for the month
      const nblForMonthSecondaryBreakdown = {};
      nblForMonthRecords.forEach(record => {
        const secondaryCategory = record['NBL Secondary Category'];
        if (secondaryCategory && typeof secondaryCategory === 'string' && secondaryCategory.trim()) {
          const normalizedSecondary = secondaryCategory.trim();
          nblForMonthSecondaryBreakdown[normalizedSecondary] = 
            (nblForMonthSecondaryBreakdown[normalizedSecondary] || 0) + 1;
        }
      });

      console.log('Breakdown data calculated:', {
        totalRecords,
        gencPaCount,
        nonGencCount,
        billedCount: billedRecords.length,
        awaitingBillingCount: awaitingBillingRecords.length,
        nblForMonthCount: nblForMonthRecords.length,
        nblForMonthSecondaryBreakdown
      });

      res.json({
        success: true,
        data: {
          totalRecords,
          gencPaCount,
          nonGencCount,
          billedCount: billedRecords.length,
          awaitingBillingCount: awaitingBillingRecords.length,
          nblForMonthCount: nblForMonthRecords.length,
          nblForMonthSecondaryBreakdown
        }
      });
    });
  } catch (error) {
    console.error('Error in GET /nbl-list/breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching breakdown data',
      error: error.message
    });
  }
});

// GET /api/nbl-list/headers - Get saved headers
router.get('/headers', async (req, res) => {
  try {
    nblListDB.findOne({ _id: 'HEADERS_CONFIG' }, (err, doc) => {
      if (err) {
        console.error('Error fetching headers:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching headers',
          error: err.message
        });
      }

      if (doc && doc.headers) {
        console.log('Found saved headers:', doc.headers);
        res.json({
          success: true,
          headers: doc.headers,
          savedAt: doc.savedAt
        });
      } else {
        res.json({
          success: true,
          headers: null,
          message: 'No saved headers found'
        });
      }
    });
  } catch (error) {
    console.error('Error in headers endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/nbl-list/headers - Save headers
router.post('/headers', async (req, res) => {
  try {
    const { headers } = req.body;
    
    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({
        success: false,
        message: 'Headers array is required'
      });
    }

    const headerConfig = {
      _id: 'HEADERS_CONFIG',
      headers: headers,
      savedAt: new Date().toISOString()
    };

    nblListDB.update(
      { _id: 'HEADERS_CONFIG' },
      headerConfig,
      { upsert: true },
      (err, numReplaced, newDoc) => {
        if (err) {
          console.error('Error saving headers:', err);
          return res.status(500).json({
            success: false,
            message: 'Error saving headers',
            error: err.message
          });
        }

        console.log('Headers saved successfully:', headers);
        res.json({
          success: true,
          message: 'Headers saved successfully',
          headers: headers
        });
      }
    );
  } catch (error) {
    console.error('Error in save headers endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
