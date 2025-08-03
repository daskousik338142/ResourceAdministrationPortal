const db = require('./config/database');

async function populateNewAllocations() {
  try {
    await db.ensureInitialized();

    // Get some sample records from allocation_data to copy to new_allocations
    const allocationRecords = await db.findAllocationData({});

    if (allocationRecords.length === 0) {
      return;
    }

    // Take the first 5 records and modify them slightly for new allocations
    const newAllocations = allocationRecords.slice(0, 5).map((record, index) => {
      // Create a modified version of the record for new allocations
      const newRecord = { ...record };
      
      // Remove system fields
      delete newRecord.id;
      delete newRecord.created_at;
      
      // Modify some fields to indicate these are "new" allocations
      newRecord.AllocationStatus = 'P'; // Pending
      newRecord.AllocationPercentage = Math.floor(newRecord.AllocationPercentage * 0.8); // Reduce by 20%
      newRecord.file_name = 'New_Allocations_Sample.xlsx';
      newRecord.upload_timestamp = new Date().toISOString();
      newRecord.original_row_index = index;
      
      // Modify start date to be in the future
      const today = new Date();
      const futureDate = new Date(today.getTime() + (30 + index * 10) * 24 * 60 * 60 * 1000); // 30+ days in future
      newRecord.AllocationStartDate = futureDate.toLocaleDateString('en-US');
      
      return newRecord;
    });

    // Clear existing new allocations first
    await db.removeNewAllocation({});

    // Insert new allocation records
    for (let i = 0; i < newAllocations.length; i++) {
      const record = newAllocations[i];
      await db.insertNewAllocation(record);
    }

    // Verify the data was inserted
    const verifyRecords = await db.findNewAllocations({});
    
  } catch (error) {
    // Error handling - could log to file in production
  }
}

// Run the population script
populateNewAllocations().then(() => {
  process.exit(0);
}).catch((error) => {
  process.exit(1);
});
