/**
 * Request Logging Middleware
 */

const logRequest = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  const logLevel = process.env.LOG_LEVEL || 'info';
  
  if (logLevel === 'debug' || logLevel === 'verbose') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Body:', JSON.stringify(req.body, null, 2));
    }
  }

  // Hook into response end to log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      console.error(logMessage);
    } else if (logLevel === 'info' || logLevel === 'verbose') {
      console.log(logMessage);
    }
  });

  next();
};

module.exports = {
  logRequest
};
