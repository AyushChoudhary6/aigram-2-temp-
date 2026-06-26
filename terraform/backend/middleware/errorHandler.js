/**
 * Global Error Handler Middleware
 */

const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  console.error('Error:', {
    status,
    message,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle specific Azure errors
  if (err.name === 'RestError') {
    return res.status(err.statusCode || 500).json({
      error: 'Azure Service Error',
      message: err.message,
      code: err.code,
      statusCode: err.statusCode
    });
  }

  // Handle Cosmos DB errors
  if (err.code === 404) {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message || 'Resource not found'
    });
  }

  if (err.code === 409) {
    return res.status(409).json({
      error: 'Conflict',
      message: err.message || 'Resource already exists'
    });
  }

  // Generic error response
  res.status(status).json({
    error: {
      message: message,
      status: status,
      timestamp: new Date().toISOString()
    },
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
};

module.exports = {
  errorHandler
};
