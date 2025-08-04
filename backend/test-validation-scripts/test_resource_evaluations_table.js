const db = require('./config/database');

async function testResourceEvaluationsTable() {
  console.log('Testing resource evaluations table...');
  
  try {
    await db.ensureInitialized();
    
    // Check if table exists and get its structure
    console.log('\n=== Checking table structure ===');
    const tableInfo = db.all("PRAGMA table_info(resource_evaluations)");
    console.log('Table columns:', tableInfo.map(col => ({
      name: col.name,
      type: col.type,
      notNull: col.notnull,
      defaultValue: col.dflt_value
    })));
    
    // Test inserting a sample record
    console.log('\n=== Testing insert ===');
    const testData = {
      associate_id: 'TEST001',
      associate_name: 'Test Associate',
      client_name: 'Test Client',
      resume_file: 'test-resume.pdf'
    };
    
    const result = db.run(`
      INSERT INTO resource_evaluations (
        associate_id, associate_name, client_name, resume_file,
        internal_evaluation_status, client_evaluation_status
      ) VALUES (?, ?, ?, ?, 'pending', 'pending')
    `, [testData.associate_id, testData.associate_name, testData.client_name, testData.resume_file]);
    
    console.log('Insert result:', result);
    
    // Test selecting the record
    console.log('\n=== Testing select ===');
    const records = db.all('SELECT * FROM resource_evaluations');
    console.log('Records:', records);
    
    // Clean up test data
    db.run('DELETE FROM resource_evaluations WHERE associate_id = ?', ['TEST001']);
    console.log('\n=== Test data cleaned up ===');
    
    console.log('\nResource evaluations table test completed successfully!');
    
  } catch (error) {
    console.error('Error testing resource evaluations table:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testResourceEvaluationsTable();
}

module.exports = { testResourceEvaluationsTable };
