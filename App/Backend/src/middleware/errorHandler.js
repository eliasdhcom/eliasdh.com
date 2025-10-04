/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('API error:', err.message);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
        },
    });
};

module.exports = errorHandler;