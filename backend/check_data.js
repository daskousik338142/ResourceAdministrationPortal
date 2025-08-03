const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function checkData() {
  try {
    console.log('Initializing SQLite...');
    const SQL = await initSqlJs();
    
    const dbPath = path.join(__dirname, 'data', 'resource_management.sqlite');
    
    if (!fs.existsSync(dbPath)) {
      console.log('Database file does not exist:', dbPath);
      return;
    }
    
    const dbData = fs.readFileSync(dbPath);
    const db = new SQL.Database(dbData);
    
    console.log('\n=== ALLOCATION DATA TABLE INFO ===');
    const allocCount = db.exec('SELECT COUNT(*) as count FROM allocation_data');
    console.log('Total allocation records:', allocCount[0]?.values[0][0] || 0);
    
    // Get sample billability data
    const allocBillable = db.exec('SELECT AssociateBillability, COUNT(*) as count FROM allocation_data WHERE AssociateBillability IS NOT NULL GROUP BY AssociateBillability LIMIT 10');
    console.log('Allocation billability distribution:', allocBillable[0]?.values || []);
    
    // Get sample grade data
    const allocGrades = db.exec('SELECT GradeDescription, COUNT(*) as count FROM allocation_data WHERE GradeDescription IS NOT NULL GROUP BY GradeDescription LIMIT 10');
    console.log('Allocation grade distribution:', allocGrades[0]?.values || []);
    
    console.log('\n=== NEW ALLOCATIONS TABLE INFO ===');
    const newCount = db.exec('SELECT COUNT(*) as count FROM new_allocations');
    console.log('Total new allocation records:', newCount[0]?.values[0][0] || 0);
    
    // Get sample billability data
    const newBillable = db.exec('SELECT AssociateBillability, COUNT(*) as count FROM new_allocations WHERE AssociateBillability IS NOT NULL GROUP BY AssociateBillability LIMIT 10');
    console.log('New allocation billability distribution:', newBillable[0]?.values || []);
    
    // Get sample grade data
    const newGrades = db.exec('SELECT GradeDescription, COUNT(*) as count FROM new_allocations WHERE GradeDescription IS NOT NULL GROUP BY GradeDescription LIMIT 10');
    console.log('New allocation grade distribution:', newGrades[0]?.values || []);
    
    // Check table structure
    console.log('\n=== TABLE STRUCTURES ===');
    const allocStructure = db.exec('PRAGMA table_info(allocation_data)');
    console.log('Allocation data columns:', allocStructure[0]?.values || []);
    
    const newStructure = db.exec('PRAGMA table_info(new_allocations)');
    console.log('New allocations columns:', newStructure[0]?.values || []);
    
    db.close();
    
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkData();
