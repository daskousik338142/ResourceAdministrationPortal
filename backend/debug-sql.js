const db = require('./config/database');
async function debugSQLExecution() {
  try {
    // Initialize database
    await db.ensureInitialized();
    // Get a record
    const records = await db.findNBLRecords({});
    const testRecord = records[0];
    const recordId = testRecord._id;
    // Try direct SQL execution
    // First, let's see the current value in the database
    const directQuery = `SELECT nbl_category FROM nbl_list WHERE id = ?`;
    const currentValue = db.get(directQuery, [recordId]);
    // Now execute an UPDATE directly
    const newValue = 'Direct SQL Update';
    const updateSQL = `UPDATE nbl_list SET nbl_category = ? WHERE id = ?`;
    // Execute using our run method
    const result = db.run(updateSQL, [newValue, recordId]);
    // Check if the value actually changed
    const updatedValue = db.get(directQuery, [recordId]);
    // Try to get the modified rows count differently
    // Try a different approach - use db.exec() which might give us better info
    const execResult = db.db.exec(`UPDATE nbl_list SET nbl_category = 'Exec Test ${Date.now()}' WHERE id = ${recordId}`);
    // Verify the change
    const finalValue = db.get(directQuery, [recordId]);
  } catch (error) {
  }
}
// Run the debug test
debugSQLExecution().then(() => {
  process.exit(0);
}).catch(error => {
  process.exit(1);
});
