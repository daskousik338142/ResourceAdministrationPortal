const db = require('./config/database.js');

async function fixDatabaseSchema() {
  try {
    await db.ensureInitialized();
    console.log('Dropping and recreating allocation_data table with correct schema...');
    
    // Drop the old table
    db.db.exec('DROP TABLE IF EXISTS allocation_data');
    
    // Create the new table with correct allocation report columns
    db.db.exec(`
      CREATE TABLE allocation_data (
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
    
    db.saveToFile();
    console.log('Table recreated successfully with allocation report schema');
    
    // Verify new structure
    const tableInfo = db.db.exec('PRAGMA table_info(allocation_data)');
    console.log('New table structure:');
    if (tableInfo.length > 0) {
      console.log('Columns:');
      tableInfo[0].values.forEach(row => {
        console.log(`  ${row[1]} (${row[2]})`);
      });
      console.log(`Total columns: ${tableInfo[0].values.length}`);
    }
    
    console.log('✅ Database schema fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing database schema:', error);
  }
}

fixDatabaseSchema();
