const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogsDirectory();
  }
  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }
  generateCorrelationId() {
    return uuidv4();
  }
  formatTimestamp() {
    return new Date().toISOString();
  }
  writeToFile(filename, message) {
    const filePath = path.join(this.logsDir, filename);
    try {
      fs.appendFileSync(filePath, message + '\n');
    } catch (error) {
    }
  }
  formatLogEntry(level, correlationId, component, operation, message, data = null) {
    const entry = {
      timestamp: this.formatTimestamp(),
      level,
      correlationId,
      component,
      operation,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    return JSON.stringify(entry);
  }
  // Application logs
  info(correlationId, component, operation, message, data = null) {
    const logEntry = this.formatLogEntry('INFO', correlationId, component, operation, message, data);
    this.writeToFile('application.log', logEntry);
  }
  error(correlationId, component, operation, message, error = null, data = null) {
    const errorData = error ? {
      ...data,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    } : data;
    const logEntry = this.formatLogEntry('ERROR', correlationId, component, operation, message, errorData);
    this.writeToFile('error.log', logEntry);
  }
  warn(correlationId, component, operation, message, data = null) {
    const logEntry = this.formatLogEntry('WARN', correlationId, component, operation, message, data);
    this.writeToFile('application.log', logEntry);
  }
  debug(correlationId, component, operation, message, data = null) {
    const logEntry = this.formatLogEntry('DEBUG', correlationId, component, operation, message, data);
    this.writeToFile('debug.log', logEntry);
  }
  // Database operation logs
  dbOperation(correlationId, operation, sql, params = [], result = null, duration = null) {
    const logEntry = this.formatLogEntry('DB_OP', correlationId, 'DATABASE', operation, 'Database operation executed', {
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
      params,
      result: result ? {
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid,
        rowCount: Array.isArray(result) ? result.length : null
      } : null,
      duration: duration ? `${duration}ms` : null
    });
    this.writeToFile('database.log', logEntry);
  }
  // API request/response logs
  apiRequest(correlationId, method, path, headers = {}, body = null) {
    const logEntry = this.formatLogEntry('API_REQ', correlationId, 'API', 'REQUEST', `${method} ${path}`, {
      method,
      path,
      headers: this.sanitizeHeaders(headers),
      body: body ? JSON.stringify(body).substring(0, 500) + (JSON.stringify(body).length > 500 ? '...' : '') : null
    });
    this.writeToFile('api.log', logEntry);
  }
  apiResponse(correlationId, method, path, statusCode, responseTime = null, body = null) {
    const logEntry = this.formatLogEntry('API_RES', correlationId, 'API', 'RESPONSE', `${method} ${path} - ${statusCode}`, {
      method,
      path,
      statusCode,
      responseTime: responseTime ? `${responseTime}ms` : null,
      body: body ? JSON.stringify(body).substring(0, 500) + (JSON.stringify(body).length > 500 ? '...' : '') : null
    });
    this.writeToFile('api.log', logEntry);
  }
  // Performance and trace logs
  performance(correlationId, component, operation, duration, metadata = null) {
    const logEntry = this.formatLogEntry('PERF', correlationId, component, operation, `Operation completed in ${duration}ms`, {
      duration: `${duration}ms`,
      ...metadata
    });
    this.writeToFile('performance.log', logEntry);
  }
  trace(correlationId, component, operation, message, data = null) {
    const logEntry = this.formatLogEntry('TRACE', correlationId, component, operation, message, data);
    this.writeToFile('trace.log', logEntry);
  }
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    return sanitized;
  }
  // Audit logs for data changes
  audit(correlationId, userId, action, resource, before = null, after = null) {
    const logEntry = this.formatLogEntry('AUDIT', correlationId, 'AUDIT', action, `User ${userId} performed ${action} on ${resource}`, {
      userId,
      action,
      resource,
      before,
      after
    });
    this.writeToFile('audit.log', logEntry);
  }
}
// Create singleton instance
const logger = new Logger();
module.exports = logger;
