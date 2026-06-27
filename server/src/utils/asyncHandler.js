// src/utils/asyncHandler.js
// Express 4 does NOT automatically catch errors thrown inside an `async`
// route handler — an unhandled rejection there just leaves the request
// hanging with no response, instead of hitting the error-handling
// middleware in index.js. Wrap every async route with this so errors
// always come back as a clean JSON 500 (or whatever status was set)
// instead of silently hanging.
module.exports = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
