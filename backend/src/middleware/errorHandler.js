/**
 * Central error handler — maps Fabric / validation errors to HTTP responses.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Fabric chaincode errors often arrive as generic Error with descriptive text
  const isChaincodeError =
    message.includes('chaincode') ||
    message.includes('letter of credit') ||
    message.includes('already exists') ||
    message.includes('cannot approve') ||
    message.includes('must be uploaded') ||
    message.includes('already been granted');

  const responseStatus = isChaincodeError && statusCode === 500 ? 400 : statusCode;

  console.error(`[${req.method} ${req.path}]`, message);
  if (statusCode >= 500) {
    console.error(err.stack);
  }

  res.status(responseStatus).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
