const db = require('./config/database');
async function testUpdateFunctionality() {
  try {
    // Initialize database
    await db.ensureInitialized();
    // First, let's insert a test record if none exists
    const existingRecords = await db.findNBLRecords({});
    if (existingRecords.length === 0) {
      // Insert a test record
      const testRecord = {
        'Associate ID': 1234567,
        'Account ID': 1000001,
        'Account Name': 'Test Account',
        'Project ID': 2000001,
        'Project Description': 'Test Project',
        'Associate Name': 'Test, User',
        'Department Name': 'Test Department',
        'Project Billability': 'BFD',
        'On/Off': 'Onshore',
        'Grade Mapping': 'SA',
        'Assignment Start Date': '2025-01-01',
        'Percent Allocation': 100,
        'Primary State Tag': 'Allocated',
        'Secondary State Tag': null,
        'Service Line': 'Test Line',
        'Genc': null,
        'NBL Category': 'Billed',
        'NBL Secondary Category': 'Test Category',
        'Billable/ Release Date(MM/DD/YYYY)': '2025-01-01',
        'Remarks': 'Initial test record',
        upload_timestamp: new Date().toISOString(),
        file_name: 'test.xlsx'
      };
      const insertedRecord = db.insertNBLRecord(testRecord);
      // Verify insertion
      const verifyRecord = await db.findNBLRecord({ _id: insertedRecord._id });
    }
    // Get the first record for testing
    const records = await db.findNBLRecords({});
    if (records.length === 0) {
      return;
    }
    const testRecord = records[0];
    const recordId = testRecord._id;
    // Test 1: Update NBL Category
    const newCategory = 'NBL for month';
    const updateData1 = {
      'NBL Category': newCategory
    };
    const result1 = await db.updateNBLRecord({ _id: recordId }, updateData1);
    // Verify the update
    const updatedRecord1 = await db.findNBLRecord({ _id: recordId });
    // Test 2: Update Remarks
    const newRemarks = 'Updated remarks via test script - ' + new Date().toLocaleString();
    const updateData2 = {
      'Remarks': newRemarks
    };
    const result2 = await db.updateNBLRecord({ _id: recordId }, updateData2);
    // Verify the update
    const updatedRecord2 = await db.findNBLRecord({ _id: recordId });
    // Test 3: Update multiple fields
    const updateData3 = {
      'Project Billability': 'NBL',
      'On/Off': 'Offshore',
      'Percent Allocation': 75
    };
    const result3 = await db.updateNBLRecord({ _id: recordId }, updateData3);
    // Verify the update
    const updatedRecord3 = await db.findNBLRecord({ _id: recordId });
    const multiUpdateSuccess = 
      updatedRecord3['Project Billability'] === 'NBL' &&
      updatedRecord3['On/Off'] === 'Offshore' &&
      updatedRecord3['Percent Allocation'] === 75;
  } catch (error) {
  }
}
// Run the test
testUpdateFunctionality().then(() => {
  process.exit(0);
}).catch(error => {
  process.exit(1);
});
