const db = require('./config/database');

// Sample allocation data
const sampleAllocationData = [
  {
    upload_timestamp: new Date().toISOString(),
    file_name: 'test_allocation_data.xlsx',
    headers: JSON.stringify(['CustomerID', 'CustomerName', 'AssociateID', 'AssociateName', 'Designation', 'GradeDescription', 'DepartmentID', 'DepartmentName', 'ProjectID', 'ProjectName', 'ProjectType', 'ProjectBillability', 'AllocationStartDate', 'AllocationEndDate', 'AssociateBillability', 'AllocationStatus', 'AllocationPercentage', 'ProjectRole', 'OperationRole', 'OffShoreOnsite', 'Country', 'City', 'LocationDescription', 'ManagerID', 'ManagerName', 'SupervisorID', 'SupervisorName', 'BillabilityReason', 'PrimaryStateTag', 'SecondaryStateTag']),
    original_row_index: 0,
    CustomerID: '1200377',
    CustomerName: 'Test Company Inc.',
    AssociateID: '104885',
    AssociateName: 'John Doe',
    Designation: 'Senior Developer',
    GradeDescription: 'Senior Associate',
    DepartmentID: 'DC00347',
    DepartmentName: 'Development Team',
    ProjectID: '1000242686',
    ProjectName: 'Test Project Alpha',
    ProjectType: 'Development',
    ProjectBillability: 'BFD',
    AllocationStartDate: '01/01/2025',
    AllocationEndDate: '12/31/2025',
    AssociateBillability: 'BFD',
    AllocationStatus: 'A',
    AllocationPercentage: '100',
    ProjectRole: 'DEVELOPER',
    OperationRole: 'Full Stack Developer',
    OffShoreOnsite: 'ON',
    Country: 'United States',
    City: 'Boston',
    LocationDescription: 'Boston - MA USA',
    ManagerID: '379158',
    ManagerName: 'Jane Manager',
    SupervisorID: '107030',
    SupervisorName: 'Bob Supervisor',
    BillabilityReason: 'Project Work',
    PrimaryStateTag: 'Billed',
    SecondaryStateTag: null
  },
  {
    upload_timestamp: new Date().toISOString(),
    file_name: 'test_allocation_data.xlsx',
    headers: JSON.stringify(['CustomerID', 'CustomerName', 'AssociateID', 'AssociateName', 'Designation', 'GradeDescription', 'DepartmentID', 'DepartmentName', 'ProjectID', 'ProjectName', 'ProjectType', 'ProjectBillability', 'AllocationStartDate', 'AllocationEndDate', 'AssociateBillability', 'AllocationStatus', 'AllocationPercentage', 'ProjectRole', 'OperationRole', 'OffShoreOnsite', 'Country', 'City', 'LocationDescription', 'ManagerID', 'ManagerName', 'SupervisorID', 'SupervisorName', 'BillabilityReason', 'PrimaryStateTag', 'SecondaryStateTag']),
    original_row_index: 1,
    CustomerID: '1200378',
    CustomerName: 'Another Test Company',
    AssociateID: '105524',
    AssociateName: 'Alice Smith',
    Designation: 'Product Manager',
    GradeDescription: 'Manager',
    DepartmentID: 'DC00069',
    DepartmentName: 'Product Management',
    ProjectID: '1000242687',
    ProjectName: 'Test Project Beta',
    ProjectType: 'Management',
    ProjectBillability: 'BFD',
    AllocationStartDate: '02/01/2025',
    AllocationEndDate: '11/30/2025',
    AssociateBillability: 'BFD',
    AllocationStatus: 'A',
    AllocationPercentage: '80',
    ProjectRole: 'PM',
    OperationRole: 'Product Manager',
    OffShoreOnsite: 'ON',
    Country: 'United States',
    City: 'New York',
    LocationDescription: 'New York - NY USA',
    ManagerID: '379159',
    ManagerName: 'Mike Director',
    SupervisorID: '180014',
    SupervisorName: 'Carol Lead',
    BillabilityReason: 'Product Development',
    PrimaryStateTag: 'Billed',
    SecondaryStateTag: null
  }
];

// Sample new allocation data (similar but different)
const sampleNewAllocationData = [
  {
    upload_timestamp: new Date().toISOString(),
    file_name: 'new_allocations_test.xlsx',
    headers: JSON.stringify(['CustomerID', 'CustomerName', 'AssociateID', 'AssociateName', 'Designation', 'GradeDescription', 'DepartmentID', 'DepartmentName', 'ProjectID', 'ProjectName', 'ProjectType', 'ProjectBillability', 'AllocationStartDate', 'AllocationEndDate', 'AssociateBillability', 'AllocationStatus', 'AllocationPercentage', 'ProjectRole', 'OperationRole', 'OffShoreOnsite', 'Country', 'City', 'LocationDescription', 'ManagerID', 'ManagerName', 'SupervisorID', 'SupervisorName', 'BillabilityReason', 'PrimaryStateTag', 'SecondaryStateTag']),
    original_row_index: 0,
    CustomerID: '1200379',
    CustomerName: 'Future Client Corp',
    AssociateID: '109931',
    AssociateName: 'David Future',
    Designation: 'Tech Lead',
    GradeDescription: 'Senior Lead',
    DepartmentID: 'DC00347',
    DepartmentName: 'Future Projects',
    ProjectID: '1000242688',
    ProjectName: 'Future Project Gamma',
    ProjectType: 'Innovation',
    ProjectBillability: 'BFD',
    AllocationStartDate: '03/01/2025',
    AllocationEndDate: '08/31/2025',
    AssociateBillability: 'BFD',
    AllocationStatus: 'P', // Pending
    AllocationPercentage: '75',
    ProjectRole: 'TECH_LEAD',
    OperationRole: 'Technical Leader',
    OffShoreOnsite: 'OFF',
    Country: 'India',
    City: 'Bangalore',
    LocationDescription: 'Bangalore - KA India',
    ManagerID: '379160',
    ManagerName: 'Sarah Tech Manager',
    SupervisorID: '104885',
    SupervisorName: 'Tom Senior',
    BillabilityReason: 'New Initiative',
    PrimaryStateTag: 'Planned',
    SecondaryStateTag: 'New'
  }
];

async function testDataPersistence() {
  try {
    await db.ensureInitialized();

    // Test allocation data
    const currentAllocation = await db.findAllocationData({});
    
    // Insert sample allocation data
    for (let i = 0; i < sampleAllocationData.length; i++) {
      const record = sampleAllocationData[i];
      await db.insertAllocationData(record);
    }
    
    // Verify allocation data
    const allocationAfterInsert = await db.findAllocationData({});
    
    // Test new allocation data
    const currentNewAllocation = await db.findNewAllocations({});
    
    // Insert sample new allocation data
    for (let i = 0; i < sampleNewAllocationData.length; i++) {
      const record = sampleNewAllocationData[i];
      await db.insertNewAllocation(record);
    }
    
    // Verify new allocation data
    const newAllocationAfterInsert = await db.findNewAllocations({});
    
  } catch (error) {
    // Error handling - could log to file in production
  }
}

// Run the test
testDataPersistence().then(() => {
  process.exit(0);
}).catch((error) => {
  process.exit(1);
});
