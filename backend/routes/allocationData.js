const express = require('express');
const router = express.Router();
const Datastore = require('@seald-io/nedb');
const path = require('path');

// Initialize AllocationData database
const allocationDataDb = new Datastore({
  filename: path.join(__dirname, '../data/allocationdata.db'),
  autoload: true
});

// Create indexes for better performance
allocationDataDb.ensureIndex({ fieldName: 'uploadTimestamp' });
allocationDataDb.ensureIndex({ fieldName: '_uploadInfo.fileName' });

// Upload allocation data
router.post('/upload', (req, res) => {
  try {
    const { data, fileName, headers } = req.body;

    console.log('Allocation Data Upload Request:');
    console.log('- File Name:', fileName);
    console.log('- Headers:', headers);
    console.log('- Data rows:', data ? data.length : 0);

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
    allocationDataDb.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) {
        console.error('Error clearing existing allocation data:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to clear existing data: ' + err.message
        });
      }

      console.log(`Cleared ${numRemoved} existing allocation records`);

      // Filter out records that are mostly empty (more than 50% empty values)
      const filteredData = data.filter(record => {
        const values = Object.values(record);
        const nonEmptyValues = values.filter(value => 
          value !== null && 
          value !== undefined && 
          value !== '' && 
          value.toString().trim() !== ''
        );
        
        // Keep records that have at least 20% non-empty values (less aggressive filtering)
        const nonEmptyPercentage = (nonEmptyValues.length / values.length) * 100;
        console.log(`Allocation Record has ${nonEmptyPercentage.toFixed(1)}% non-empty values`);
        return nonEmptyPercentage >= 20;
      });

      console.log(`Filtered ${data.length} allocation records down to ${filteredData.length} quality records`);

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
      allocationDataDb.insert(records, (err, newDocs) => {
        if (err) {
          console.error('Error inserting allocation data:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to save allocation data: ' + err.message
          });
        }

        console.log(`Successfully inserted ${newDocs.length} allocation records`);

        res.json({
          success: true,
          message: `Successfully uploaded ${newDocs.length} allocation records`,
          recordCount: newDocs.length,
          fileName: fileName,
          headers: headers
        });
      });
    });

  } catch (error) {
    console.error('Allocation data upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Get all allocation data
router.get('/', (req, res) => {
  try {
    allocationDataDb.find({}).sort({ uploadTimestamp: -1 }).exec((err, docs) => {
      if (err) {
        console.error('Error fetching allocation data:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch allocation data: ' + err.message
        });
      }

      res.json({
        success: true,
        data: docs,
        count: docs.length
      });
    });
  } catch (error) {
    console.error('Error in allocation data GET route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Get allocation data statistics
router.get('/stats', (req, res) => {
  try {
    allocationDataDb.find({}, (err, docs) => {
      if (err) {
        console.error('Error fetching allocation data stats:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch allocation data statistics: ' + err.message
        });
      }

      const stats = {
        totalRecords: docs.length,
        uploadInfo: docs.length > 0 ? docs[0]._uploadInfo : null,
        lastUpload: docs.length > 0 ? docs[0].uploadTimestamp : null
      };

      res.json({
        success: true,
        stats: stats
      });
    });
  } catch (error) {
    console.error('Error in allocation data stats route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Clear all allocation data
router.delete('/clear', (req, res) => {
  try {
    allocationDataDb.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) {
        console.error('Error clearing allocation data:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to clear allocation data: ' + err.message
        });
      }

      console.log(`Cleared ${numRemoved} allocation records`);

      res.json({
        success: true,
        message: `Successfully cleared ${numRemoved} allocation records`,
        recordsRemoved: numRemoved
      });
    });
  } catch (error) {
    console.error('Error in allocation data clear route:', error);
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
    console.error('Error saving allocation headers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Get billable/non-billable analytics
router.get('/analytics/billable', (req, res) => {
  try {
    allocationDataDb.find({}, (err, docs) => {
      if (err) {
        console.error('Error fetching billable analytics:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch billable analytics: ' + err.message
        });
      }

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
    });
  } catch (error) {
    console.error('Error in billable analytics route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Get grade description analytics
router.get('/analytics/grades', (req, res) => {
  try {
    allocationDataDb.find({}, (err, docs) => {
      if (err) {
        console.error('Error fetching grade analytics:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch grade analytics: ' + err.message
        });
      }

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
        } else if (gradeKey === '') {
          gradeKey = 'Unknown';
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
    });
  } catch (error) {
    console.error('Error in grade analytics route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

module.exports = router;
