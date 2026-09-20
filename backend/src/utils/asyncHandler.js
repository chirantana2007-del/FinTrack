// Express 4 does not forward a rejected promise from an async route handler
// to the error-handling middleware on its own — it just hangs the request.
// Wrap every async handler with this so failures reach errorHandler.js.
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
