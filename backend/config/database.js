const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

class SQLiteDatabase {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../data/resource_management.sqlite');
    this.initPromise = this.init();
  }

  async init() {
    try {
      console.log('Initializing SQLite database...');
      const SQL = await initSqlJs();
      
      // Check if database file exists
      let dbData = null;
      if (fs.existsSync(this.dbPath)) {
        dbData = fs.readFileSync(this.dbPath);
        console.log('Existing database file loaded');
      } else {
        console.log('Creating new database file');
      }
      
      // Create or load database
      this.db = new SQL.Database(dbData);
      
      // Create tables if they don't exist
      this.createTables();
      
      // Save database to file immediately
      this.saveToFile();
      
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Error initializing SQLite database:', error);
      throw error;
    }
  }

  async ensureInitialized() {
    await this.initPromise;
  }

  createTables() {
    console.log('Creating database tables...');
    
    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Resources table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        skills TEXT,
        experience INTEGER,
        availability TEXT,
        location TEXT,
        rate REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bookings table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_id INTEGER,
        user_id INTEGER,
        project_name TEXT,
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resource_id) REFERENCES resources(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // NBL List table - flexible structure for Excel data
    this.db.run(`
      CREATE TABLE IF NOT EXISTS nbl_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        upload_timestamp TEXT,
        file_name TEXT,
        original_index INTEGER,
        headers TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Allocation Data table - for resource allocation data with proper business columns
    this.db.run(`
      CREATE TABLE IF NOT EXISTS allocation_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        CustomerID TEXT,
        CustomerName TEXT,
        AssociateID TEXT,
        AssociateName TEXT,
        Designation TEXT,
        GradeDescription TEXT,
        DepartmentID TEXT,
        DepartmentName TEXT,
        ProjectID TEXT,
        ProjectName TEXT,
        ProjectType TEXT,
        ProjectBillability TEXT,
        AllocationStartDate TEXT,
        AllocationEndDate TEXT,
        AssociateBillability TEXT,
        AllocationStatus TEXT,
        AllocationPercentage REAL,
        ProjectRole TEXT,
        OperationRole TEXT,
        OffShoreOnsite TEXT,
        Country TEXT,
        City TEXT,
        LocationDescription TEXT,
        ManagerID TEXT,
        ManagerName TEXT,
        SupervisorID TEXT,
        SupervisorName TEXT,
        BillabilityReason TEXT,
        PrimaryStateTag TEXT,
        SecondaryStateTag TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // New Allocations table - for new allocation data with same schema
    this.db.run(`
      CREATE TABLE IF NOT EXISTS new_allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        CustomerID TEXT,
        CustomerName TEXT,
        AssociateID TEXT,
        AssociateName TEXT,
        Designation TEXT,
        GradeDescription TEXT,
        DepartmentID TEXT,
        DepartmentName TEXT,
        ProjectID TEXT,
        ProjectName TEXT,
        ProjectType TEXT,
        ProjectBillability TEXT,
        AllocationStartDate TEXT,
        AllocationEndDate TEXT,
        AssociateBillability TEXT,
        AllocationStatus TEXT,
        AllocationPercentage REAL,
        ProjectRole TEXT,
        OperationRole TEXT,
        OffShoreOnsite TEXT,
        Country TEXT,
        City TEXT,
        LocationDescription TEXT,
        ManagerID TEXT,
        ManagerName TEXT,
        SupervisorID TEXT,
        SupervisorName TEXT,
        BillabilityReason TEXT,
        PrimaryStateTag TEXT,
        SecondaryStateTag TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created successfully');
    
    // Ensure all required columns exist (migration)
    this.ensureColumns();
  }

  ensureColumns() {
    try {
      // Check if nbl_list table has all required columns
      const tableInfo = this.db.exec("PRAGMA table_info(nbl_list)");
      
      if (tableInfo.length > 0) {
        const columnNames = tableInfo[0].values.map(row => row[1]); // column name is at index 1
        
        // Add missing columns
        if (!columnNames.includes('original_index')) {
          this.db.run('ALTER TABLE nbl_list ADD COLUMN original_index INTEGER');
          console.log('Added original_index column to nbl_list table');
        }
        
        if (!columnNames.includes('headers')) {
          this.db.run('ALTER TABLE nbl_list ADD COLUMN headers TEXT');
          console.log('Added headers column to nbl_list table');
        }
      }
    } catch (error) {
      console.warn('Error checking/adding columns:', error.message);
    }
  }

  saveToFile() {
    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, data);
    } catch (error) {
      console.error('Error saving database to file:', error);
    }
  }

  // Helper methods for database operations
  all(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  get(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  run(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      const changes = this.db.getRowsModified();
      stmt.free();
      this.saveToFile(); // Save after modifications
      return { changes };
    } catch (error) {
      console.error('Database run error:', error);
      throw error;
    }
  }

  // NBL List specific methods
  getNBLData() {
    const result = this.get('SELECT * FROM nbl_list ORDER BY created_at DESC LIMIT 1');
    if (result && result.data) {
      return {
        data: JSON.parse(result.data),
        headers: result.headers ? JSON.parse(result.headers) : [],
        uploadTimestamp: result.upload_timestamp,
        fileName: result.file_name
      };
    }
    return null;
  }

  saveNBLData(data, fileName, headers) {
    // Clear existing data first
    this.run('DELETE FROM nbl_list');
    
    // Insert new data
    const uploadTimestamp = new Date().toISOString();
    this.run(
      'INSERT INTO nbl_list (data, upload_timestamp, file_name, headers) VALUES (?, ?, ?, ?)',
      [JSON.stringify(data), uploadTimestamp, fileName, JSON.stringify(headers)]
    );
    
    return { uploadTimestamp, recordCount: data.length };
  }

  clearNBLData() {
    const result = this.run('DELETE FROM nbl_list');
    return result;
  }
}

module.exports = new SQLiteDatabase();
