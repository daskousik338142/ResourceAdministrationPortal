const db = require('./config/database');
async function migrateNBLTable() {
  try {
    await db.ensureInitialized();
    // First, check if there's any data to backup
    let existingData = [];
    try {
      const result = db.db.exec('SELECT * FROM nbl_list');
      if (result[0] && result[0].values) {
        existingData = result[0].values;
      }
    } catch (e) {
    }
    // Drop the old table
    db.db.exec('DROP TABLE IF EXISTS nbl_list');
    // Recreate the table with new schema
    db.db.exec(`
      CREATE TABLE nbl_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        associate_id INTEGER UNIQUE NOT NULL,
        account_id INTEGER,
        account_name TEXT,
        project_id INTEGER,
        project_description TEXT,
        associate_name TEXT,
        department_name TEXT,
        project_billability TEXT,
        on_off TEXT,
        grade_mapping TEXT,
        assignment_start_date TEXT,
        percent_allocation INTEGER,
        primary_state_tag TEXT,
        secondary_state_tag TEXT,
        service_line TEXT,
        genc TEXT,
        nbl_category TEXT,
        nbl_secondary_category TEXT,
        billable_release_date TEXT,
        remarks TEXT,
        upload_timestamp TEXT,
        file_name TEXT,
        record_type TEXT DEFAULT 'data',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_modified TEXT
      )
    `);
    // Create index
    db.db.exec('CREATE INDEX IF NOT EXISTS idx_nbl_list_upload_timestamp ON nbl_list(upload_timestamp)');
    // Verify the new schema
    const result = db.db.exec('PRAGMA table_info(nbl_list)');
    if (result[0] && result[0].values) {
      result[0].values.forEach(row => {
      });
    }
    // Save the database
    db.saveToFile();
  } catch (error) {
    process.exit(1);
  }
}
// Run the migration
migrateNBLTable().then(() => {
  process.exit(0);
});
