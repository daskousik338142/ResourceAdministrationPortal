const axios = require('axios');

async function testAnalyticsEndpoints() {
  const baseURL = 'http://localhost:3001/api';
  
  console.log('Testing analytics endpoints...\n');
  
  try {
    // Test allocation data endpoints
    console.log('=== Allocation Data ===');
    
    const allocStats = await axios.get(`${baseURL}/allocation-data/stats`);
    console.log('Stats:', allocStats.data);
    
    const allocBillable = await axios.get(`${baseURL}/allocation-data/billable-analytics`);
    console.log('Billable Analytics:', allocBillable.data);
    
    const allocGrades = await axios.get(`${baseURL}/allocation-data/grade-analytics`);
    console.log('Grade Analytics:', allocGrades.data);
    
    // Test new allocations endpoints
    console.log('\n=== New Allocations ===');
    
    const newStats = await axios.get(`${baseURL}/new-allocations/stats`);
    console.log('Stats:', newStats.data);
    
    const newBillable = await axios.get(`${baseURL}/new-allocations/billable-analytics`);
    console.log('Billable Analytics:', newBillable.data);
    
    const newGrades = await axios.get(`${baseURL}/new-allocations/grade-analytics`);
    console.log('Grade Analytics:', newGrades.data);
    
  } catch (error) {
    console.error('Error testing endpoints:', error.response?.data || error.message);
  }
}

// Only run if backend is available
setTimeout(() => {
  testAnalyticsEndpoints();
}, 1000);
