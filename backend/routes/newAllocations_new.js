const express = require('express');
const router = express.Router();
const db = require('../config/database');
// Upload new allocation data
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
    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid headers format. Expected array of header names.'
      });
    }
    // Clear existing data before inserting new data
    const result = db.removeNewAllocation({});
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
      return nonEmptyPercentage >= 20;
    });
    // Prepare records for insertion
    const records = filteredData.map((record, index) => {
      const newRecord = {
        uploadTimestamp: new Date(),
        _uploadInfo: {
          fileName: fileName,
          headers: headers,
          originalRowIndex: index
        }
      };
      // Map each field from the original record with better empty value handling
      headers.forEach((header) => {
        const value = record[header];
        if (value !== null && value !== undefined && value !== '' && value.toString().trim() !== '') {
          newRecord[header] = value;
        } else {
          newRecord[header] = ''; // Use empty string instead of null for better frontend display
        }
      });
      return newRecord;
    });
    // Insert new records
    const newDocs = [];
    for (const record of records) {
      const newDoc = db.insertNewAllocation(record);
      newDocs.push(newDoc);
    }
    res.json({
      success: true,
      message: `Successfully uploaded ${newDocs.length} new allocation records`,
      recordCount: newDocs.length,
      fileName: fileName,
      headers: headers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});
// Get all new allocation data with proper sorting
router.get('/', async (req, res) => {
  try {
    await db.ensureInitialized();
    const docs = db.findNewAllocation({});
    // Sort by upload timestamp (most recent first)
    const sortedDocs = docs.sort((a, b) => 
      new Date(b.uploadTimestamp) - new Date(a.uploadTimestamp)
    );
    res.json({
      success: true,
      data: sortedDocs,
      count: sortedDocs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});
// Get new allocation data statistics
router.get('/stats', async (req, res) => {
  try {
    await db.ensureInitialized();
    const docs = db.findNewAllocation({});
    const stats = {
      totalRecords: docs.length,
      uploadInfo: docs.length > 0 ? docs[0]._uploadInfo : null,
      lastUpload: docs.length > 0 ? docs[0].uploadTimestamp : null
    };
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});
// Clear all new allocation data
router.delete('/clear', async (req, res) => {
  try {
    await db.ensureInitialized();
    const result = db.removeNewAllocation({});
    res.json({
      success: true,
      message: `Successfully cleared ${result.deletedCount} new allocation records`,
      recordsRemoved: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});
// Save headers
router.post('/headers', (req, res) => {
  try {
    const { headers } = req.body;
    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid headers format'
      });
    }
    // Headers are saved as part of the upload process
    res.json({
      success: true,
      message: 'Headers saved successfully',
      headers: headers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});
// Get billable/non-billable analytics for new allocations
router.get('/analytics/billable', async (req, res) => {
  try {
    await db.ensureInitialized();
    const docs = db.findNewAllocation({});
    const analytics = {
      billable: 0,
      nonBillable: 0,
      unknown: 0
    };
    docs.forEach(doc => {
      // Check multiple possible field names for project billability
      const projectBillability = doc.ProjectBillability || doc.projectBillability || doc.projectbillability || 
                                doc['Project Billability'] || doc.Billability || doc.billability || '';
      const billabilityStr = projectBillability.toString().toUpperCase().trim();
      if (billabilityStr === 'BFD' || billabilityStr === 'BTM') {
        analytics.billable++;
      } else if (billabilityStr === 'NBL') {
        analytics.nonBillable++;
      } else {
        analytics.unknown++;
      }
    });
    res.json({
      success: true,
      analytics: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});
// Get grade description analytics for new allocations
router.get('/analytics/grades', async (req, res) => {
  try {
    await db.ensureInitialized();
    const docs = db.findNewAllocation({});
    const gradeAnalytics = {};
    docs.forEach(doc => {
      const gradeDesc = doc.GradeDescription || doc.gradeDescription || doc['Grade Description'] || 'Unknown';
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
      } else if (gradeKey === 'Business Associate 60') {
        gradeKey = 'BA';
      }
      if (gradeAnalytics[gradeKey]) {
        gradeAnalytics[gradeKey]++;
      } else {
        gradeAnalytics[gradeKey] = 1;
      }
    });
    // Sort by count descending
    const sortedGrades = Object.entries(gradeAnalytics)
      .sort(([,a], [,b]) => b - a)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
    res.json({
      success: true,
      analytics: sortedGrades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});
module.exports = router;
