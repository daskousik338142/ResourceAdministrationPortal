const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testNBLAPI() {
  try {
    console.log('Testing NBL List API endpoints...');
    
    // Test health check
    console.log('\n1. Testing health check...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('Health check:', health.data);
    
    // Test getting empty data
    console.log('\n2. Testing GET /nbl-list (should be empty)...');
    const emptyData = await axios.get(`${API_BASE}/nbl-list`);
    console.log('Empty data response:', emptyData.data);
    
    // Test uploading sample data
    console.log('\n3. Testing POST /nbl-list/upload...');
    const sampleData = [
      { 'Employee Name': 'John Doe', 'NBL Category': 'NBL', 'Assignment Start Date': '2025-01-01' },
      { 'Employee Name': 'Jane Smith', 'NBL Category': 'Awaiting Billing', 'Assignment Start Date': '2025-01-02' },
      { 'Employee Name': 'Bob Wilson', 'NBL Category': 'Billed', 'Assignment Start Date': '2025-01-03' }
    ];
    
    const uploadResponse = await axios.post(`${API_BASE}/nbl-list/upload`, {
      data: sampleData,
      fileName: 'test-data.xlsx',
      headers: ['Employee Name', 'NBL Category', 'Assignment Start Date']
    });
    console.log('Upload response:', uploadResponse.data);
    
    // Test getting data after upload
    console.log('\n4. Testing GET /nbl-list (with data)...');
    const dataResponse = await axios.get(`${API_BASE}/nbl-list`);
    console.log('Data response:', dataResponse.data);
    
    // Test getting stats
    console.log('\n5. Testing GET /nbl-list/stats...');
    const statsResponse = await axios.get(`${API_BASE}/nbl-list/stats`);
    console.log('Stats response:', statsResponse.data);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response ? error.response.data : error.message);
  }
}

// Run tests
testNBLAPI();
