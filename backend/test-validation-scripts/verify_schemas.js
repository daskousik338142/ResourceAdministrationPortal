const db = require('./config/database.js');

async function verifySchemas() {
  await db.ensureInitialized();
  
  console.log('=== ALLOCATION_DATA SCHEMA ===');
  const allocInfo = db.db.exec('PRAGMA table_info(allocation_data)');
  const allocColumns = allocInfo[0].values.map(row => `${row[1]} (${row[2]})`);
  allocColumns.forEach(col => console.log(`  ${col}`));
  
  console.log('\n=== NEW_ALLOCATIONS SCHEMA ===');
  const newAllocInfo = db.db.exec('PRAGMA table_info(new_allocations)');
  const newAllocColumns = newAllocInfo[0].values.map(row => `${row[1]} (${row[2]})`);
  newAllocColumns.forEach(col => console.log(`  ${col}`));
  
  console.log(`\nAllocation data columns: ${allocColumns.length}`);
  console.log(`New allocations columns: ${newAllocColumns.length}`);
  console.log(`Schemas match: ${allocColumns.length === newAllocColumns.length ? 'YES' : 'NO'}`);
}

verifySchemas().catch(console.error);
