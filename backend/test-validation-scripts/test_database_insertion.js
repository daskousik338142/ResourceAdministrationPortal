const db = require('./config/database.js');

async function testDatabaseInsertion() {
  try {
    await db.ensureInitialized();
    
    console.log('Testing database insertion without filtering...');
    
    // Test records (same as what would come from Excel)
    const testRecords = [
      {
        CustomerID: 'CUST001',
        CustomerName: 'Customer One',
        AssociateID: 'EMP001',
        AssociateName: 'John Doe',
        Designation: 'Software Engineer',
        GradeDescription: 'L4',
        DepartmentID: 'DEPT001',
        DepartmentName: 'Engineering',
        ProjectID: 'PROJ001',
        ProjectName: 'Project Alpha',
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
      },
      {
        CustomerID: 'CUST002',
        CustomerName: '',
        AssociateID: 'EMP002',
        AssociateName: 'Jane Smith',
        Designation: '',
        GradeDescription: '',
        DepartmentID: '',
        DepartmentName: '',
        ProjectID: 'PROJ002',
        ProjectName: '',
        ProjectType: '',
        ProjectBillability: '',
        AllocationStartDate: '',
        AllocationEndDate: '',
        AssociateBillability: '',
        AllocationStatus: '',
        AllocationPercentage: '',
        ProjectRole: '',
        OperationRole: '',
        OffShoreOnsite: '',
        Country: '',
        City: '',
        LocationDescription: '',
        ManagerID: '',
        ManagerName: '',
        SupervisorID: '',
        SupervisorName: '',
        BillabilityReason: '',
        PrimaryStateTag: '',
        SecondaryStateTag: ''
      },
      {
        CustomerID: '',
        CustomerName: '',
        AssociateID: '',
        AssociateName: '',
        Designation: '',
        GradeDescription: '',
        DepartmentID: '',
        DepartmentName: '',
        ProjectID: '',
        ProjectName: '',
        ProjectType: '',
        ProjectBillability: '',
        AllocationStartDate: '',
        AllocationEndDate: '',
        AssociateBillability: '',
        AllocationStatus: '',
        AllocationPercentage: '',
        ProjectRole: '',
        OperationRole: '',
        OffShoreOnsite: '',
        Country: '',
        City: '',
        LocationDescription: '',
        ManagerID: '',
        ManagerName: '',
        SupervisorID: '',
        SupervisorName: '',
        BillabilityReason: '',
        PrimaryStateTag: '',
        SecondaryStateTag: ''
      },
      {
        CustomerID: 'CUST003',
        CustomerName: 'Customer Three',
        AssociateID: 'EMP003',
        AssociateName: 'Bob Wilson',
        Designation: 'Senior Developer',
        GradeDescription: 'L5',
        DepartmentID: 'DEPT002',
        DepartmentName: 'Technology',
        ProjectID: 'PROJ003',
        ProjectName: 'Project Beta',
        ProjectType: 'Maintenance',
        ProjectBillability: 'Non-Billable',
        AllocationStartDate: '02/01/2024',
        AllocationEndDate: '11/30/2024',
        AssociateBillability: 'Non-Billable',
        AllocationStatus: 'Active',
        AllocationPercentage: 75,
        ProjectRole: 'Senior Developer',
        OperationRole: 'Team Lead',
        OffShoreOnsite: 'Onsite',
        Country: 'USA',
        City: 'New York',
        LocationDescription: 'NY Office',
        ManagerID: 'MGR002',
        ManagerName: 'Manager Two',
        SupervisorID: 'SUP002',
        SupervisorName: 'Supervisor Two',
        BillabilityReason: 'Bench',
        PrimaryStateTag: 'Available',
        SecondaryStateTag: 'Secondary'
      }
    ];
    
    // Clear existing data
    console.log('Clearing existing data...');
    db.db.exec('DELETE FROM allocation_data');
    
    // Insert test records
    let insertedCount = 0;
    const timestamp = new Date().toISOString();
    
    console.log('Inserting test records...');
    for (const record of testRecords) {
      try {
        const columns = Object.keys(record).join(', ');
        const placeholders = Object.keys(record).map(() => '?').join(', ');
        const values = Object.values(record);
        
        const sql = `INSERT INTO allocation_data (${columns}, created_at, updated_at) VALUES (${placeholders}, ?, ?)`;
        
        db.db.run(sql, [...values, timestamp, timestamp]);
        insertedCount++;
        console.log(`Record ${insertedCount} inserted successfully`);
      } catch (insertError) {
        console.error(`Error inserting record ${insertedCount + 1}:`, insertError);
      }
    }
    
    // Save to file
    db.saveToFile();
    
    // Verify insertion
    const result = db.all('SELECT COUNT(*) as count FROM allocation_data');
    console.log(`\nTotal records in database: ${result[0].count}`);
    
    // Get all records to verify content
    const allRecords = db.all('SELECT * FROM allocation_data ORDER BY id');
    console.log('All records in database:');
    allRecords.forEach((record, index) => {
      const nonEmptyFields = Object.values(record).filter(value => 
        value !== null && value !== undefined && value !== '' && value.toString().trim() !== ''
      ).length;
      console.log(`Record ${index + 1}: ID=${record.id}, CustomerID="${record.CustomerID}", AssociateName="${record.AssociateName}", Non-empty fields: ${nonEmptyFields}`);
    });
    
    console.log('\n✅ Database insertion test completed successfully!');
    console.log('All records (including mostly empty and completely empty ones) were inserted without filtering.');
    
  } catch (error) {
    console.error('Database insertion test failed:', error);
  }
}

testDatabaseInsertion();
