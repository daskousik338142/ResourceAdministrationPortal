const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');
const { convertDateFieldsInRecord } = require('../utils/dateUtils');

// GET /api/new-allocations - Get all new allocation data
router.get('/', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    const query = `SELECT * FROM new_allocations ORDER BY created_at DESC`;
    const results = db.all(query);
    
    logger.info(correlationId, 'NEW_ALLOCATIONS', 'GET_ALL', 'Retrieved new allocation data', {
      count: results.length
    });
    
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'GET_ALL', 'Error retrieving new allocation data', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving new allocation data',
      error: error.message
    });
  }
});

// POST /api/new-allocations/upload - Upload new allocation data
router.post('/upload', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    const { data, fileName, headers } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of records.'
      });
    }

    if (!headers || !Array.isArray(headers)) {
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

    // Clear existing data
    db.run('DELETE FROM new_allocations');
    
    // Use all data without filtering
    const filteredData = data;
    
    // Insert new data using all columns dynamically
    let insertedCount = 0;
    const timestamp = new Date().toISOString();
    
    for (const record of filteredData) {
      try {
        // Convert date fields before inserting
        const convertedRecord = convertDateFieldsInRecord(record);
        
        // Create dynamic insert query using all record keys
        const columns = Object.keys(convertedRecord).join(', ');
        const placeholders = Object.keys(convertedRecord).map(() => '?').join(', ');
        const values = Object.values(convertedRecord);
        
        const sql = `INSERT INTO new_allocations (${columns}, created_at, updated_at) VALUES (${placeholders}, ?, ?)`;
        
        db.run(sql, [...values, timestamp, timestamp]);
        insertedCount++;
        
      } catch (insertError) {
        logger.error(correlationId, 'NEW_ALLOCATIONS', 'INSERT_ROW', 'Error inserting row', insertError, { record });
      }
    }
    
    logger.info(correlationId, 'NEW_ALLOCATIONS', 'UPLOAD_JSON', 'Data uploaded successfully', {
      fileName,
      totalRecords: data.length,
      processedRecords: filteredData.length,
      insertedRecords: insertedCount
    });

    res.json({
      success: true,
      message: `Successfully uploaded ${insertedCount} new allocation records`,
      recordCount: insertedCount,
      fileName: fileName,
      headers: headers
    });
  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'UPLOAD', 'Error uploading new allocation data', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading new allocation data',
      error: error.message
    });
  }
});

// DELETE /api/new-allocations/clear - Clear all new allocation data
router.delete('/clear', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    const result = db.run('DELETE FROM new_allocations');
    
    logger.info(correlationId, 'NEW_ALLOCATIONS', 'CLEAR', 'New allocation data cleared', {
      deletedRows: result.changes
    });
    
    res.json({
      success: true,
      message: 'All new allocation data cleared successfully',
      deletedRows: result.changes
    });
  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'CLEAR', 'Error clearing new allocation data', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing new allocation data',
      error: error.message
    });
  }
});

// GET /api/new-allocations/stats - Get statistics about new allocation data
router.get('/stats', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    const countResult = db.get('SELECT COUNT(*) as total FROM new_allocations');
    const totalRecords = countResult ? countResult.total : 0;
    
    // Get latest upload info
    const latestResult = db.get('SELECT created_at FROM new_allocations ORDER BY created_at DESC LIMIT 1');
    
    logger.info(correlationId, 'NEW_ALLOCATIONS', 'STATS', 'Retrieved new allocation data stats', {
      totalRecords
    });
    
    res.json({
      success: true,
      stats: {
        totalRecords,
        lastUpload: latestResult ? latestResult.created_at : null
      }
    });
  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'STATS', 'Error getting new allocation data stats', error);
    res.status(500).json({
      success: false,
      message: 'Error getting new allocation data statistics',
      error: error.message
    });
  }
});

// GET /api/new-allocations/headers - Get expected headers for Excel upload
router.get('/headers', (req, res) => {
  const headers = [
    'Employee Name',
    'Employee ID', 
    'Project Name',
    'Allocation %',
    'Start Date',
    'End Date',
    'Role',
    'Skills',
    'Department',
    'Manager'
  ];
  
  res.json({
    success: true,
    headers: headers
  });
});

// GET /api/new-allocations/billable-analytics - Get billable analytics for new allocation data
router.get('/billable-analytics', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    // Get billable analytics based on ProjectBillability column
    const billableResults = db.all(`
      SELECT 
        ProjectBillability,
        COUNT(*) as count
      FROM new_allocations 
      WHERE ProjectBillability IS NOT NULL 
      GROUP BY ProjectBillability
    `);
    
    // Initialize analytics object
    const analytics = { billable: 0, nonBillable: 0, unknown: 0 };
    
    // Process results
    billableResults.forEach(result => {
      const billability = (result.ProjectBillability || '').trim();
      if (billability.includes('BFD') || billability.includes('BTM')) {
        analytics.billable += result.count;
      } else if (billability.includes('NBL') || billability.includes('')) {
        analytics.nonBillable += result.count;
      }
    });
    
    logger.info(correlationId, 'NEW_ALLOCATIONS', 'BILLABLE_ANALYTICS', 'Retrieved billable analytics', analytics);
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'BILLABLE_ANALYTICS', 'Error getting billable analytics', error);
    res.status(500).json({
      success: false,
      message: 'Error getting billable analytics',
      error: error.message
    });
  }
});

// GET /api/new-allocations/grade-analytics - Get grade analytics for new allocation data
router.get('/grade-analytics', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    // Get grade analytics based on GradeDescription column
    const gradeResults = db.all(`
      SELECT 
        GradeDescription,
        COUNT(*) as count
      FROM new_allocations 
      WHERE GradeDescription IS NOT NULL AND GradeDescription != ''
      GROUP BY GradeDescription
      ORDER BY count DESC
    `);
    
    // Convert to analytics object with grade mapping
    const analytics = {};
    gradeResults.forEach(result => {
      const gradeDesc = result.GradeDescription || 'Unknown';
      let gradeKey = gradeDesc.toString().trim();
      
      // Group and relabel grades according to business rules
      if (gradeKey === 'Existing - PA & e' || gradeKey === 'Existing - A & e' || gradeKey === 'Existing - PAT & e') {
        gradeKey = 'PAT,PA,A';
      } else if (gradeKey === 'Existing - SA & e') {
        gradeKey = 'Senior Associate';
      } else if (gradeKey === 'Existing-M&e') {
        gradeKey = 'Manager';
      } else if (gradeKey === 'Existing-SM&e' || gradeKey === 'Existing-AD&e') {
        gradeKey = 'Senior Manager +';
      } else if (gradeKey.includes('Business Associate')) {
        gradeKey = 'BA';
      }
      
      if (analytics[gradeKey]) {
        analytics[gradeKey] += result.count;
      } else {
        analytics[gradeKey] = result.count;
      }
    });
    
    logger.info(correlationId, 'NEW_ALLOCATIONS', 'GRADE_ANALYTICS', 'Retrieved grade analytics', { gradeCount: Object.keys(analytics).length });
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'GRADE_ANALYTICS', 'Error getting grade analytics', error);
    res.status(500).json({
      success: false,
      message: 'Error getting grade analytics',
      error: error.message
    });
  }
});

// GET /api/new-allocations/offshore-analytics - Get offshore/onshore analytics for new allocation data
router.get('/offshore-analytics', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    // Get offshore/onshore analytics based on OffShoreOnsite column
    const offshoreResults = db.all(`
      SELECT 
        OffShoreOnsite,
        COUNT(*) as count
      FROM new_allocations 
      WHERE OffShoreOnsite IS NOT NULL 
      GROUP BY OffShoreOnsite
    `);
    
    // Initialize analytics object
    const analytics = { offshore: 0, onshore: 0, unknown: 0, ratio: '0%' };
    
    // Process results
    offshoreResults.forEach(result => {
      const location = (result.OffShoreOnsite || '').toLowerCase().trim();
      if (location.includes('offshore') || location === 'off' || location === 'of') {
        analytics.offshore += result.count;
      } else if (location.includes('onshore') || location === 'on') {
        analytics.onshore += result.count;
      } else {
        analytics.unknown += result.count;
      }
    });
    
    // Calculate ratio using formula: (onshore * 100) / total offshore
    if (analytics.offshore > 0) {
      const ratio = (analytics.onshore * 100) / analytics.offshore;
      analytics.ratio = `${ratio.toFixed(1)}%`;
    } else if (analytics.onshore > 0) {
      analytics.ratio = '∞%'; // Infinite when there's onshore but no offshore
    } else {
      analytics.ratio = '0%';
    }
    
    logger.info(correlationId, 'NEW_ALLOCATIONS', 'OFFSHORE_ANALYTICS', 'Retrieved offshore analytics', analytics);
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error(correlationId, 'NEW_ALLOCATIONS', 'OFFSHORE_ANALYTICS', 'Error getting offshore analytics', error);
    res.status(500).json({
      success: false,
      message: 'Error getting offshore analytics',
      error: error.message
    });
  }
});

module.exports = router;
