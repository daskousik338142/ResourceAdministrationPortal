const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

async function testUploadLogic() {
  try {
    console.log('Testing upload logic without filtering...');
    
    // Read the test file we created
    const filePath = path.join(__dirname, 'data/test_allocation_report.xlsx');
    
    if (!fs.existsSync(filePath)) {
      console.error('Test file not found:', filePath);
      return;
    }
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets['AllocationReport'];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Original data from Excel:');
    console.log('Total rows:', jsonData.length);
    console.log('Header row:', jsonData[0]);
    console.log('Data rows:', jsonData.slice(1));
    
    // Extract headers and data like the frontend does
    const rawHeaderRow = jsonData[0];
    const rawDataRows = jsonData.slice(1);
    
    // Use ALL headers from spreadsheet - no filtering (updated logic)
    const filteredHeaders = rawHeaderRow.map(header => 
      (header === null || header === undefined || header === '') ? '' : header.toString()
    );
    
    const headerIndexMap = filteredHeaders.map((header, index) => index);
    
    // Use ALL data rows - no filtering
    const dataRows = rawDataRows.map(row => {
      return headerIndexMap.map(index => row[index]);
    });
    
    // Prepare records for backend using all headers
    const recordsForBackend = dataRows.map((row, index) => {
      const record = {};
      filteredHeaders.forEach((header, headerIndex) => {
        const cellValue = row[headerIndex];
        // Set all values, even empty ones
        record[header] = (cellValue === null || cellValue === undefined) ? '' : cellValue;
      });
      return record;
    });
    
    console.log('\nProcessed data:');
    console.log('Headers count:', filteredHeaders.length);
    console.log('Headers:', filteredHeaders);
    console.log('Records count:', recordsForBackend.length);
    console.log('Records:');
    recordsForBackend.forEach((record, index) => {
      console.log(`Record ${index + 1}:`, record);
    });
    
    // Test database insertion simulation
    console.log('\nTesting data that would be inserted:');
    recordsForBackend.forEach((record, index) => {
      const values = Object.values(record);
      const nonEmptyValues = values.filter(value => 
        value !== null && value !== undefined && value !== '' && value.toString().trim() !== ''
      );
      const emptyPercentage = ((values.length - nonEmptyValues.length) / values.length) * 100;
      console.log(`Record ${index + 1}: ${nonEmptyValues.length}/${values.length} non-empty values (${emptyPercentage.toFixed(1)}% empty) - WOULD BE INSERTED (no filtering)`);
    });
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testUploadLogic();
