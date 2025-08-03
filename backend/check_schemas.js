const db = require('./config/database.js');

async function checkSchemas() {
  try {
    await db.ensureInitialized();
    
    console.log('=== CURRENT ALLOCATION_DATA SCHEMA ===');
    const allocTableInfo = db.db.exec('PRAGMA table_info(allocation_data)');
    if (allocTableInfo.length > 0) {
      allocTableInfo[0].values.forEach(row => {
        console.log(`  ${row[1]} (${row[2]})`);
      });
      console.log(`Total columns: ${allocTableInfo[0].values.length}`);
    }
    
    console.log('\n=== CURRENT NEW_ALLOCATIONS SCHEMA ===');
    const newAllocTableInfo = db.db.exec('PRAGMA table_info(new_allocations)');
    if (newAllocTableInfo.length > 0) {
      newAllocTableInfo[0].values.forEach(row => {
        console.log(`  ${row[1]} (${row[2]})`);
      });
      console.log(`Total columns: ${newAllocTableInfo[0].values.length}`);
    } else {
      console.log('  Table not found or empty schema');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchemas();
