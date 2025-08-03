// Frontend logging utility with correlation ID support
class FrontendLogger {
  constructor() {
    this.correlationId = this.generateCorrelationId();
    this.logToConsole = false; // Disabled to remove console output
  }
  generateCorrelationId() {
    return 'frontend-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  setCorrelationId(id) {
    this.correlationId = id;
  }
  formatTimestamp() {
    return new Date().toISOString();
  }
  formatLogEntry(level, component, operation, message, data = null) {
    return {
      timestamp: this.formatTimestamp(),
      level,
      correlationId: this.correlationId,
      component,
      operation,
      message,
      data
    };
  }
  log(level, component, operation, message, data = null) {
    const entry = this.formatLogEntry(level, component, operation, message, data);
    if (this.logToConsole) {
      // Console output disabled
    }
    // Store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
    }
  }
  info(component, operation, message, data = null) {
    this.log('INFO', component, operation, message, data);
  }
  error(component, operation, message, error = null, data = null) {
    const errorData = error ? {
      ...data,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    } : data;
    this.log('ERROR', component, operation, message, errorData);
  }
  warn(component, operation, message, data = null) {
    this.log('WARN', component, operation, message, data);
  }
  debug(component, operation, message, data = null) {
    this.log('DEBUG', component, operation, message, data);
  }
  // API call logging
  apiRequest(method, url, body = null) {
    this.log('API_REQ', 'API', 'REQUEST', `${method} ${url}`, {
      method,
      url,
      body: body ? JSON.stringify(body).substring(0, 500) : null,
      timestamp: this.formatTimestamp()
    });
  }
  apiResponse(method, url, status, data = null, duration = null) {
    this.log('API_RES', 'API', 'RESPONSE', `${method} ${url} - ${status}`, {
      method,
      url,
      status,
      duration: duration ? `${duration}ms` : null,
      data: data ? JSON.stringify(data).substring(0, 500) : null
    });
  }
  // Performance logging
  performance(component, operation, duration, metadata = null) {
    this.log('PERF', component, operation, `Operation completed in ${duration}ms`, {
      duration: `${duration}ms`,
      ...metadata
    });
  }
  // Get correlation ID for API calls
  getCorrelationId() {
    return this.correlationId;
  }
  // Get stored logs
  getLogs() {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch (error) {
      return [];
    }
  }
  // Clear stored logs
  clearLogs() {
    try {
      localStorage.removeItem('app_logs');
    } catch (error) {
    }
  }
}
// Create singleton instance
const logger = new FrontendLogger();
export default logger;
