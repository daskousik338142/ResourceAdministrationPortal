const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');
const multer = require('multer');
const xlsx = require('xlsx');
const { convertDateFieldsInRecord } = require('../utils/dateUtils');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) and CSV files are allowed.'));
    }
  }
});

// GET /api/allocation-data - Get all allocation data
router.get('/', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    const query = `SELECT * FROM allocation_data ORDER BY created_at DESC`;
    const results = db.all(query);
    
    logger.info(correlationId, 'ALLOCATION_DATA', 'GET_ALL', 'Retrieved allocation data', {
      count: results.length
    });
    
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    logger.error(correlationId, 'ALLOCATION_DATA', 'GET_ALL', 'Error retrieving allocation data', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving allocation data',
      error: error.message
    });
  }
});

// POST /api/allocation-data/upload - Upload and process Excel file
router.post('/upload', upload.single('file'), async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    await db.ensureInitialized();
    
    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found in the uploaded file'
      });
    }

    // Clear existing data
    db.run('DELETE FROM allocation_data');
    
    // Insert new data
    let insertedCount = 0;
    for (const row of data) {
      try {
        // Convert date fields before inserting
        const convertedRow = convertDateFieldsInRecord(row);
        
        db.run(`
          INSERT INTO allocation_data (
            employee_name, employee_id, project_name, allocation_percentage,
            start_date, end_date, role, skills, department, manager,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          convertedRow['Employee Name'] || convertedRow.employee_name || '',
          convertedRow['Employee ID'] || convertedRow.employee_id || '',
          convertedRow['Project Name'] || convertedRow.project_name || '',
          convertedRow['Allocation %'] || convertedRow.allocation_percentage || 0,
          convertedRow['Start Date'] || convertedRow.start_date || '',
          convertedRow['End Date'] || convertedRow.end_date || '',
          convertedRow['Role'] || convertedRow.role || '',
          convertedRow['Skills'] || convertedRow.skills || '',
          convertedRow['Department'] || convertedRow.department || '',
          convertedRow['Manager'] || convertedRow.manager || ''
        ]);
        insertedCount++;
      } catch (error) {
        logger.error(correlationId, 'ALLOCATION_DATA', 'INSERT_ROW', 'Error inserting row', error, { row });
      }
    }
    
    logger.info(correlationId, 'ALLOCATION_DATA', 'UPLOAD', 'File processed successfully', {
      totalRows: data.length,
      insertedRows: insertedCount,
      filename: req.file.originalname
    });
    
    res.json({
      success: true,
      message: 'File uploaded and processed successfully',
      data: {
        totalRows: data.length,
        insertedRows: insertedCount,
        filename: req.file.originalname
      }
    });
  } catch (error) {
    logger.error(correlationId, 'ALLOCATION_DATA', 'UPLOAD', 'Error processing file', error);
    res.status(500).json({
      success: false,
      message: 'Error processing file',
      error: error.message
    });
  }
});

// POST /api/allocation-data/upload-json - Upload allocation data in JSON format
router.post('/upload-json', async (req, res) => {
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

    // Clear existing data
    db.run('DELETE FROM allocation_data');
    
    // Use all data without filtering
    const filteredData = data;
    
    // Insert new data
    let insertedCount = 0;
    
    for (const record of filteredData) {
      try {
        // Convert date fields before inserting
        const convertedRecord = convertDateFieldsInRecord(record);
        
        // Build dynamic insert based on available columns
        const columns = [
          'CustomerID', 'CustomerName', 'AssociateID', 'AssociateName', 'Designation',
          'GradeDescription', 'DepartmentID', 'DepartmentName', 'ProjectID', 'ProjectName',
          'ProjectType', 'ProjectBillability', 'AllocationStartDate', 'AllocationEndDate',
          'AssociateBillability', 'AllocationStatus', 'AllocationPercentage', 'ProjectRole',
          'OperationRole', 'OffShoreOnsite', 'Country', 'City', 'LocationDescription',
          'ManagerID', 'ManagerName', 'SupervisorID', 'SupervisorName', 'BillabilityReason',
          'PrimaryStateTag', 'SecondaryStateTag'
        ];
        
        const values = columns.map(col => convertedRecord[col] || '');
        const placeholders = columns.map(() => '?').join(', ');
        const columnNames = columns.join(', ');
        
        db.run(`
          INSERT INTO allocation_data (
            ${columnNames}, created_at, updated_at
          ) VALUES (${placeholders}, datetime('now'), datetime('now'))
        `, values);
        insertedCount++;
      } catch (error) {
        logger.error(correlationId, 'ALLOCATION_DATA', 'INSERT_ROW', 'Error inserting row', error, { record });
      }
    }
    
    logger.info(correlationId, 'ALLOCATION_DATA', 'UPLOAD_JSON', 'Data uploaded successfully', {
      fileName,
      totalRecords: data.length,
      filteredRecords: filteredData.length,
      insertedRecords: insertedCount
    });

    res.json({
      success: true,
      message: `Successfully uploaded ${insertedCount} allocation records`,
      recordCount: insertedCount,
      fileName: fileName,
      headers: headers
    });
  } catch (error) {
    logger.error(correlationId, 'ALLOCATION_DATA', 'UPLOAD_JSON', 'Error uploading allocation data', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading allocation data',
      error: error.message
    });
  }
});

// DELETE /api/allocation-data/clear - Clear all allocation data
router.delete('/clear', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    const result = db.run('DELETE FROM allocation_data');
    
    logger.info(correlationId, 'ALLOCATION_DATA', 'CLEAR', 'Allocation data cleared', {
      deletedRows: result.changes
    });
    
    res.json({
      success: true,
      message: 'All allocation data cleared successfully',
      deletedRows: result.changes
    });
  } catch (error) {
    logger.error(correlationId, 'ALLOCATION_DATA', 'CLEAR', 'Error clearing allocation data', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing allocation data',
      error: error.message
    });
  }
});

// GET /api/allocation-data/stats - Get statistics about allocation data
router.get('/stats', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    const countResult = db.get('SELECT COUNT(*) as total FROM allocation_data');
    const totalRecords = countResult ? countResult.total : 0;
    
    // Get latest upload info
    const latestResult = db.get('SELECT created_at FROM allocation_data ORDER BY created_at DESC LIMIT 1');
    
    logger.info(correlationId, 'ALLOCATION_DATA', 'STATS', 'Retrieved allocation data stats', {
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
    logger.error(correlationId, 'ALLOCATION_DATA', 'STATS', 'Error getting allocation data stats', error);
    res.status(500).json({
      success: false,
      message: 'Error getting allocation data statistics',
      error: error.message
    });
  }
});

// POST /api/allocation-data/upload-data - Upload allocation data in JSON format (for frontend)
router.post('/upload-data', async (req, res) => {
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

    logger.info(correlationId, 'ALLOCATION_DATA', 'UPLOAD_DATA', 'Starting data upload', {
      fileName,
      totalRecords: data.length,
      headers: headers.slice(0, 5) // Log first 5 headers for debugging
    });

    // Clear existing data first
    db.run('DELETE FROM allocation_data');
    
    // Use all data without backend filtering
    const filteredData = data;
    
    logger.info(correlationId, 'ALLOCATION_DATA', 'UPLOAD_DATA', 'Processing data', {
      originalCount: data.length,
      processedCount: filteredData.length
    });
    
    // Insert new data using dynamic column insertion
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
        
        const sql = `INSERT INTO allocation_data (${columns}, created_at, updated_at) VALUES (${placeholders}, ?, ?)`;
        
        db.run(sql, [...values, timestamp, timestamp]);
        insertedCount++;
        
      } catch (insertError) {
        logger.error(correlationId, 'ALLOCATION_DATA', 'INSERT_ROW', 'Error inserting row', insertError, { record });
      }
    }
    
    logger.info(correlationId, 'ALLOCATION_DATA', 'UPLOAD_DATA', 'Data uploaded successfully', {
      fileName,
      totalRecords: data.length,
      filteredRecords: filteredData.length,
      insertedRecords: insertedCount
    });

    res.json({
      success: true,
      message: `Successfully uploaded ${insertedCount} allocation records`,
      recordCount: insertedCount,
      fileName: fileName,
      headers: headers
    });
  } catch (error) {
    logger.error(correlationId, 'ALLOCATION_DATA', 'UPLOAD_DATA', 'Error uploading allocation data', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading allocation data',
      error: error.message
    });
  }
});

// GET /api/allocation-data/headers - Get expected headers for Excel upload
router.get('/headers', (req, res) => {
  const headers = [
    'CustomerID', 'CustomerName', 'AssociateID', 'AssociateName', 'Designation',
    'GradeDescription', 'DepartmentID', 'DepartmentName', 'ProjectID', 'ProjectName',
    'ProjectType', 'ProjectBillability', 'AllocationStartDate', 'AllocationEndDate',
    'AssociateBillability', 'AllocationStatus', 'AllocationPercentage', 'ProjectRole',
    'OperationRole', 'OffShoreOnsite', 'Country', 'City', 'LocationDescription',
    'ManagerID', 'ManagerName', 'SupervisorID', 'SupervisorName', 'BillabilityReason',
    'PrimaryStateTag', 'SecondaryStateTag'
  ];
  
  res.json({
    success: true,
    headers: headers
  });
});

// POST /api/allocation-data/headers - Save headers for allocation data
router.post('/headers', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    const { headers } = req.body;
    
    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid headers format. Expected array of header names.'
      });
    }
    
    logger.info(correlationId, 'ALLOCATION_DATA', 'SAVE_HEADERS', 'Headers saved successfully', {
      headerCount: headers.length,
      headers: headers.slice(0, 5) // Log first 5 headers for debugging
    });
    
    res.json({
      success: true,
      message: 'Headers saved successfully',
      headers: headers
    });
  } catch (error) {
    logger.error(correlationId, 'ALLOCATION_DATA', 'SAVE_HEADERS', 'Error saving headers', error);
    res.status(500).json({
      success: false,
      message: 'Error saving headers',
      error: error.message
    });
  }
});

// GET /api/allocation-data/billable-analytics - Get billable analytics for allocation data
router.get('/billable-analytics', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    // Get billable analytics based on ProjectBillability column
    const billableResults = db.all(`
      SELECT 
        ProjectBillability,
        COUNT(*) as count
      FROM allocation_data 
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
    
    logger.info(correlationId, 'ALLOCATION_DATA', 'BILLABLE_ANALYTICS', 'Retrieved billable analytics', analytics);
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error(correlationId, 'ALLOCATION_DATA', 'BILLABLE_ANALYTICS', 'Error getting billable analytics', error);
    res.status(500).json({
      success: false,
      message: 'Error getting billable analytics',
      error: error.message
    });
  }
});

// GET /api/allocation-data/grade-analytics - Get grade analytics for allocation data
router.get('/grade-analytics', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    // Get grade analytics based on GradeDescription column
    const gradeResults = db.all(`
      SELECT 
        GradeDescription,
        COUNT(*) as count
      FROM allocation_data 
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
    
    logger.info(correlationId, 'ALLOCATION_DATA', 'GRADE_ANALYTICS', 'Retrieved grade analytics', { gradeCount: Object.keys(analytics).length });
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error(correlationId, 'ALLOCATION_DATA', 'GRADE_ANALYTICS', 'Error getting grade analytics', error);
    res.status(500).json({
      success: false,
      message: 'Error getting grade analytics',
      error: error.message
    });
  }
});

// GET /api/allocation-data/offshore-analytics - Get offshore/onshore analytics for allocation data
router.get('/offshore-analytics', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    // Get offshore/onshore analytics based on OffShoreOnsite column
    const offshoreResults = db.all(`
      SELECT 
        OffShoreOnsite,
        COUNT(*) as count
      FROM allocation_data 
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
    
    logger.info(correlationId, 'ALLOCATION_DATA', 'OFFSHORE_ANALYTICS', 'Retrieved offshore analytics', analytics);
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error(correlationId, 'ALLOCATION_DATA', 'OFFSHORE_ANALYTICS', 'Error getting offshore analytics', error);
    res.status(500).json({
      success: false,
      message: 'Error getting offshore analytics',
      error: error.message
    });
  }
});

module.exports = router;
