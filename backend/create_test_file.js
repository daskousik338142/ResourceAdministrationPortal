const XLSX = require('xlsx');
const path = require('path');

// Create test data with all allocation report columns
const testData = [
  // Header row
  [
    'CustomerID', 'CustomerName', 'AssociateID', 'AssociateName', 'Designation',
    'GradeDescription', 'DepartmentID', 'DepartmentName', 'ProjectID', 'ProjectName',
    'ProjectType', 'ProjectBillability', 'AllocationStartDate', 'AllocationEndDate',
    'AssociateBillability', 'AllocationStatus', 'AllocationPercentage', 'ProjectRole',
    'OperationRole', 'OffShoreOnsite', 'Country', 'City', 'LocationDescription',
    'ManagerID', 'ManagerName', 'SupervisorID', 'SupervisorName', 'BillabilityReason',
    'PrimaryStateTag', 'SecondaryStateTag'
  ],
  // Test records - including some with mostly empty values to test filtering removal
  [
    'CUST001', 'Customer One', 'EMP001', 'John Doe', 'Software Engineer',
    'L4', 'DEPT001', 'Engineering', 'PROJ001', 'Project Alpha',
    'Development', 'Billable', '01/01/2024', '12/31/2024',
    'Billable', 'Active', 100, 'Developer',
    'Technical Lead', 'Offshore', 'India', 'Bangalore', 'Bangalore Office',
    'MGR001', 'Manager One', 'SUP001', 'Supervisor One', 'Project Work',
    'Allocated', 'Primary'
  ],
  [
    'CUST002', '', 'EMP002', 'Jane Smith', '',
    '', '', '', 'PROJ002', '',
    '', '', '', '',
    '', '', '', '',
    '', '', '', '', '',
    '', '', '', '', '',
    '', ''
  ],
  [
    '', '', '', '', '',
    '', '', '', '', '',
    '', '', '', '',
    '', '', '', '',
    '', '', '', '', '',
    '', '', '', '', '',
    '', ''
  ],
  [
    'CUST003', 'Customer Three', 'EMP003', 'Bob Wilson', 'Senior Developer',
    'L5', 'DEPT002', 'Technology', 'PROJ003', 'Project Beta',
    'Maintenance', 'Non-Billable', '02/01/2024', '11/30/2024',
    'Non-Billable', 'Active', 75, 'Senior Developer',
    'Team Lead', 'Onsite', 'USA', 'New York', 'NY Office',
    'MGR002', 'Manager Two', 'SUP002', 'Supervisor Two', 'Bench',
    'Available', 'Secondary'
  ]
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(testData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'AllocationReport');

// Write to file
const outputPath = path.join(__dirname, 'data/test_allocation_report.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('Test Excel file created:', outputPath);
console.log('Test data includes:');
console.log('- 4 records total (1 header + 3 data rows)');
console.log('- One fully populated record');
console.log('- One mostly empty record (should not be filtered out)');
console.log('- One completely empty record (should not be filtered out)');
console.log('- One partially populated record');
console.log('- All 30 allocation report columns');
