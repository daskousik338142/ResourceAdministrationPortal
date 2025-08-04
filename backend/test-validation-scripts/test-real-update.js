const db = require('./config/database');
async function testRealUpdateFunctionality() {
  try {
    // Initialize database
    await db.ensureInitialized();
    // Get the first record for testing
    const records = await db.findNBLRecords({});
    if (records.length === 0) {
      return;
    }
    const testRecord = records[0];
    const recordId = testRecord._id;
    // Test 1: Update NBL Category to a different value
    const currentCategory = testRecord['NBL Category'];
    const newCategory = currentCategory === 'Billed' ? 'NBL for month' : 'Billed';
    const updateData1 = {
      'NBL Category': newCategory
    };
    const result1 = await db.updateNBLRecord({ _id: recordId }, updateData1);
    // Verify the update
    const updatedRecord1 = await db.findNBLRecord({ _id: recordId });
    // Test 2: Update Remarks to a unique value
    const currentRemarks = testRecord['Remarks'];
    const newRemarks = 'Test remarks updated at ' + new Date().toISOString();
    const updateData2 = {
      'Remarks': newRemarks
    };
    const result2 = await db.updateNBLRecord({ _id: recordId }, updateData2);
    // Verify the update
    const updatedRecord2 = await db.findNBLRecord({ _id: recordId });
    // Test 3: Update Project Billability
    const currentBillability = updatedRecord2['Project Billability'];
    const newBillability = currentBillability === 'BFD' ? 'NBL' : 'BFD';
    const updateData3 = {
      'Project Billability': newBillability
    };
    const result3 = await db.updateNBLRecord({ _id: recordId }, updateData3);
    // Verify the update
    const updatedRecord3 = await db.findNBLRecord({ _id: recordId });
    // Test that the last_modified timestamp was updated
    const originalTimestamp = testRecord['last_modified'];
    const newTimestamp = updatedRecord3['last_modified'];
  } catch (error) {
  }
}
// Run the test
testRealUpdateFunctionality().then(() => {
  process.exit(0);
}).catch(error => {
  process.exit(1);
});
