const db = require('./config/database.js');

async function fixNewAllocationsSchema() {
  await db.ensureInitialized();
  
  // Drop and recreate the table
  db.db.exec('DROP TABLE IF EXISTS new_allocations');
  
  // Create with exact allocation_data schema
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
  
  db.saveToFile();
  console.log('New allocations table recreated successfully');
}

fixNewAllocationsSchema().catch(console.error);
