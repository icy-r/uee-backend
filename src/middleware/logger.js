const socketLoggerService = require('../services/socketLogger.service');

/**
 * Request/Response logging middleware
 * Captures and streams all API requests and responses via Socket.IO
 */
const requestLogger = (req, res, next) => {
  // Skip logging for log viewer endpoints to avoid recursion
  if (req.path.startsWith('/logs') || req.path.startsWith('/socket.io')) {
    return next();
  }

  const startTime = Date.now();
  
  // Capture request data
  const requestLog = {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'authorization': req.headers.authorization ? '***' : undefined
    },
    body: sanitizeBody(req.body),
    ip: req.ip || req.connection.remoteAddress
  };

  // Capture response by overriding res.json and res.send
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let responseSent = false;

  const logResponse = (body) => {
    if (responseSent) return;
    responseSent = true;

    const duration = Date.now() - startTime;
    
    let responseBody = body;
    try {
      responseBody = typeof body === 'string' ? JSON.parse(body) : body;
    } catch (e) {
      responseBody = body;
    }

    const logEntry = {
      type: res.statusCode >= 400 ? 'error' : 'success',
      request: requestLog,
      response: {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        body: sanitizeBody(responseBody),
        headers: {
          'content-type': res.getHeader('content-type')
        }
      },
      duration: `${duration}ms`
    };

    // Send to Socket.IO log service
    socketLoggerService.addLog(logEntry);
  };

  res.json = function(body) {
    logResponse(body);
    return originalJson(body);
  };

  res.send = function(body) {
    logResponse(body);
    return originalSend(body);
  };

  // Handle response end (for cases where json/send aren't used)
  res.on('finish', () => {
    if (!responseSent) {
      logResponse(null);
    }
  });

  next();
};

/**
 * Sanitize sensitive data from body
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  }

  return sanitized;
}

module.exports = requestLogger;
