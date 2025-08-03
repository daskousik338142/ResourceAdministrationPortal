const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');
const { formatDateToMMDDYYYY, isDateField, convertDateFieldsInRecord } = require('../utils/dateUtils');

// Upload new allocation data
router.post('/upload', async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || 'unknown';
  
  try {
    await db.ensureInitialized();
    const { data, fileName, headers } = req.body;

    if (!data || !Array.isArray(data)) {
      logger.error(correlationId, 'NEW_ALLOCATIONS', 'UPLOAD', 'Invalid data format received');
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of records.'
      });
    }

    if (!headers || !Array.isArray(headers)) {
      logger.error(correlationId, 'NEW_ALLOCATIONS', 'UPLOAD', 'Invalid headers format received');
      return res.status(400).json({
        success: false,
        message: 'Invalid headers format. Expected array of header names.'
      });
    }

    logger.info(correlationId, 'NEW_ALLOCATIONS', 'UPLOAD_START', 'Starting new allocation data upload', {
      fileName,
      recordCount: data.length,
      headerCount: headers.length
    });

    // Clear all existing new allocation data
    const result = await db.removeNewAllocation({});
    logger.info(correlationId, 'NEW_ALLOCATIONS', 'DATA_CLEARED', 'Existing data cleared', {
      deletedCount: result.deletedCount || 0
    });

    // Filter out records that are mostly empty (more than 50% empty values)
    const filteredData = data.filter(record => {
      const values = Object.values(record);
      const nonEmptyValues = values.filter(value => 
        value !== null && 
        value !== undefined && 
        value !== '' && 
        value.toString().trim() !== ''
      );
      const nonEmptyPercentage = (nonEmptyValues.length / values.length) * 100;
      return nonEmptyPercentage >= 20; // Keep records that are at least 20% filled
    });

    logger.info(correlationId, 'NEW_ALLOCATIONS', 'DATA_FILTERED', 'Data filtering complete', {
      originalCount: data.length,
      filteredCount: filteredData.length
    });

    // Define the exact business columns that should be in new_allocations table (same as allocation_data)
    const PREDEFINED_BUSINESS_COLUMNS = [
      'CustomerID', 'CustomerName', 'AssociateID', 'AssociateName', 'Designation',
      'GradeDescription', 'DepartmentID', 'DepartmentName', 'ProjectID', 'ProjectName',
      'ProjectType', 'ProjectBillability', 'AllocationStartDate', 'AllocationEndDate',
      'AssociateBillability', 'AllocationStatus', 'AllocationPercentage', 'ProjectRole',
      'OperationRole', 'OffShoreOnsite', 'Country', 'City', 'LocationDescription',
      'ManagerID', 'ManagerName', 'SupervisorID', 'SupervisorName', 'BillabilityReason',
      'PrimaryStateTag', 'SecondaryStateTag'
    ];
    
    // Filter headers to only include those in the predefined business columns
    const validHeaders = headers.filter(header => PREDEFINED_BUSINESS_COLUMNS.includes(header));
    const invalidHeaders = headers.filter(header => !PREDEFINED_BUSINESS_COLUMNS.includes(header));
    
    if (invalidHeaders.length > 0) {
      logger.warn(correlationId, 'NEW_ALLOCATIONS', 'COLUMN_FILTERING', `Ignoring ${invalidHeaders.length} extra columns from spreadsheet`, {
        invalidHeaders
      });
    }

    // Prepare records for insertion using only valid headers
    const records = filteredData.map((record, index) => {
      const newRecord = {
        upload_timestamp: new Date().toISOString(),
        file_name: fileName,
        headers: JSON.stringify(validHeaders), // Store only valid headers
        original_row_index: index
      };

      // Apply date conversion to the entire record first
      const dateConvertedRecord = convertDateFieldsInRecord(record);
      
      // Map only the valid business columns from the converted record
      validHeaders.forEach((header) => {
        const value = dateConvertedRecord[header];
        
        if (value !== null && value !== undefined && value !== '' && value.toString().trim() !== '') {
          newRecord[header] = value;
        } else {
          newRecord[header] = null; // Use null for SQLite consistency
        }
      });

      return newRecord;
    });

    // Insert all records
    const newDocs = [];
    for (const record of records) {
      const doc = await db.insertNewAllocation(record);
      newDocs.push(doc);
    }

    logger.info(correlationId, 'NEW_ALLOCATIONS', 'UPLOAD_COMPLETE', 'New allocation data upload complete', {
      recordsInserted: newDocs.length,
      validColumns: validHeaders.length,
      ignoredColumns: invalidHeaders.length
    });

    res.json({
      success: true,
      message: `Successfully uploaded ${newDocs.length} new allocation records with ${validHeaders.length} valid columns`,
      recordCount: newDocs.length,
      fileName: fileName,
      headers: validHeaders, // Return only valid headers
      totalSpreadsheetColumns: headers.length,
      validColumns: validHeaders.length,
      ignoredColumns: invalidHeaders.length,
      ignoredColumnNames: invalidHeaders
    });

  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'UPLOAD_ERROR', 'New allocation data upload failed', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Get all new allocation data
router.get('/', async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || 'unknown';
  
  try {
    await db.ensureInitialized();
    
    const docs = await db.findNewAllocations({});
    
    logger.info(correlationId, 'NEW_ALLOCATIONS', 'GET_DATA', 'Retrieved new allocation data', {
      recordCount: docs.length
    });

    // Define system columns to exclude from UI
    const systemColumns = [
      'id', 'upload_timestamp', 'file_name', 'headers', 
      'original_row_index', 'created_at'
    ];

    // Filter out system columns and apply date formatting
    const filteredDocs = docs.map(doc => {
      const filtered = {};
      Object.keys(doc).forEach(key => {
        if (!systemColumns.includes(key)) {
          let value = doc[key];
          // Apply date formatting for date columns in the response
          if (isDateColumn(key) && value !== null && value !== undefined && value !== '') {
            value = formatDateToMMDDYYYY(value) || value;
          }
          filtered[key] = value;
        }
      });
      // Keep the id for update operations but rename it
      filtered._id = doc.id;
      return filtered;
    });

    res.json({
      success: true,
      data: filteredDocs,
      count: filteredDocs.length
    });

  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'GET_ERROR', 'Failed to retrieve new allocation data', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get statistics about new allocation data
router.get('/stats', async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || 'unknown';
  
  try {
    await db.ensureInitialized();
    const docs = await db.findNewAllocations({});
    
    const totalRecords = docs.length;
    
    // Get upload info from the most recent record
    const uploadInfo = docs.length > 0 ? {
      fileName: docs[0].file_name,
      uploadTimestamp: docs[0].upload_timestamp,
      headers: docs[0].headers ? JSON.parse(docs[0].headers) : null
    } : null;

    logger.info(correlationId, 'NEW_ALLOCATIONS', 'STATS_GENERATED', 'Statistics generated', {
      totalRecords
    });

    res.json({
      success: true,
      data: {
        totalRecords,
        lastUpload: uploadInfo
      }
    });
  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'STATS_ERROR', 'Failed to generate statistics', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Clear all new allocation data
router.post('/clear', async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || 'unknown';
  
  try {
    await db.ensureInitialized();
    
    const result = await db.removeNewAllocation({});

    logger.info(correlationId, 'NEW_ALLOCATIONS', 'DATA_CLEARED', 'All new allocation data cleared', {
      deletedCount: result.deletedCount || 0
    });

    res.json({
      success: true,
      message: `Successfully cleared all new allocation data`,
      deletedCount: result.deletedCount || 0
    });

  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'CLEAR_ERROR', 'Failed to clear new allocation data', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear new allocation data',
      error: error.message
    });
  }
});

// Save new allocation headers
router.post('/save-headers', async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || 'unknown';
  
  try {
    await db.ensureInitialized();
    const { headers } = req.body;

    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid headers format'
      });
    }

    // Save headers to a simple JSON file
    const fs = require('fs');
    const path = require('path');
    const headersPath = path.join(__dirname, '../data/new_allocation_headers.json');
    
    fs.writeFileSync(headersPath, JSON.stringify(headers));

    logger.info(correlationId, 'NEW_ALLOCATIONS', 'HEADERS_SAVED', 'Headers saved successfully');

    res.json({
      success: true,
      message: 'Headers saved successfully'
    });

  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'SAVE_HEADERS_ERROR', 'Failed to save headers', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save headers',
      error: error.message
    });
  }
});

// Get saved new allocation headers
router.get('/saved-headers', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const headersPath = path.join(__dirname, '../data/new_allocation_headers.json');
    
    if (fs.existsSync(headersPath)) {
      const headers = JSON.parse(fs.readFileSync(headersPath, 'utf8'));
      res.json({
        success: true,
        headers: headers
      });
    } else {
      res.json({
        success: true,
        headers: null
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load saved headers',
      error: error.message
    });
  }
});

// Analytics endpoints for billable resources
router.get('/analytics/billable', async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || 'unknown';
  
  try {
    await db.ensureInitialized();
    const docs = await db.findNewAllocations({});
    
    // Group by billability status
    const billableStats = {};
    docs.forEach(record => {
      const billability = record.AssociateBillability || 'Unknown';
      billableStats[billability] = (billableStats[billability] || 0) + 1;
    });

    // Calculate percentages
    const total = docs.length;
    const analytics = Object.keys(billableStats).map(status => ({
      status,
      count: billableStats[status],
      percentage: total > 0 ? ((billableStats[status] / total) * 100).toFixed(1) : 0
    }));

    logger.info(correlationId, 'NEW_ALLOCATIONS', 'BILLABLE_ANALYTICS', 'Billable analytics generated');

    res.json({
      success: true,
      data: {
        totalRecords: total,
        billableBreakdown: analytics,
        summary: billableStats
      }
    });

  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'BILLABLE_ANALYTICS_ERROR', 'Failed to generate billable analytics', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate billable analytics',
      error: error.message
    });
  }
});

// Analytics endpoints for grade distribution
router.get('/analytics/grades', async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || 'unknown';
  
  try {
    await db.ensureInitialized();
    const docs = await db.findNewAllocations({});
    
    // Group by grade description
    const gradeStats = {};
    docs.forEach(record => {
      const grade = record.GradeDescription || 'Unknown';
      gradeStats[grade] = (gradeStats[grade] || 0) + 1;
    });

    // Calculate percentages and sort by count
    const total = docs.length;
    const analytics = Object.keys(gradeStats)
      .map(grade => ({
        grade,
        count: gradeStats[grade],
        percentage: total > 0 ? ((gradeStats[grade] / total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count);

    logger.info(correlationId, 'NEW_ALLOCATIONS', 'GRADE_ANALYTICS', 'Grade analytics generated');

    res.json({
      success: true,
      data: {
        totalRecords: total,
        gradeDistribution: analytics,
        summary: gradeStats
      }
    });

  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'GRADE_ANALYTICS_ERROR', 'Failed to generate grade analytics', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate grade analytics',
      error: error.message
    });
  }
});

module.exports = router;
