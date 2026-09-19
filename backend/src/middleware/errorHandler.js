function notFoundHandler(req, res) {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
    const status = err.statusCode || 500;
    if (status >= 500) {
        console.error(err);
    }
    res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { notFoundHandler, errorHandler };
