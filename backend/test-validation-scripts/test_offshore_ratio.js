const db = require('./config/database');

async function testOffshoreRatio() {
  console.log('Testing offshore ratio calculation...');
  
  try {
    await db.ensureInitialized();
    
    // Test allocation data offshore analytics
    console.log('\n=== Allocation Data Offshore Analytics ===');
    const allocResponse = await fetch('http://localhost:3001/api/allocation-data/offshore-analytics');
    const allocData = await allocResponse.json();
    console.log('Allocation Data Response:', JSON.stringify(allocData, null, 2));
    
    if (allocData.success) {
      const { offshore, onshore } = allocData.analytics;
      console.log(`\nManual calculation verification:`);
      console.log(`Onshore count: ${onshore}`);
      console.log(`Offshore count: ${offshore}`);
      if (offshore > 0) {
        const ratio = (onshore * 100) / offshore;
        console.log(`Formula: (${onshore} * 100) / ${offshore} = ${ratio.toFixed(1)}%`);
        console.log(`API returned: ${allocData.analytics.ratio}`);
      }
    }
    
    // Test new allocations offshore analytics
    console.log('\n=== New Allocations Offshore Analytics ===');
    const newResponse = await fetch('http://localhost:3001/api/new-allocations/offshore-analytics');
    const newData = await newResponse.json();
    console.log('New Allocations Response:', JSON.stringify(newData, null, 2));
    
    if (newData.success) {
      const { offshore, onshore } = newData.analytics;
      console.log(`\nManual calculation verification:`);
      console.log(`Onshore count: ${onshore}`);
      console.log(`Offshore count: ${offshore}`);
      if (offshore > 0) {
        const ratio = (onshore * 100) / offshore;
        console.log(`Formula: (${onshore} * 100) / ${offshore} = ${ratio.toFixed(1)}%`);
        console.log(`API returned: ${newData.analytics.ratio}`);
      }
    }
    
  } catch (error) {
    console.error('Error testing offshore ratio:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testOffshoreRatio();
}

module.exports = { testOffshoreRatio };
