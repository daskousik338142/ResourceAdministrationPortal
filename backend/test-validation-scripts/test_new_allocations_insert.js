const db = require('./config/database.js');

async function testNewAllocationsInsert() {
  try {
    await db.ensureInitialized();
    
    console.log('Testing new_allocations table insertion...');
    
    // Clear any existing data
    db.run('DELETE FROM new_allocations');
    
    // Test record with allocation report column structure
    const testRecord = {
      CustomerID: 'CUST001',
      CustomerName: 'Test Customer',
      AssociateID: 'EMP001',
      AssociateName: 'John Doe',
      Designation: 'Software Engineer',
      GradeDescription: 'L4',
      DepartmentID: 'DEPT001',
      DepartmentName: 'Engineering',
      ProjectID: 'PROJ001',
      ProjectName: 'Test Project',
      ProjectType: 'Development',
      ProjectBillability: 'Billable',
      AllocationStartDate: '01/01/2024',
      AllocationEndDate: '12/31/2024',
      AssociateBillability: 'Billable',
      AllocationStatus: 'Active',
      AllocationPercentage: 100,
      ProjectRole: 'Developer',
      OperationRole: 'Technical Lead',
      OffShoreOnsite: 'Offshore',
      Country: 'India',
      City: 'Bangalore',
      LocationDescription: 'Bangalore Office',
      ManagerID: 'MGR001',
      ManagerName: 'Manager One',
      SupervisorID: 'SUP001',
      SupervisorName: 'Supervisor One',
      BillabilityReason: 'Project Work',
      PrimaryStateTag: 'Allocated',
      SecondaryStateTag: 'Primary'
    };
    
    // Insert test record
    const columns = Object.keys(testRecord).join(', ');
    const placeholders = Object.keys(testRecord).map(() => '?').join(', ');
    const values = Object.values(testRecord);
    const timestamp = new Date().toISOString();
    
    const sql = `INSERT INTO new_allocations (${columns}, created_at, updated_at) VALUES (${placeholders}, ?, ?)`;
    
    const result = db.run(sql, [...values, timestamp, timestamp]);
    console.log('Insert result:', result);
    
    // Verify insertion
    const count = db.get('SELECT COUNT(*) as count FROM new_allocations');
    console.log(`Records inserted: ${count.count}`);
    
    // Get the inserted record to verify structure
    const inserted = db.all('SELECT * FROM new_allocations LIMIT 1');
    if (inserted.length > 0) {
      console.log('Inserted record has', Object.keys(inserted[0]).length, 'columns');
      console.log('Sample fields:', Object.keys(inserted[0]).slice(0, 10));
    }
    
    console.log('✅ New allocations table schema is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing new_allocations insertion:', error);
  }
}

testNewAllocationsInsert();
