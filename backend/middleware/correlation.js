const logger = require('../utils/logger');

// Middleware to add correlation ID to requests
const correlationMiddleware = (req, res, next) => {
  // Generate or extract correlation ID
  const correlationId = req.headers['x-correlation-id'] || logger.generateCorrelationId();
  
  // Add correlation ID to request object
  req.correlationId = correlationId;
  
  // Add correlation ID to response headers
  res.setHeader('x-correlation-id', correlationId);
  
  // Log the incoming request
  const startTime = Date.now();
  logger.apiRequest(correlationId, req.method, req.path, req.headers, req.body);
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(body) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    logger.apiResponse(correlationId, req.method, req.path, res.statusCode, responseTime, body);
    
    return originalJson.call(this, body);
  };
  
  // Override res.send to log responses
  const originalSend = res.send;
  res.send = function(body) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    logger.apiResponse(correlationId, req.method, req.path, res.statusCode, responseTime, body);
    
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = correlationMiddleware;
