const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
class SQLiteDatabase {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../data/resource_management.sqlite');
    this.init();
  }
  async init() {
    try {
      const SQL = await initSqlJs();
      // Check if database file exists
      let dbData = null;
      if (fs.existsSync(this.dbPath)) {
        dbData = fs.readFileSync(this.dbPath);
      }
      // Create or load database
      this.db = new SQL.Database(dbData);
      // Create tables if they don't exist
      this.createTables();
      // Save database to file
      this.saveToFile();
    } catch (error) {
      throw error;
    }
  }
  createTables() {
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
    // NBL List table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS nbl_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        skills TEXT,
        experience TEXT,
        upload_timestamp TEXT,
        file_name TEXT,
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Resource Evaluations table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS resource_evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        associate_id TEXT UNIQUE NOT NULL,
        associate_name TEXT NOT NULL,
        customer_name TEXT,
        resume_filename TEXT,
        resume_original_name TEXT,
        resume_path TEXT,
        resume_size INTEGER,
        resume_uploaded_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        -- Internal Evaluation 1
        internal_evaluation_1_status BOOLEAN,
        internal_evaluation_1_feedback TEXT,
        -- Internal Evaluation 2 (Optional)
        internal_evaluation_2_status BOOLEAN,
        internal_evaluation_2_feedback TEXT,
        -- Internal Evaluation 3 (Optional)
        internal_evaluation_3_status BOOLEAN,
        internal_evaluation_3_feedback TEXT,
        -- Client Interview
        client_interview_status BOOLEAN,
        client_interview_feedback TEXT,
        -- Client Coding Assignment
        client_coding_evaluation_status BOOLEAN,
        client_coding_evaluation_feedback TEXT,
        -- Overall Status
        status TEXT DEFAULT 'pending'
      )
    `);
    // Allocation Data table (for existing allocation data)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS allocation_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_name TEXT,
        client_name TEXT,
        project_name TEXT,
        allocation_start TEXT,
        allocation_end TEXT,
        allocation_percentage REAL,
        skills TEXT,
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // New Allocations table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS new_allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_name TEXT,
        client_name TEXT,
        project_name TEXT,
        start_date TEXT,
        end_date TEXT,
        allocation_percentage REAL,
        skills TEXT,
        location TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Email List table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS email_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        upload_timestamp TEXT,
        file_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Create indexes for better performance
    this.db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_resources_name ON resources(name)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_bookings_resource_id ON bookings(resource_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_resource_evaluations_associate_id ON resource_evaluations(associate_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_resource_evaluations_status ON resource_evaluations(status)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_nbl_list_upload_timestamp ON nbl_list(upload_timestamp)');
  }
  saveToFile() {
    if (this.db) {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, data);
    }
  }
  // Helper methods for executing queries
  run(sql, params = []) {
    try {
      const result = this.db.run(sql, params);
      this.saveToFile(); // Save after each write operation
      return result;
    } catch (error) {
      throw error;
    }
  }
  get(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.getAsObject(params);
      stmt.free();
      return result;
    } catch (error) {
      throw error;
    }
  }
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
      throw error;
    }
  }
  // Get last inserted row ID
  getLastInsertId() {
    const result = this.get('SELECT last_insert_rowid() as id');
    return result ? result.id : null;
  }
  // Table-specific helper methods
  getUsersDB() {
    return {
      insert: (data) => this.insertUser(data),
      findOne: (query) => this.findUser(query),
      find: (query = {}) => this.findUsers(query),
      update: (query, update) => this.updateUser(query, update),
      remove: (query) => this.removeUser(query)
    };
  }
  getResourcesDB() {
    return {
      insert: (data) => this.insertResource(data),
      findOne: (query) => this.findResource(query),
      find: (query = {}) => this.findResources(query),
      update: (query, update) => this.updateResource(query, update),
      remove: (query) => this.removeResource(query)
    };
  }
  getBookingsDB() {
    return {
      insert: (data) => this.insertBooking(data),
      findOne: (query) => this.findBooking(query),
      find: (query = {}) => this.findBookings(query),
      update: (query, update) => this.updateBooking(query, update),
      remove: (query) => this.removeBooking(query)
    };
  }
  getNBLListDB() {
    return {
      insert: (data) => this.insertNBLRecord(data),
      findOne: (query) => this.findNBLRecord(query),
      find: (query = {}) => this.findNBLRecords(query),
      update: (query, update) => this.updateNBLRecord(query, update),
      remove: (query) => this.removeNBLRecord(query)
    };
  }
  getResourceEvaluationsDB() {
    return {
      insert: (data) => this.insertResourceEvaluation(data),
      findOne: (query) => this.findResourceEvaluation(query),
      find: (query = {}) => this.findResourceEvaluations(query),
      update: (query, update) => this.updateResourceEvaluation(query, update),
      remove: (query) => this.removeResourceEvaluation(query)
    };
  }
  // User operations
  insertUser(data) {
    const sql = `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`;
    this.run(sql, [data.email, data.password, data.name, data.role || 'user']);
    const id = this.getLastInsertId();
    return { ...data, id };
  }
  findUser(query) {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    if (query.email) {
      sql += ' AND email = ?';
      params.push(query.email);
    }
    if (query.id) {
      sql += ' AND id = ?';
      params.push(query.id);
    }
    sql += ' LIMIT 1';
    return this.get(sql, params);
  }
  findUsers(query = {}) {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    if (query.role) {
      sql += ' AND role = ?';
      params.push(query.role);
    }
    return this.all(sql, params);
  }
  updateUser(query, update) {
    const setClause = [];
    const params = [];
    Object.keys(update).forEach(key => {
      if (key !== 'id') {
        setClause.push(`${key} = ?`);
        params.push(update[key]);
      }
    });
    let sql = `UPDATE users SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE 1=1`;
    if (query.id) {
      sql += ' AND id = ?';
      params.push(query.id);
    }
    if (query.email) {
      sql += ' AND email = ?';
      params.push(query.email);
    }
    this.run(sql, params);
    return this.findUser(query);
  }
  removeUser(query) {
    let sql = 'DELETE FROM users WHERE 1=1';
    const params = [];
    if (query.id) {
      sql += ' AND id = ?';
      params.push(query.id);
    }
    if (query.email) {
      sql += ' AND email = ?';
      params.push(query.email);
    }
    const result = this.run(sql, params);
    return { deletedCount: result.changes };
  }
  // Resource operations
  insertResource(data) {
    const sql = `INSERT INTO resources (name, email, skills, experience, availability, location, rate) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
    this.run(sql, [
      data.name, data.email, data.skills, data.experience, 
      data.availability, data.location, data.rate
    ]);
    const id = this.getLastInsertId();
    return { ...data, id };
  }
  findResource(query) {
    let sql = 'SELECT * FROM resources WHERE 1=1';
    const params = [];
    if (query.id) {
      sql += ' AND id = ?';
      params.push(query.id);
    }
    if (query.name) {
      sql += ' AND name = ?';
      params.push(query.name);
    }
    sql += ' LIMIT 1';
    return this.get(sql, params);
  }
  findResources(query = {}) {
    let sql = 'SELECT * FROM resources WHERE 1=1';
    const params = [];
    if (query.availability) {
      sql += ' AND availability = ?';
      params.push(query.availability);
    }
    return this.all(sql, params);
  }
  updateResource(query, update) {
    const setClause = [];
    const params = [];
    Object.keys(update).forEach(key => {
      if (key !== 'id') {
        setClause.push(`${key} = ?`);
        params.push(update[key]);
      }
    });
    let sql = `UPDATE resources SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE 1=1`;
    if (query.id) {
      sql += ' AND id = ?';
      params.push(query.id);
    }
    this.run(sql, params);
    return this.findResource(query);
  }
  removeResource(query) {
    let sql = 'DELETE FROM resources WHERE 1=1';
    const params = [];
    if (query.id) {
      sql += ' AND id = ?';
      params.push(query.id);
    }
    const result = this.run(sql, params);
    return { deletedCount: result.changes };
  }
  // Resource Evaluation operations
  insertResourceEvaluation(data) {
    const sql = `INSERT INTO resource_evaluations (
      associate_id, associate_name, customer_name,
      resume_filename, resume_original_name, resume_path, resume_size, resume_uploaded_at,
      internal_evaluation_1_status, internal_evaluation_1_feedback,
      internal_evaluation_2_status, internal_evaluation_2_feedback,
      internal_evaluation_3_status, internal_evaluation_3_feedback,
      client_interview_status, client_interview_feedback,
      client_coding_evaluation_status, client_coding_evaluation_feedback,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const resume = data.resume || {};
    this.run(sql, [
      data.associateId, data.associateName, data.customerName,
      resume.filename, resume.originalName, resume.path, resume.size, resume.uploadedAt,
      data.internalEvaluation1Status, data.internalEvaluation1Feedback,
      data.internalEvaluation2Status, data.internalEvaluation2Feedback,
      data.internalEvaluation3Status, data.internalEvaluation3Feedback,
      data.clientInterviewStatus, data.clientInterviewFeedback,
      data.clientCodingEvaluationStatus, data.clientCodingEvaluationFeedback,
      data.status || 'pending'
    ]);
    const id = this.getLastInsertId();
    return { ...data, id };
  }
  findResourceEvaluation(query) {
    let sql = 'SELECT * FROM resource_evaluations WHERE 1=1';
    const params = [];
    if (query.id) {
      sql += ' AND id = ?';
      params.push(query.id);
    }
    if (query.associateId) {
      sql += ' AND associate_id = ?';
      params.push(query.associateId);
    }
    if (query._id) {
      sql += ' AND id = ?';
      params.push(query._id);
    }
    sql += ' LIMIT 1';
    const result = this.get(sql, params);
    // Convert back to NeDB-like format for compatibility
    if (result) {
      return this.convertResourceEvaluationFromSQL(result);
    }
    return null;
  }
  findResourceEvaluations(query = {}) {
    let sql = 'SELECT * FROM resource_evaluations WHERE 1=1';
    const params = [];
    if (query.status) {
      sql += ' AND status = ?';
      params.push(query.status);
    }
    sql += ' ORDER BY created_at DESC';
    const results = this.all(sql, params);
    return results.map(result => this.convertResourceEvaluationFromSQL(result));
  }
  updateResourceEvaluation(query, update) {
    const setClause = [];
    const params = [];
    // Handle $set operation (NeDB compatibility)
    const updateData = update.$set || update;
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== '_id') {
        // Convert camelCase to snake_case for SQL
        const sqlKey = this.camelToSnake(key);
        setClause.push(`${sqlKey} = ?`);
        params.push(updateData[key]);
      }
    });
    let sql = `UPDATE resource_evaluations SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE 1=1`;
    if (query.associateId) {
      sql += ' AND associate_id = ?';
      params.push(query.associateId);
    }
    if (query.id) {
      sql += ' AND id = ?';
      params.push(query.id);
    }
    if (query._id) {
      sql += ' AND id = ?';
      params.push(query._id);
    }
    const result = this.run(sql, params);
    return this.findResourceEvaluation(query);
  }
  removeResourceEvaluation(query) {
    let sql = 'DELETE FROM resource_evaluations WHERE 1=1';
    const params = [];
    if (query.id) {
      sql += ' AND id = ?';
      params.push(query.id);
    }
    if (query.associateId) {
      sql += ' AND associate_id = ?';
      params.push(query.associateId);
    }
    const result = this.run(sql, params);
    return { deletedCount: result.changes };
  }
  // Helper method to convert SQL result to NeDB-like format
  convertResourceEvaluationFromSQL(sqlResult) {
    return {
      _id: sqlResult.id,
      associateId: sqlResult.associate_id,
      associateName: sqlResult.associate_name,
      customerName: sqlResult.customer_name,
      resume: {
        filename: sqlResult.resume_filename,
        originalName: sqlResult.resume_original_name,
        path: sqlResult.resume_path,
        size: sqlResult.resume_size,
        uploadedAt: sqlResult.resume_uploaded_at
      },
      createdAt: sqlResult.created_at,
      updatedAt: sqlResult.updated_at,
      internalEvaluation1Status: sqlResult.internal_evaluation_1_status,
      internalEvaluation1Feedback: sqlResult.internal_evaluation_1_feedback,
      internalEvaluation2Status: sqlResult.internal_evaluation_2_status,
      internalEvaluation2Feedback: sqlResult.internal_evaluation_2_feedback,
      internalEvaluation3Status: sqlResult.internal_evaluation_3_status,
      internalEvaluation3Feedback: sqlResult.internal_evaluation_3_feedback,
      clientInterviewStatus: sqlResult.client_interview_status,
      clientInterviewFeedback: sqlResult.client_interview_feedback,
      clientCodingEvaluationStatus: sqlResult.client_coding_evaluation_status,
      clientCodingEvaluationFeedback: sqlResult.client_coding_evaluation_feedback,
      status: sqlResult.status
    };
  }
  // Helper method to convert camelCase to snake_case
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
  // Placeholder methods for other tables (to be implemented as needed)
  insertBooking(data) {
    // Implementation for bookings
    const sql = `INSERT INTO bookings (resource_id, user_id, project_name, start_date, end_date, status, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
    this.run(sql, [
      data.resourceId, data.userId, data.projectName, 
      data.startDate, data.endDate, data.status || 'pending', data.notes
    ]);
    const id = this.getLastInsertId();
    return { ...data, _id: id };
  }
  findBooking(query) {
    let sql = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];
    if (query._id || query.id) {
      sql += ' AND id = ?';
      params.push(query._id || query.id);
    }
    if (query.resourceId) {
      sql += ' AND resource_id = ?';
      params.push(query.resourceId);
    }
    sql += ' LIMIT 1';
    const result = this.get(sql, params);
    if (result) {
      return { ...result, _id: result.id, resourceId: result.resource_id, userId: result.user_id };
    }
    return null;
  }
  findBookings(query = {}) {
    let sql = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];
    if (query.status) {
      sql += ' AND status = ?';
      params.push(query.status);
    }
    const results = this.all(sql, params);
    return results.map(result => ({
      ...result, 
      _id: result.id, 
      resourceId: result.resource_id, 
      userId: result.user_id
    }));
  }
  updateBooking(query, update) {
    // Implementation for updating bookings
    const setClause = [];
    const params = [];
    Object.keys(update).forEach(key => {
      if (key !== 'id' && key !== '_id') {
        const sqlKey = key === 'resourceId' ? 'resource_id' : 
                       key === 'userId' ? 'user_id' : key;
        setClause.push(`${sqlKey} = ?`);
        params.push(update[key]);
      }
    });
    let sql = `UPDATE bookings SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE 1=1`;
    if (query._id || query.id) {
      sql += ' AND id = ?';
      params.push(query._id || query.id);
    }
    this.run(sql, params);
    return this.findBooking(query);
  }
  removeBooking(query) {
    let sql = 'DELETE FROM bookings WHERE 1=1';
    const params = [];
    if (query._id || query.id) {
      sql += ' AND id = ?';
      params.push(query._id || query.id);
    }
    const result = this.run(sql, params);
    return { deletedCount: result.changes };
  }
  insertNBLRecord(data) {
    const sql = `INSERT INTO nbl_list (name, email, skills, experience, upload_timestamp, file_name, file_path) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
    this.run(sql, [
      data.name, data.email, data.skills, data.experience,
      data.uploadTimestamp, data.fileName, data.filePath
    ]);
    const id = this.getLastInsertId();
    return { ...data, _id: id };
  }
  findNBLRecord(query) {
    let sql = 'SELECT * FROM nbl_list WHERE 1=1';
    const params = [];
    if (query._id || query.id) {
      sql += ' AND id = ?';
      params.push(query._id || query.id);
    }
    sql += ' LIMIT 1';
    const result = this.get(sql, params);
    if (result) {
      return { ...result, _id: result.id };
    }
    return null;
  }
  findNBLRecords(query = {}) {
    let sql = 'SELECT * FROM nbl_list WHERE 1=1 ORDER BY upload_timestamp DESC';
    const results = this.all(sql);
    return results.map(result => ({ ...result, _id: result.id }));
  }
  updateNBLRecord(query, update) {
    const setClause = [];
    const params = [];
    Object.keys(update).forEach(key => {
      if (key !== 'id' && key !== '_id') {
        setClause.push(`${key} = ?`);
        params.push(update[key]);
      }
    });
    let sql = `UPDATE nbl_list SET ${setClause.join(', ')} WHERE 1=1`;
    if (query._id || query.id) {
      sql += ' AND id = ?';
      params.push(query._id || query.id);
    }
    this.run(sql, params);
    return this.findNBLRecord(query);
  }
  removeNBLRecord(query) {
    let sql = 'DELETE FROM nbl_list WHERE 1=1';
    const params = [];
    if (query._id || query.id) {
      sql += ' AND id = ?';
      params.push(query._id || query.id);
    }
    const result = this.run(sql, params);
    return { deletedCount: result.changes };
  }
}
module.exports = new SQLiteDatabase();
