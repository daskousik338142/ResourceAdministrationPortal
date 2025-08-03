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
    const stmt = db.db.prepare(query);
    const results = stmt.all();
    
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
    const deleteStmt = db.db.prepare('DELETE FROM allocation_data');
    deleteStmt.run();
    
    // Insert new data
    const insertStmt = db.db.prepare(`
      INSERT INTO allocation_data (
        employee_name, employee_id, project_name, allocation_percentage,
        start_date, end_date, role, skills, department, manager,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    let insertedCount = 0;
    for (const row of data) {
      try {
        // Convert date fields before inserting
        const convertedRow = convertDateFieldsInRecord(row);
        
        insertStmt.run([
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

// DELETE /api/allocation-data/clear - Clear all allocation data
router.delete('/clear', async (req, res) => {
  const correlationId = req.correlationId || logger.generateCorrelationId();
  
  try {
    await db.ensureInitialized();
    
    const deleteStmt = db.db.prepare('DELETE FROM allocation_data');
    const result = deleteStmt.run();
    
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

// GET /api/allocation-data/headers - Get expected headers for Excel upload
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

module.exports = router;
