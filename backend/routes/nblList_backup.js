const express = require('express');
const router = express.Router();
const db = require('../config/dat// POST /api/nbl-list/upload - Upload NBL data
router.post('/upload', async (req, res) => {
  try {
    await db.ensureInitialized();
    const { data, fileName, headers } = req.body;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of records.'
      });
    }tialize database when routes are loaded
const initializeNBLListDB = async () => {
  try {
    await db.ensureInitialized();
  } catch (error) {
    // Error handling - could log to file in production
  }
};
initializeNBLListDB();
// GET /api/nbl-list/stats - Get statistics about the NBL data (must be before general GET route)
router.get('/stats', async (req, res) => {
  try {
    await db.ensureInitialized();
    const docs = await db.findNBLRecords({});
    const totalRecords = docs.length;
    // Get upload info from the most recent record
    const uploadInfo = docs.length > 0 ? {
      fileName: docs[0].file_name,
      uploadTimestamp: docs[0].upload_timestamp,
      headers: docs[0].headers ? JSON.parse(docs[0].headers) : null
    } : null;
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
  } catch (error) {
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
    const docs = await db.findNBLRecords({});
    // Sort by upload timestamp (most recent first) - already handled by SQLite ORDER BY
    const sortedDocs = docs;
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
// POST /api/nbl-list/upload - Upload new NBL data (replace all existing records)
router.post('/upload', async (req, res) => {
  try {
    await db.ensureInitialized();
    const { data, fileName, headers } = req.body;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of records.'
      });
    }
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
      return nonEmptyPercentage >= 50;
    });
    // First, remove all existing data records (but preserve config records)
    const result = await db.removeNBLRecord({ record_type: 'data' });
    const numRemoved = result.deletedCount || 0;
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
        upload_timestamp: uploadTimestamp,
        file_name: fileName || 'unknown',
        original_index: index,
        headers: headers ? JSON.stringify(headers) : null
      };
    });
    // Insert new records
    const newDocs = [];
    for (const record of recordsToInsert) {
      const newDoc = await db.insertNBLRecord(record);
      newDocs.push(newDoc);
    }
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
  } catch (error) {
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
    await db.ensureInitialized();
    const { id } = req.params;
    const updateData = req.body;
    // Get the existing record before update for comparison
    const existingRecord = await db.findNBLRecord({ _id: id });
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }
    // Log the specific fields being updated
    Object.keys(updateData).forEach(fieldName => {
      if (fieldName !== 'last_modified') {
        const oldValue = existingRecord[fieldName];
        const newValue = updateData[fieldName];
      }
    });
    // Clean the update data
    const cleanUpdateData = { ...updateData };
    delete cleanUpdateData._id;
    delete cleanUpdateData.id;
    delete cleanUpdateData.upload_timestamp;
    delete cleanUpdateData.file_name;
    delete cleanUpdateData.record_type;
    delete cleanUpdateData.created_at;
    // Add update timestamp
    cleanUpdateData.last_modified = new Date().toISOString();
    // Perform the update
    const updateStartTime = Date.now();
    const result = await db.updateNBLRecord({ _id: id }, cleanUpdateData);
    const updateEndTime = Date.now();
    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes were made to the record'
      });
    }
    // Fetch the updated record to verify changes
    const updatedRecord = await db.findNBLRecord({ _id: id });
    // Verify each updated field
    Object.keys(updateData).forEach(fieldName => {
      if (fieldName !== 'last_modified') {
        const expectedValue = updateData[fieldName];
        const actualValue = updatedRecord[fieldName];
      }
    });
    res.json({
      success: true,
      message: 'Record updated successfully',
      data: updatedRecord,
      debug: {
        recordId: id,
        fieldsUpdated: Object.keys(updateData).filter(k => k !== 'last_modified'),
        updateTime: (updateEndTime - updateStartTime) + 'ms'
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
// DELETE /api/nbl-list - Clear all NBL records but preserve headers
router.delete('/', async (req, res) => {
  try {
    await db.ensureInitialized();
    // First, count how many data records we have before deletion
    const allRecords = await db.findNBLRecords({});
    const dataRecordsCount = allRecords.length;
    // Delete all data records (preserve any config records if they exist)
    // Use the database's removeNBLRecord method which properly handles record types
    const result = await db.removeNBLRecord({ record_type: 'data' });
    const numRemoved = result.deletedCount || 0;
    // Verify deletion worked
    const remainingRecords = await db.findNBLRecords({});
    res.json({
      success: true,
      message: `Successfully cleared ${numRemoved} records from the NBL list.`,
      data: { 
        recordsRemoved: numRemoved,
        originalCount: dataRecordsCount,
        remainingRecords: remainingRecords.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear NBL records',
      error: error.message
    });
  }
});
// Debug endpoint to check data structure
router.get('/debug', async (req, res) => {
  try {
    await db.ensureInitialized();
    const docs = await db.findNBLRecords({});
    // Return first few records and their field names
    const sampleData = docs.slice(0, 3).map(doc => {
      const { upload_timestamp, file_name, original_index, headers, id, _id, ...cleanDoc } = doc;
      return {
        fields: Object.keys(cleanDoc),
        sampleValues: cleanDoc
      };
    });
    res.json({
      totalRecords: docs.length,
      sampleData: sampleData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Get records by NBL category
router.get('/category/:categoryName', async (req, res) => {
  try {
    await db.ensureInitialized();
    const { categoryName } = req.params;
    const docs = await db.findNBLRecords({});
    // Filter records by the requested category
    const filteredRecords = docs.filter(record => {
      const nblCategory = record['NBL Category'];
      if (!nblCategory) return false;
      // Case-insensitive partial match
      return nblCategory.toLowerCase().includes(categoryName.toLowerCase());
    });
    res.json({
      success: true,
      category: categoryName,
      data: filteredRecords,
      count: filteredRecords.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
// Get detailed breakdown for summary table
router.get('/breakdown', async (req, res) => {
  try {
    await db.ensureInitialized();
    const docs = await db.findNBLRecords({});
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
  } catch (error) {
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
    await db.ensureInitialized();
    const doc = await db.findNBLRecord({ _id: 'HEADERS_CONFIG' });
    if (doc && doc.headers) {
      res.json({
        success: true,
        headers: Array.isArray(doc.headers) ? doc.headers : JSON.parse(doc.headers || '[]'),
        savedAt: doc.savedAt || doc.saved_at
      });
    } else {
      res.json({
        success: true,
        headers: null,
        message: 'No saved headers found'
      });
    }
  } catch (error) {
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
    await db.ensureInitialized();
    const { headers } = req.body;
    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({
        success: false,
        message: 'Headers array is required'
      });
    }
    const headerConfig = {
      _id: 'HEADERS_CONFIG',
      headers: JSON.stringify(headers),
      saved_at: new Date().toISOString()
    };
    // Try to find existing headers config first
    const existing = await db.findNBLRecord({ _id: 'HEADERS_CONFIG' });
    if (existing) {
      // Update existing
      await db.updateNBLRecord({ _id: 'HEADERS_CONFIG' }, headerConfig);
    } else {
      // Insert new
      await db.insertNBLRecord(headerConfig);
    }
    res.json({
      success: true,
      message: 'Headers saved successfully',
      headers: headers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});
module.exports = router;
