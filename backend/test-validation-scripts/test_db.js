const db = require('./config/database');

async function testDatabase() {
  try {
    await db.ensureInitialized();
    
    console.log('=== Testing Allocation Data ===');
    const allocCount = db.get('SELECT COUNT(*) as count FROM allocation_data');
    console.log('Allocation data count:', allocCount);
    
    if (allocCount && allocCount.count > 0) {
      const sampleAlloc = db.get('SELECT * FROM allocation_data LIMIT 1');
      console.log('Sample allocation record columns:', Object.keys(sampleAlloc || {}));
      console.log('Sample AssociateBillability:', sampleAlloc?.AssociateBillability);
      console.log('Sample GradeDescription:', sampleAlloc?.GradeDescription);
    }
    
    console.log('\n=== Testing New Allocations ===');
    const newCount = db.get('SELECT COUNT(*) as count FROM new_allocations');
    console.log('New allocations count:', newCount);
    
    if (newCount && newCount.count > 0) {
      const sampleNew = db.get('SELECT * FROM new_allocations LIMIT 1');
      console.log('Sample new allocation record columns:', Object.keys(sampleNew || {}));
      console.log('Sample AssociateBillability:', sampleNew?.AssociateBillability);
      console.log('Sample GradeDescription:', sampleNew?.GradeDescription);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDatabase();
