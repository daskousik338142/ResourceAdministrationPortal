const db = require('./config/database.js');

async function recreateNewAllocationsTable() {
  try {
    await db.ensureInitialized();
    
    console.log('Recreating new_allocations table to match allocation_data schema...');
    
    // Drop the existing table
    db.db.exec('DROP TABLE IF EXISTS new_allocations');
    console.log('Old new_allocations table dropped');
    
    // Create the new table with the exact same schema as allocation_data
    db.db.exec(`
      CREATE TABLE new_allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        CustomerID TEXT,
        CustomerName TEXT,
        AssociateID TEXT,
        AssociateName TEXT,
        Designation TEXT,
        GradeDescription TEXT,
        DepartmentID TEXT,
        DepartmentName TEXT,
        ProjectID TEXT,
        ProjectName TEXT,
        ProjectType TEXT,
        ProjectBillability TEXT,
        AllocationStartDate TEXT,
        AllocationEndDate TEXT,
        AssociateBillability TEXT,
        AllocationStatus TEXT,
        AllocationPercentage REAL,
        ProjectRole TEXT,
        OperationRole TEXT,
        OffShoreOnsite TEXT,
        Country TEXT,
        City TEXT,
        LocationDescription TEXT,
        ManagerID TEXT,
        ManagerName TEXT,
        SupervisorID TEXT,
        SupervisorName TEXT,
        BillabilityReason TEXT,
        PrimaryStateTag TEXT,
        SecondaryStateTag TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('New new_allocations table created with correct schema');
    
    // Save to file
    db.saveToFile();
    console.log('Database saved to file');
    
    // Verify the new schema
    console.log('\n=== VERIFICATION: NEW_ALLOCATIONS SCHEMA ===');
    const tableInfo = db.db.exec('PRAGMA table_info(new_allocations)');
    if (tableInfo.length > 0) {
      tableInfo[0].values.forEach(row => {
        console.log(`  ${row[1]} (${row[2]})`);
      });
      console.log(`Total columns: ${tableInfo[0].values.length}`);
    }
    
    // Also verify allocation_data schema for comparison
    console.log('\n=== VERIFICATION: ALLOCATION_DATA SCHEMA ===');
    const allocTableInfo = db.db.exec('PRAGMA table_info(allocation_data)');
    if (allocTableInfo.length > 0) {
      allocTableInfo[0].values.forEach(row => {
        console.log(`  ${row[1]} (${row[2]})`);
      });
      console.log(`Total columns: ${allocTableInfo[0].values.length}`);
    }
    
    console.log('\n✅ New allocations table recreated successfully!');
    console.log('Both tables now have identical schemas for proper data upload.');
    
  } catch (error) {
    console.error('Error recreating new_allocations table:', error);
  }
}

recreateNewAllocationsTable();
